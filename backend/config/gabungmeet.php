<?php

return [
    'jwt_access_ttl_minutes' => (int) env('JWT_ACCESS_TTL_MINUTES', 15),
    'jwt_refresh_ttl_days' => (int) env('JWT_REFRESH_TTL_DAYS', 30),
    'payment_gateway' => env('PAYMENT_GATEWAY', 'midtrans'),
    'frontend_url' => env('FRONTEND_URL', 'http://localhost:3000'),
];
