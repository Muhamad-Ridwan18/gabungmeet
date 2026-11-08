<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\HandlesServiceErrors;
use App\Http\Controllers\Controller;
use App\Models\Profile;
use App\Models\RefreshToken;
use App\Models\Role;
use App\Models\User;
use App\Services\Verification\VerificationService;
use App\Support\PaginationMeta;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AdminUserController extends Controller
{
    use HandlesServiceErrors;

    public function __construct(private VerificationService $verification) {}

    public function index(Request $request)
    {
        [$page, $perPage] = PaginationMeta::normalize(
            (int) $request->query('page', 1),
            (int) $request->query('per_page', 20)
        );

        $query = User::query()->with(['profile', 'role', 'memberLevel']);
        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }
        if ($q = $request->query('q')) {
            $query->where(function ($builder) use ($q) {
                $builder->where('email', 'like', '%'.$q.'%')
                    ->orWhereHas('profile', fn ($p) => $p->where('full_name', 'like', '%'.$q.'%'));
            });
        }

        $total = (clone $query)->count();
        $items = $query->orderByDesc('created_at')
            ->offset(($page - 1) * $perPage)
            ->limit($perPage)
            ->get()
            ->map(fn (User $u) => $u->toApiArray())
            ->all();

        return $this->fromService(fn () => $this->paginated(fn () => [$items, $total], $page, $perPage));
    }

    public function show(string $id)
    {
        $user = User::query()->with(['profile', 'role', 'memberLevel', 'currentSubscription.plan'])->find($id);
        if (! $user) {
            return \App\Support\ApiResponse::fail('Not found', 404);
        }

        return $this->fromService(fn () => $user->toApiArray());
    }

    public function update(Request $request, string $id)
    {
        $user = User::query()->with('profile')->find($id);
        if (! $user) {
            return \App\Support\ApiResponse::fail('Not found', 404);
        }

        $data = $request->validate([
            'status' => ['nullable', 'string'],
            'role' => ['nullable', 'string'],
            'email' => ['nullable', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'full_name' => ['nullable', 'string', 'min:2', 'max:150'],
            'password' => ['nullable', 'string', 'min:8'],
        ]);

        if (isset($data['role'])) {
            if ($request->user()->role?->name !== 'super_admin') {
                return \App\Support\ApiResponse::fail('Forbidden', 403);
            }
            $role = Role::query()->where('name', $data['role'])->first();
            if ($role) {
                $user->role_id = $role->id;
            }
        }

        if (isset($data['status'])) {
            $user->status = $data['status'];
        }

        if (! empty($data['email'])) {
            $user->email = strtolower(trim($data['email']));
        }

        if (! empty($data['password'])) {
            $user->password = $data['password'];
        }

        $user->save();

        if (array_key_exists('full_name', $data) && $data['full_name'] !== null) {
            $name = trim($data['full_name']);
            if ($name !== '') {
                if ($user->profile) {
                    $user->profile->update(['full_name' => $name]);
                } else {
                    Profile::query()->create([
                        'user_id' => $user->id,
                        'full_name' => $name,
                        'timezone' => 'UTC',
                    ]);
                }
            }
        }

        return $this->fromService(
            fn () => $user->fresh(['profile', 'role', 'memberLevel'])->toApiArray(),
            'User updated'
        );
    }

    public function lock(string $id)
    {
        return $this->fromService(function () use ($id) {
            $this->verification->lockUser($id);

            return null;
        }, 'User locked');
    }

    public function unlock(string $id)
    {
        return $this->fromService(function () use ($id) {
            $this->verification->unlockUser($id);

            return null;
        }, 'User unlocked');
    }

    public function destroy(Request $request, string $id)
    {
        return $this->fromService(function () use ($request, $id) {
            $user = User::query()->with('role')->find($id);
            if (! $user) {
                throw new \RuntimeException('Not found', 404);
            }

            if ($request->user()->id === $user->id) {
                throw new \RuntimeException('You cannot delete your own account', 422);
            }

            $targetRole = $user->role?->name;
            if (in_array($targetRole, ['admin', 'super_admin'], true)
                && $request->user()->role?->name !== 'super_admin') {
                throw new \RuntimeException('Forbidden', 403);
            }

            $user->tokens()->delete();
            RefreshToken::query()
                ->where('user_id', $user->id)
                ->whereNull('revoked_at')
                ->update(['revoked_at' => now()]);

            // Free the unique email so the address can be registered again.
            $user->forceFill([
                'email' => 'deleted+'.$user->id.'@deleted.local',
            ])->save();

            $user->delete();

            return null;
        }, 'User deleted');
    }
}
