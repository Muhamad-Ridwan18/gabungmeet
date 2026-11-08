<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use App\Models\Plan;
use App\Models\Subscription;
use App\Support\ApiResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class BillingController extends Controller
{
    public function plans()
    {
        $plans = Plan::query()
            ->with('memberLevel')
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->get()
            ->map(fn (Plan $p) => [
                'id' => $p->id,
                'code' => $p->code,
                'name' => $p->name,
                'description' => $p->description,
                'billing_period' => $p->billing_period,
                'price_cents' => $p->price_cents,
                'currency' => $p->currency,
                'trial_days' => $p->trial_days,
                'features' => $p->features,
                'member_level' => $p->memberLevel?->code,
            ]);

        return ApiResponse::ok($plans);
    }

    public function mySubscription(Request $request)
    {
        $user = $request->user()->load(['currentSubscription.plan', 'memberLevel']);

        return ApiResponse::ok([
            'member_level' => $user->memberLevel?->code ?? 'free',
            'subscription' => $user->currentSubscription,
            'has_active' => $user->hasActiveSubscription(),
        ]);
    }

    /**
     * Start checkout — returns payment intent stub.
     * Next: wire Midtrans Snap / Xendit Invoice.
     */
    public function subscribe(Request $request)
    {
        $data = $request->validate([
            'plan_code' => ['required', 'string', 'exists:plans,code'],
            'gateway' => ['nullable', 'in:midtrans,xendit,manual'],
        ]);

        $plan = Plan::query()->where('code', $data['plan_code'])->where('is_active', true)->firstOrFail();
        $user = $request->user();
        $gateway = $data['gateway'] ?? config('santara.payment_gateway', 'midtrans');

        $subscription = Subscription::query()->create([
            'user_id' => $user->id,
            'plan_id' => $plan->id,
            'status' => 'incomplete',
            'gateway' => $gateway,
            'meta' => ['source' => 'api'],
        ]);

        $payment = Payment::query()->create([
            'user_id' => $user->id,
            'subscription_id' => $subscription->id,
            'plan_id' => $plan->id,
            'provider' => $gateway,
            'provider_ref' => 'PENDING-'.Str::upper(Str::random(10)),
            'invoice_number' => 'INV-'.now()->format('Ymd').'-'.Str::upper(Str::random(6)),
            'amount_cents' => $plan->price_cents,
            'currency' => $plan->currency,
            'status' => 'pending',
        ]);

        return ApiResponse::ok([
            'subscription_id' => $subscription->id,
            'payment_id' => $payment->id,
            'invoice_number' => $payment->invoice_number,
            'amount_cents' => $payment->amount_cents,
            'currency' => $payment->currency,
            'gateway' => $gateway,
            'checkout' => [
                'status' => 'stub',
                'message' => 'Payment gateway not wired yet. Call POST /v1/billing/webhooks/manual to simulate paid.',
            ],
        ], 'Checkout created', null, 201);
    }

    /** Dev/manual webhook simulator until Midtrans/Xendit is connected. */
    public function manualWebhook(Request $request)
    {
        if (! app()->environment(['local', 'development', 'testing'])) {
            return ApiResponse::fail('Forbidden', 403);
        }

        $data = $request->validate([
            'payment_id' => ['required', 'uuid', 'exists:payments,id'],
        ]);

        $payment = Payment::query()->with(['subscription.plan', 'user'])->findOrFail($data['payment_id']);
        $payment->forceFill([
            'status' => 'paid',
            'paid_at' => now(),
            'payment_method' => 'manual',
        ])->save();

        $sub = $payment->subscription;
        if ($sub) {
            $periodEnd = match ($sub->plan->billing_period) {
                'yearly' => now()->addYear(),
                'lifetime' => now()->addYears(100),
                default => now()->addMonth(),
            };

            $sub->forceFill([
                'status' => 'active',
                'current_period_start' => now(),
                'current_period_end' => $periodEnd,
            ])->save();

            $user = $payment->user;
            $user->forceFill([
                'current_subscription_id' => $sub->id,
                'member_level_id' => $sub->plan->member_level_id,
            ])->save();
        }

        return ApiResponse::ok([
            'payment' => $payment->fresh(),
            'subscription' => $sub?->fresh('plan'),
            'user' => $payment->user->fresh(['memberLevel', 'currentSubscription.plan'])->toApiArray(),
        ], 'Payment marked paid');
    }

    public function midtransWebhook(Request $request)
    {
        // Placeholder — verify signature + map transaction_status next.
        return ApiResponse::ok(['received' => true], 'Webhook accepted (stub)');
    }

    public function xenditWebhook(Request $request)
    {
        return ApiResponse::ok(['received' => true], 'Webhook accepted (stub)');
    }
}
