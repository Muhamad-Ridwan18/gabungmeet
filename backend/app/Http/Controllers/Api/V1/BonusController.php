<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\HandlesServiceErrors;
use App\Http\Controllers\Controller;
use App\Services\Bonus\BonusService;
use Illuminate\Http\Request;

class BonusController extends Controller
{
    use HandlesServiceErrors;

    public function __construct(private BonusService $bonus) {}

    public function index()
    {
        return $this->fromService(fn () => $this->bonus->list(false));
    }

    public function telegramLink()
    {
        return $this->fromService(fn () => $this->bonus->telegramLink());
    }
}
