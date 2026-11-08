<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Enterprise billing layer — independent from IB verification status.
 * Access rules can combine: verified MT5 + active subscription + member_level.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('member_levels', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('code', 50)->unique(); // free, basic, pro, elite
            $table->string('name');
            $table->unsignedSmallInteger('rank')->default(0); // higher = more privileges
            $table->json('benefits')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('plans', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('code', 50)->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->foreignUuid('member_level_id')->nullable()->constrained('member_levels')->nullOnDelete();
            $table->string('billing_period', 20)->default('monthly'); // monthly|yearly|lifetime
            $table->unsignedInteger('price_cents')->default(0);
            $table->string('currency', 3)->default('IDR');
            $table->unsignedInteger('trial_days')->default(0);
            $table->json('features')->nullable(); // feature flags / limits
            $table->string('gateway_plan_id')->nullable(); // Midtrans/Xendit product id
            $table->boolean('is_active')->default(true);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('subscriptions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUuid('plan_id')->constrained('plans');
            $table->string('status', 32)->default('incomplete')->index();
            // incomplete|trialing|active|past_due|canceled|expired
            $table->timestamp('trial_ends_at')->nullable();
            $table->timestamp('current_period_start')->nullable();
            $table->timestamp('current_period_end')->nullable();
            $table->timestamp('canceled_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->string('gateway', 32)->nullable(); // midtrans|xendit|stripe|manual
            $table->string('gateway_subscription_id')->nullable()->index();
            $table->json('meta')->nullable();
            $table->timestamps();
            $table->index(['user_id', 'status']);
        });

        Schema::create('payments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUuid('subscription_id')->nullable()->constrained('subscriptions')->nullOnDelete();
            $table->foreignUuid('plan_id')->nullable()->constrained('plans')->nullOnDelete();
            $table->string('provider', 32); // midtrans|xendit|stripe|manual
            $table->string('provider_ref')->nullable()->index();
            $table->string('invoice_number')->nullable()->unique();
            $table->unsignedInteger('amount_cents');
            $table->string('currency', 3)->default('IDR');
            $table->string('status', 32)->default('pending')->index();
            // pending|paid|failed|refunded|expired
            $table->string('payment_method')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->json('raw_payload')->nullable();
            $table->timestamps();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->foreignUuid('member_level_id')->nullable()->after('role_id')->constrained('member_levels')->nullOnDelete();
            $table->foreignUuid('current_subscription_id')->nullable()->after('member_level_id');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropConstrainedForeignId('member_level_id');
            $table->dropColumn('current_subscription_id');
        });
        Schema::dropIfExists('payments');
        Schema::dropIfExists('subscriptions');
        Schema::dropIfExists('plans');
        Schema::dropIfExists('member_levels');
    }
};
