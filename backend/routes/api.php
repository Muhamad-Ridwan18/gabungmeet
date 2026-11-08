<?php

use App\Http\Controllers\Api\V1\AdminAiController;
use App\Http\Controllers\Api\V1\AdminBrandingController;
use App\Http\Controllers\Api\V1\BrandingController;
use App\Http\Controllers\Api\V1\AdminBonusController;
use App\Http\Controllers\Api\V1\AdminContentController;
use App\Http\Controllers\Api\V1\AdminMemberHomeController;
use App\Http\Controllers\Api\V1\AdminOnboardingVideosController;
use App\Http\Controllers\Api\V1\AdminLandingHookVideoController;
use App\Http\Controllers\Api\V1\AdminJournalController;
use App\Http\Controllers\Api\V1\AdminTelegramController;
use App\Http\Controllers\Api\V1\AdminTicketController;
use App\Http\Controllers\Api\V1\AdminUserController;
use App\Http\Controllers\Api\V1\AiController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\BillingController;
use App\Http\Controllers\Api\V1\BonusController;
use App\Http\Controllers\Api\V1\ContentController;
use App\Http\Controllers\Api\V1\HealthController;
use App\Http\Controllers\Api\V1\JournalController;
use App\Http\Controllers\Api\V1\LandingHookVideoController;
use App\Http\Controllers\Api\V1\MemberHomeController;
use App\Http\Controllers\Api\V1\NotificationController;
use App\Http\Controllers\Api\V1\OnboardingController;
use App\Http\Controllers\Api\V1\SettingsController;
use App\Http\Controllers\Api\V1\SignalController;
use App\Http\Controllers\Api\V1\TicketController;
use App\Http\Controllers\Api\V1\UploadController;
use App\Http\Controllers\Api\V1\VerificationController;
use Illuminate\Support\Facades\Route;

Route::get('/health', [HealthController::class, 'health']);
Route::get('/ready', [HealthController::class, 'ready']);

Route::prefix('v1')->group(function () {
    // Auth (public)
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::post('/auth/refresh', [AuthController::class, 'refresh']);
    Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/auth/reset-password', [AuthController::class, 'resetPassword']);

    // Billing webhooks + public plans
    Route::post('/billing/webhooks/midtrans', [BillingController::class, 'midtransWebhook']);
    Route::post('/billing/webhooks/xendit', [BillingController::class, 'xenditWebhook']);
    Route::post('/billing/webhooks/manual', [BillingController::class, 'manualWebhook']);
    Route::get('/billing/plans', [BillingController::class, 'plans']);

    // Public settings
    Route::get('/settings/public', [SettingsController::class, 'publicSettings']);
    Route::get('/settings/branding', [BrandingController::class, 'show']);
    Route::get('/landing/hook-video', [LandingHookVideoController::class, 'show']);

    // Optional auth routes
    Route::middleware('optional.auth')->group(function () {
        Route::get('/categories', [ContentController::class, 'listCategories']);
        Route::get('/contents', [ContentController::class, 'index']);
        Route::get('/contents/{slug}', [ContentController::class, 'show']);
        Route::post('/ai/chat', [AiController::class, 'chat']);
        Route::post('/tickets', [TicketController::class, 'store']);
    });

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/auth/me', [AuthController::class, 'me']);
        Route::patch('/auth/me', [AuthController::class, 'updateProfile']);
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/member/home', [MemberHomeController::class, 'show']);

        // Billing (authenticated)
        Route::get('/billing/subscription', [BillingController::class, 'mySubscription']);
        Route::post('/billing/subscribe', [BillingController::class, 'subscribe']);

        // Onboarding
        Route::get('/onboarding', [OnboardingController::class, 'show']);
        Route::post('/onboarding/start', [OnboardingController::class, 'start']);
        Route::post('/onboarding/step/1/complete', [OnboardingController::class, 'completeStep1']);
        Route::post('/onboarding/step/2/complete', [OnboardingController::class, 'completeStep2']);
        Route::post('/onboarding/step/3', [OnboardingController::class, 'submitStep3']);
        Route::post('/onboarding/step/4', [OnboardingController::class, 'completeStep4']);
        Route::post('/onboarding/step/5/complete', [OnboardingController::class, 'completeStep5']);

        // Verifications (member)
        Route::get('/verifications/me', [VerificationController::class, 'me']);
        Route::post('/verifications/resubmit', [VerificationController::class, 'resubmit']);

        // Notifications
        Route::get('/notifications', [NotificationController::class, 'index']);
        Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
        Route::post('/notifications/{id}/read', [NotificationController::class, 'markRead']);
        Route::post('/notifications/read-all', [NotificationController::class, 'markAllRead']);

        // Uploads
        Route::post('/uploads', [UploadController::class, 'store']);

        // Tickets (authenticated)
        Route::get('/tickets/me', [TicketController::class, 'me']);
        Route::get('/tickets/{id}', [TicketController::class, 'show']);
        Route::post('/tickets/{id}/messages', [TicketController::class, 'addMessage']);

        // AI conversations
        Route::get('/ai/conversations/me', [AiController::class, 'conversationsMe']);

        // Verified member routes
        Route::middleware('verified.member')->group(function () {
            Route::get('/contents/continue', [ContentController::class, 'continue']);
            Route::get('/bookmarks', [ContentController::class, 'listBookmarks']);
            Route::post('/bookmarks', [ContentController::class, 'addBookmark']);
            Route::delete('/bookmarks/{contentId}', [ContentController::class, 'removeBookmark']);
            Route::post('/history/{contentId}', [ContentController::class, 'upsertHistory']);
            Route::get('/history', [ContentController::class, 'listHistory']);

            Route::get('/signals', [SignalController::class, 'index']);
            Route::get('/signals/{id}', [SignalController::class, 'show']);

            Route::get('/journals', [JournalController::class, 'index']);
            Route::post('/journals', [JournalController::class, 'store']);
            Route::get('/journals/{id}', [JournalController::class, 'show']);
            Route::put('/journals/{id}', [JournalController::class, 'update']);
            Route::delete('/journals/{id}', [JournalController::class, 'destroy']);

            Route::get('/bonuses', [BonusController::class, 'index']);
            Route::get('/telegram-link', [BonusController::class, 'telegramLink']);
        });

        // Admin routes
        Route::middleware('admin')->prefix('admin')->group(function () {
            Route::get('/verifications', [VerificationController::class, 'adminIndex']);
            Route::get('/verifications/{id}', [VerificationController::class, 'adminShow']);
            Route::post('/verifications/{id}/approve', [VerificationController::class, 'approve']);
            Route::post('/verifications/{id}/reject', [VerificationController::class, 'reject']);
            Route::delete('/verifications/{id}', [VerificationController::class, 'destroy']);

            Route::post('/users/{id}/lock', [AdminUserController::class, 'lock']);
            Route::post('/users/{id}/unlock', [AdminUserController::class, 'unlock']);
            Route::get('/users', [AdminUserController::class, 'index']);
            Route::get('/users/{id}', [AdminUserController::class, 'show']);
            Route::patch('/users/{id}', [AdminUserController::class, 'update']);
            Route::delete('/users/{id}', [AdminUserController::class, 'destroy']);

            Route::get('/categories', [AdminContentController::class, 'listCategories']);
            Route::post('/categories', [AdminContentController::class, 'createCategory']);
            Route::put('/categories/{id}', [AdminContentController::class, 'updateCategory']);
            Route::delete('/categories/{id}', [AdminContentController::class, 'deleteCategory']);

            Route::get('/contents', [AdminContentController::class, 'index']);
            Route::post('/contents/reorder', [AdminContentController::class, 'reorder']);
            Route::get('/contents/{id}', [AdminContentController::class, 'show']);
            Route::post('/contents', [AdminContentController::class, 'store']);
            Route::put('/contents/{id}', [AdminContentController::class, 'update']);
            Route::delete('/contents/{id}', [AdminContentController::class, 'destroy']);
            Route::post('/contents/{id}/publish', [AdminContentController::class, 'publish']);

            Route::get('/signals', [AdminTelegramController::class, 'show']);
            Route::put('/signals', [AdminTelegramController::class, 'update']);

            Route::get('/journals', [AdminJournalController::class, 'index']);

            Route::get('/bonuses', [AdminBonusController::class, 'index']);
            Route::post('/bonuses', [AdminBonusController::class, 'store']);
            Route::put('/bonuses/{id}', [AdminBonusController::class, 'update']);
            Route::delete('/bonuses/{id}', [AdminBonusController::class, 'destroy']);

            Route::get('/tickets', [AdminTicketController::class, 'index']);
            Route::get('/tickets/{id}', [AdminTicketController::class, 'show']);
            Route::post('/tickets/{id}/messages', [AdminTicketController::class, 'addMessage']);
            Route::patch('/tickets/{id}/status', [AdminTicketController::class, 'patchStatus']);

            Route::get('/ai/conversations', [AdminAiController::class, 'index']);
            Route::get('/ai/conversations/{id}', [AdminAiController::class, 'show']);

            Route::post('/uploads', [UploadController::class, 'storeAdmin']);
            Route::post('/uploads/video', [UploadController::class, 'storeAdminVideo']);

            Route::get('/landing/hook-video', [AdminLandingHookVideoController::class, 'show']);
            Route::put('/landing/hook-video', [AdminLandingHookVideoController::class, 'update']);

            Route::get('/branding', [AdminBrandingController::class, 'show']);
            Route::put('/branding', [AdminBrandingController::class, 'update']);

            Route::get('/member/home', [AdminMemberHomeController::class, 'show']);
            Route::put('/member/home', [AdminMemberHomeController::class, 'update']);

            Route::get('/onboarding/videos', [AdminOnboardingVideosController::class, 'show']);
            Route::put('/onboarding/videos', [AdminOnboardingVideosController::class, 'update']);

            Route::get('/plans', [BillingController::class, 'plans']);
        });
    });
});
