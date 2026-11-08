<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\Auth\AuthService;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function __construct(private AuthService $auth) {}

    public function register(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'full_name' => ['required', 'string', 'min:2', 'max:150'],
            'whatsapp' => ['required', 'string', 'min:8', 'max:30', 'regex:/^\+?[0-9\s\-()]{8,30}$/'],
            'accept_terms' => ['required', 'accepted'],
        ]);

        $payload = $this->auth->register(
            $data['email'],
            $data['password'],
            $data['full_name'],
            $data['whatsapp'],
        );

        return ApiResponse::ok($payload, 'Registered', null, 201);
    }

    public function login(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $payload = $this->auth->login($data['email'], $data['password']);
        if (! $payload) {
            return ApiResponse::fail('Invalid email or password', 401);
        }

        return ApiResponse::ok($payload, 'OK');
    }

    public function me(Request $request)
    {
        return ApiResponse::ok($request->user()->toApiArray());
    }

    public function updateProfile(Request $request)
    {
        $data = $request->validate([
            'email' => ['sometimes', 'email', 'max:255'],
            'full_name' => ['sometimes', 'string', 'min:2', 'max:150'],
            'current_password' => ['nullable', 'string'],
            'password' => ['nullable', 'string', 'min:8'],
        ]);

        if (! empty($data['password']) && empty($data['current_password'])) {
            throw ValidationException::withMessages([
                'current_password' => ['Current password is required to set a new password.'],
            ]);
        }

        $user = $this->auth->updateProfile($request->user(), $data);

        return ApiResponse::ok($user, 'Profile updated');
    }

    public function logout(Request $request)
    {
        $this->auth->logout($request->user(), $request->input('refresh_token'));

        return ApiResponse::ok(null, 'Logged out');
    }

    public function refresh(Request $request)
    {
        $data = $request->validate([
            'refresh_token' => ['required', 'string'],
        ]);

        $payload = $this->auth->refresh($data['refresh_token']);
        if (! $payload) {
            return ApiResponse::fail('Invalid or expired refresh token', 401);
        }

        return ApiResponse::ok($payload, 'OK');
    }

    public function forgotPassword(Request $request)
    {
        $request->validate(['email' => ['required', 'email']]);

        // Stub: production will send mail. Dev returns flag only.
        return ApiResponse::ok([
            'sent' => true,
            'dev_reset_token' => app()->environment('local') ? 'dev-reset-stub' : null,
        ], 'If the email exists, a reset link was sent');
    }

    public function resetPassword(Request $request)
    {
        $request->validate([
            'token' => ['required', 'string'],
            'new_password' => ['required', 'string', 'min:8'],
        ]);

        throw ValidationException::withMessages([
            'token' => ['Password reset via mail is not wired yet. Use admin reset or implement mailer next.'],
        ]);
    }
}
