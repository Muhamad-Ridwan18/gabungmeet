#!/bin/bash
echo ===FAIL_CODES===
sudo grep -E '/v1/admin/verifications/.*/(approve|reject|delete)' /var/log/nginx/access.log | awk '{print $7, $9}' | sort | uniq -c | sort -rn | head -40
echo ===RECENT_ACTIONS===
sudo grep -E '/v1/admin/verifications/.*/(approve|reject|delete)' /var/log/nginx/access.log | tail -80
echo ===DB===
cd /var/www/ib-comunity/backend
sudo -u www-data php <<'PHP'
<?php
require "vendor/autoload.php";
$app = require "bootstrap/app.php";
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
echo "pending=".App\Models\VerificationRequest::where("status","pending")->count()."\n";
echo "pending_no_proof=".App\Models\VerificationRequest::where("status","pending")->where(function($q){$q->whereNull("proof_key")->orWhere("proof_key","");})->count()."\n";
echo "draft=".App\Models\VerificationRequest::where("status","draft")->count()."\n";
foreach (App\Models\VerificationRequest::with("user")->orderByDesc("updated_at")->limit(15)->get() as $r) {
  echo $r->updated_at." | ".$r->status." | proof=".($r->proof_key?"Y":"N")." | user=".($r->user->email??"?")."|".($r->user->status??"?")."\n";
}
PHP
