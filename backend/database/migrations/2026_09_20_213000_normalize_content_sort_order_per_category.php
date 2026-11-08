<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $modules = DB::table('contents')->distinct()->pluck('module');

        foreach ($modules as $module) {
            $categoryIds = DB::table('contents')
                ->where('module', $module)
                ->whereNull('deleted_at')
                ->distinct()
                ->pluck('category_id');

            foreach ($categoryIds as $categoryId) {
                $query = DB::table('contents')
                    ->where('module', $module)
                    ->whereNull('deleted_at')
                    ->orderBy('sort_order')
                    ->orderByDesc('published_at')
                    ->orderBy('created_at');

                if ($categoryId === null) {
                    $query->whereNull('category_id');
                } else {
                    $query->where('category_id', $categoryId);
                }

                foreach ($query->get(['id']) as $index => $row) {
                    DB::table('contents')->where('id', $row->id)->update(['sort_order' => $index]);
                }
            }
        }
    }

    public function down(): void
    {
        // Irreversible data normalization.
    }
};
