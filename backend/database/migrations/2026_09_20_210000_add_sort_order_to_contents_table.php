<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('contents', function (Blueprint $table) {
            $table->unsignedInteger('sort_order')->default(0)->after('status');
            $table->index(['module', 'sort_order']);
        });

        $modules = DB::table('contents')->distinct()->pluck('module');
        foreach ($modules as $module) {
            $rows = DB::table('contents')
                ->where('module', $module)
                ->whereNull('deleted_at')
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
        Schema::table('contents', function (Blueprint $table) {
            $table->dropIndex(['module', 'sort_order']);
            $table->dropColumn('sort_order');
        });
    }
};
