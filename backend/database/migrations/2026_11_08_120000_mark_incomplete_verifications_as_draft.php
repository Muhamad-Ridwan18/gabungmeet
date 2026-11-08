<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Incomplete submissions used to appear as pending before proof upload / final submit.
        DB::table('verification_requests')
            ->where('status', 'pending')
            ->where(function ($q) {
                $q->whereNull('proof_key')->orWhere('proof_key', '');
            })
            ->update(['status' => 'draft', 'updated_at' => now()]);

        // Also demote rows that are still mid-onboarding (never final-submitted).
        $ids = DB::table('verification_requests as v')
            ->join('users as u', 'u.id', '=', 'v.user_id')
            ->where('v.status', 'pending')
            ->whereIn('u.status', ['onboarding', 'registered'])
            ->pluck('v.id');

        if ($ids->isNotEmpty()) {
            DB::table('verification_requests')
                ->whereIn('id', $ids)
                ->update(['status' => 'draft', 'updated_at' => now()]);
        }
    }

    public function down(): void
    {
        DB::table('verification_requests')
            ->where('status', 'draft')
            ->update(['status' => 'pending', 'updated_at' => now()]);
    }
};
