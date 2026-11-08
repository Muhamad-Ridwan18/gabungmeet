<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('categories', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('module', 50)->index();
            $table->string('name');
            $table->string('slug')->unique();
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('contents', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('module', 50)->index();
            $table->string('type', 20);
            $table->foreignUuid('category_id')->nullable()->constrained('categories')->nullOnDelete();
            $table->string('title');
            $table->string('slug')->unique();
            $table->text('excerpt')->nullable();
            $table->longText('body')->nullable();
            $table->string('thumbnail_url')->nullable();
            $table->string('video_url')->nullable();
            $table->unsignedInteger('duration_sec')->nullable();
            $table->boolean('is_premium')->default(true);
            $table->string('min_plan_code', 50)->nullable();
            $table->string('status', 20)->default('draft')->index();
            $table->timestamp('published_at')->nullable();
            $table->foreignUuid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();
        });

        Schema::create('bookmarks', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUuid('content_id')->constrained('contents')->cascadeOnDelete();
            $table->timestamps();
            $table->unique(['user_id', 'content_id']);
        });

        Schema::create('view_histories', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignUuid('content_id')->constrained('contents')->cascadeOnDelete();
            $table->unsignedTinyInteger('progress_pct')->default(0);
            $table->unsignedInteger('last_position_sec')->default(0);
            $table->boolean('completed')->default(false);
            $table->timestamps();
            $table->unique(['user_id', 'content_id']);
        });

        Schema::create('signals', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('pair', 32);
            $table->string('direction', 8);
            $table->decimal('entry', 18, 6)->nullable();
            $table->decimal('sl', 18, 6)->nullable();
            $table->decimal('tp', 18, 6)->nullable();
            $table->text('analysis')->nullable();
            $table->string('chart_key')->nullable();
            $table->string('status', 20)->default('active')->index();
            $table->string('result', 10)->nullable();
            $table->string('min_plan_code', 50)->nullable();
            $table->timestamp('published_at')->nullable();
            $table->foreignUuid('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('trading_journals', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('pair', 32);
            $table->string('direction', 8);
            $table->timestamp('traded_at');
            $table->decimal('entry', 18, 6)->nullable();
            $table->decimal('exit', 18, 6)->nullable();
            $table->decimal('sl', 18, 6)->nullable();
            $table->decimal('tp', 18, 6)->nullable();
            $table->string('result', 10)->nullable();
            $table->decimal('rr', 10, 4)->nullable();
            $table->string('emotion')->nullable();
            $table->string('screenshot_key')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        Schema::create('bonuses', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('file_key')->nullable();
            $table->string('file_url')->nullable();
            $table->string('external_url')->nullable();
            $table->string('min_plan_code', 50)->nullable();
            $table->boolean('is_active')->default(true);
            $table->unsignedSmallInteger('sort_order')->default(0);
            $table->timestamps();
        });

        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('type', 64)->default('system');
            $table->string('title');
            $table->text('body')->nullable();
            $table->string('link')->nullable();
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
        });

        Schema::create('tickets', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('name')->nullable();
            $table->string('email')->nullable();
            $table->string('telegram_username')->nullable();
            $table->string('topic');
            $table->text('description');
            $table->string('status', 20)->default('open')->index();
            $table->foreignUuid('assigned_to')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('ticket_messages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('ticket_id')->constrained('tickets')->cascadeOnDelete();
            $table->foreignUuid('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('sender_type', 20)->default('user');
            $table->text('body');
            $table->string('attachment_key')->nullable();
            $table->timestamps();
        });

        Schema::create('ai_conversations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('session_key')->unique();
            $table->timestamps();
        });

        Schema::create('ai_messages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('conversation_id')->constrained('ai_conversations')->cascadeOnDelete();
            $table->string('role', 20);
            $table->text('content');
            $table->string('intent')->nullable();
            $table->string('redirect_path')->nullable();
            $table->boolean('failed_attempt')->default(false);
            $table->timestamps();
        });

        Schema::create('ai_knowledge', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('title');
            $table->json('keywords')->nullable();
            $table->text('answer');
            $table->string('redirect_path')->nullable();
            $table->unsignedSmallInteger('priority')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_knowledge');
        Schema::dropIfExists('ai_messages');
        Schema::dropIfExists('ai_conversations');
        Schema::dropIfExists('ticket_messages');
        Schema::dropIfExists('tickets');
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('bonuses');
        Schema::dropIfExists('trading_journals');
        Schema::dropIfExists('signals');
        Schema::dropIfExists('view_histories');
        Schema::dropIfExists('bookmarks');
        Schema::dropIfExists('contents');
        Schema::dropIfExists('categories');
    }
};
