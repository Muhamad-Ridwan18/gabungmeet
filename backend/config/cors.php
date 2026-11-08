<?php

$origins = array_values(array_filter(array_map(
    static fn (string $origin) => rtrim(trim($origin), '/'),
    explode(',', (string) env('FRONTEND_URL', 'http://localhost:3000'))
)));

return [
    'paths' => ['v1/*', 'health', 'ready', 'up', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    'allowed_origins' => $origins,

    'allowed_origins_patterns' => [
        '#^https://([a-z0-9-]+\.)?santarapips\.com$#',
        '#^https://.*\.vercel\.app$#',
    ],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,
];
