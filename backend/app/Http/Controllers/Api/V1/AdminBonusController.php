<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\HandlesServiceErrors;
use App\Http\Controllers\Controller;
use App\Services\Bonus\BonusService;
use Illuminate\Http\Request;

class AdminBonusController extends Controller
{
    use HandlesServiceErrors;

    public function __construct(private BonusService $bonus) {}

    public function index()
    {
        return $this->fromService(fn () => $this->bonus->list(true));
    }

    public function store(Request $request)
    {
        return $this->fromService(
            fn () => $this->bonus->create($request->all()),
            'Bonus created',
            201
        );
    }

    public function update(Request $request, string $id)
    {
        return $this->fromService(fn () => $this->bonus->update($id, $request->all()), 'Bonus updated');
    }

    public function destroy(string $id)
    {
        return $this->fromService(function () use ($id) {
            $this->bonus->delete($id);

            return null;
        }, 'Bonus deleted');
    }
}
