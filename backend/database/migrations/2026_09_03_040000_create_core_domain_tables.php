<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('refresh_tokens', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('token_hash');
            $table->timestamp('expires_at');
            $table->timestamp('revoked_at')->nullable();
            $table->text('user_agent')->nullable();
            $table->string('ip', 64)->nullable();
            $table->timestamps();
            $table->index('user_id');
        });

        Schema::create('onboarding_progress', function (Blueprint $table) {
            $table->foreignUuid('user_id')->primary()->constrained('users')->cascadeOnDelete();
            $table->smallInteger('current_step')->default(1);
            $table->timestamp('step1_done_at')->nullable();
            $table->timestamp('step2_done_at')->nullable();
            $table->timestamp('step3_done_at')->nullable();
            $table->timestamp('step4_done_at')->nullable();
            $table->timestamp('step5_done_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('verification_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('mt5_account', 64);
            $table->string('broker_server', 128);
            $table->string('proof_key')->nullable();
            $table->string('status', 32)->default('pending')->index();
            $table->text('rejection_reason')->nullable();
            $table->foreignUuid('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
        });

        Schema::create('settings', function (Blueprint $table) {
            $table->string('key')->primary();
            $table->text('value')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('settings');
        Schema::dropIfExists('verification_requests');
        Schema::dropIfExists('onboarding_progress');
        Schema::dropIfExists('refresh_tokens');
    }
};
