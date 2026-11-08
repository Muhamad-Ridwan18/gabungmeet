<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $modules = DB::table('contents')->distinct()->pluck('module');

        foreach ($modules as $module) {
            $rows = DB::table('contents')
                ->where('module', $module)
                ->whereNull('deleted_at')
                ->orderBy('sort_order')
                ->orderByDesc('published_at')
                ->orderBy('created_at')
                ->get(['id']);

            foreach ($rows as $index => $row) {
                DB::table('contents')->where('id', $row->id)->update(['sort_order' => $index]);
            }
        }
    }

    public function down(): void
    {
        // Irreversible data normalization.
    }
};
