<?php

namespace App\Support;

class PaginationMeta
{
    public static function normalize(int $page, int $perPage): array
    {
        $page = max(1, $page);
        $perPage = max(1, min(100, $perPage ?: 20));

        return [$page, $perPage];
    }

    public static function make(int $page, int $perPage, int $total): array
    {
        $totalPages = $perPage > 0 ? (int) ceil($total / $perPage) : 0;

        return [
            'page' => $page,
            'per_page' => $perPage,
            'total' => $total,
            'total_pages' => $totalPages,
        ];
    }
}
