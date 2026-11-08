<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\HandlesServiceErrors;
use App\Http\Controllers\Controller;
use App\Services\Settings\SettingsService;
use Illuminate\Http\Request;

class AdminTelegramController extends Controller
{
    use HandlesServiceErrors;

    public function __construct(private SettingsService $settings) {}

    public function show()
    {
        return $this->fromService(fn () => [
            'telegram_invite_url' => $this->settings->getTelegramInviteUrl(),
        ]);
    }

    public function update(Request $request)
    {
        $data = $request->validate([
            'telegram_invite_url' => ['nullable', 'string', 'max:500'],
        ]);

        return $this->fromService(
            fn () => $this->settings->setTelegramInviteUrl((string) ($data['telegram_invite_url'] ?? '')),
            'Telegram link updated'
        );
    }
}
