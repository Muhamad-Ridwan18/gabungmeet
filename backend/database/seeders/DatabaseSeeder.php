<?php

namespace Database\Seeders;

use App\Models\AiKnowledge;
use App\Models\Bonus;
use App\Models\Category;
use App\Models\Content;
use App\Models\MemberLevel;
use App\Models\OnboardingProgress;
use App\Models\Plan;
use App\Models\Profile;
use App\Models\Role;
use App\Models\Signal;
use App\Models\User;
use App\Models\ViewHistory;
use App\Services\Settings\SettingsService;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        foreach ([
            ['name' => 'member', 'description' => 'Standard member'],
            ['name' => 'admin', 'description' => 'Operations admin'],
            ['name' => 'super_admin', 'description' => 'Full access'],
        ] as $role) {
            Role::query()->firstOrCreate(['name' => $role['name']], [
                'id' => (string) Str::uuid(),
                'description' => $role['description'],
            ]);
        }

        $levelIds = [];
        foreach ([
            ['code' => 'free', 'name' => 'Free', 'rank' => 0, 'benefits' => ['browse_public']],
            ['code' => 'basic', 'name' => 'Basic', 'rank' => 10, 'benefits' => ['signals', 'journal']],
            ['code' => 'pro', 'name' => 'Pro', 'rank' => 20, 'benefits' => ['signals', 'journal', 'bonuses', 'telegram']],
            ['code' => 'elite', 'name' => 'Elite', 'rank' => 30, 'benefits' => ['all', 'priority_support']],
        ] as $level) {
            $row = MemberLevel::query()->firstOrCreate(['code' => $level['code']], [
                'id' => (string) Str::uuid(),
                'name' => $level['name'],
                'rank' => $level['rank'],
                'benefits' => $level['benefits'],
                'is_active' => true,
            ]);
            $levelIds[$level['code']] = $row->id;
        }

        foreach ([
            ['code' => 'free', 'name' => 'Free', 'description' => 'Browse public education', 'member_level' => 'free', 'billing_period' => 'monthly', 'price_cents' => 0, 'features' => ['public_content'], 'sort_order' => 0],
            ['code' => 'basic_monthly', 'name' => 'Basic Monthly', 'description' => 'Signals + journal', 'member_level' => 'basic', 'billing_period' => 'monthly', 'price_cents' => 199000, 'features' => ['signals', 'journal'], 'sort_order' => 10],
            ['code' => 'pro_monthly', 'name' => 'Pro Monthly', 'description' => 'Full desk + Telegram', 'member_level' => 'pro', 'billing_period' => 'monthly', 'price_cents' => 399000, 'features' => ['signals', 'journal', 'bonuses', 'telegram'], 'sort_order' => 20],
            ['code' => 'elite_yearly', 'name' => 'Elite Yearly', 'description' => 'All features + priority support', 'member_level' => 'elite', 'billing_period' => 'yearly', 'price_cents' => 3990000, 'features' => ['all', 'priority_support'], 'sort_order' => 30],
        ] as $plan) {
            Plan::query()->firstOrCreate(['code' => $plan['code']], [
                'id' => (string) Str::uuid(),
                'name' => $plan['name'],
                'description' => $plan['description'],
                'member_level_id' => $levelIds[$plan['member_level']],
                'billing_period' => $plan['billing_period'],
                'price_cents' => $plan['price_cents'],
                'currency' => 'IDR',
                'trial_days' => 0,
                'features' => $plan['features'],
                'is_active' => true,
                'sort_order' => $plan['sort_order'],
            ]);
        }

        app(SettingsService::class)->ensureDefaults();

        $super = $this->seedUser('super@ib.local', 'super_admin', User::STATUS_VERIFIED, 'Super Admin', $levelIds['elite'], 5, true);
        $this->seedUser('member@ib.local', 'member', User::STATUS_ONBOARDING, 'Demo Member', $levelIds['free'], 1, false);
        $verified = $this->seedUser('verified@ib.local', 'member', User::STATUS_VERIFIED, 'Verified Member', $levelIds['free'], 5, true);
        $this->seedUser('admin@ib.local', 'admin', User::STATUS_VERIFIED, 'Demo Admin', $levelIds['pro'], 5, true);

        // Legacy FE aliases
        $this->seedUser('member@santara.local', 'member', User::STATUS_ONBOARDING, 'Member Demo', $levelIds['free'], 1, false);
        $this->seedUser('verified@santara.local', 'member', User::STATUS_VERIFIED, 'Verified Demo', $levelIds['free'], 5, true);
        $this->seedUser('admin@santara.local', 'admin', User::STATUS_VERIFIED, 'Admin Demo', $levelIds['pro'], 5, true);
        $this->seedUser('super@santara.local', 'super_admin', User::STATUS_VERIFIED, 'Super Admin', $levelIds['elite'], 5, true);

        $this->seedContent($super);
        $this->seedSignals($super);
        $this->seedBonuses();
        $this->seedAiKnowledge();
        $this->seedDemoProgress($verified);
    }

    private function seedUser(
        string $email,
        string $roleName,
        string $status,
        string $fullName,
        string $levelId,
        int $currentStep,
        bool $completed
    ): User {
        $existing = User::query()->where('email', $email)->first();
        if ($existing) {
            return $existing;
        }

        $role = Role::query()->where('name', $roleName)->firstOrFail();
        $user = User::query()->create([
            'email' => $email,
            'password' => 'password123',
            'role_id' => $role->id,
            'status' => $status,
            'member_level_id' => $levelId,
            'email_verified_at' => now(),
        ]);

        Profile::query()->create([
            'user_id' => $user->id,
            'full_name' => $fullName,
            'timezone' => 'Asia/Jakarta',
        ]);

        $progressData = ['current_step' => $currentStep];
        if ($completed) {
            $now = now();
            $progressData += [
                'step1_done_at' => $now,
                'step2_done_at' => $now,
                'step3_done_at' => $now,
                'step4_done_at' => $now,
                'step5_done_at' => $now,
                'completed_at' => $now,
            ];
        }

        OnboardingProgress::query()->create(['user_id' => $user->id] + $progressData);

        return $user;
    }

    private function seedContent(User $author): void
    {
        $categories = [
            ['module' => 'landing', 'name' => 'Public Education', 'slug' => 'landing-education', 'sort_order' => 1],
            ['module' => 'academy', 'name' => 'Foundations', 'slug' => 'academy-foundations', 'sort_order' => 1],
            ['module' => 'academy', 'name' => 'Execution', 'slug' => 'academy-execution', 'sort_order' => 2],
        ];

        $catIds = [];
        foreach ($categories as $cat) {
            $row = Category::query()->firstOrCreate(['slug' => $cat['slug']], [
                'id' => (string) Str::uuid(),
                'module' => $cat['module'],
                'name' => $cat['name'],
                'sort_order' => $cat['sort_order'],
                'is_active' => true,
            ]);
            $catIds[$cat['slug']] = $row->id;
        }

        $items = [
            [
                'cat' => 'landing-education',
                'module' => 'landing',
                'type' => 'article',
                'title' => 'Why IB verification matters',
                'slug' => 'why-ib-verification-matters',
                'excerpt' => 'How Introducing Broker verification protects desk quality and member access.',
                'body' => 'Private trading communities fail when anyone can join with no skin in the game. IB verification ties membership to a real MT5 path under our broker.',
                'premium' => false,
                'hours_ago' => 100,
            ],
            [
                'cat' => 'academy-foundations',
                'module' => 'academy',
                'type' => 'article',
                'title' => 'Session structure basics',
                'slug' => 'session-structure-basics',
                'excerpt' => 'Asia, London, and New York — what each session usually offers.',
                'body' => "Markets are not the same at 02:00 and 14:00. Asia often ranges; London expands liquidity; New York delivers continuation or reversal after the open.",
                'premium' => true,
                'hours_ago' => 80,
            ],
            [
                'cat' => 'academy-foundations',
                'module' => 'academy',
                'type' => 'video',
                'title' => 'Order flow walkthrough',
                'slug' => 'order-flow-walkthrough',
                'excerpt' => 'How we read aggressive orders around key levels before entry.',
                'body' => 'This lesson walks a live chart from level → reaction → confirmation.',
                'premium' => true,
                'duration_sec' => 720,
                'hours_ago' => 72,
            ],
            [
                'cat' => 'academy-execution',
                'module' => 'academy',
                'type' => 'video',
                'title' => 'Risk framing before you click',
                'slug' => 'risk-framing-before-you-click',
                'excerpt' => 'Position size, R-multiple, and when the setup is not worth the click.',
                'body' => 'Never size from conviction. Size from account risk and stop distance.',
                'premium' => true,
                'duration_sec' => 540,
                'hours_ago' => 50,
            ],
        ];

        foreach ($items as $item) {
            if (Content::query()->where('slug', $item['slug'])->exists()) {
                continue;
            }

            Content::query()->create([
                'id' => (string) Str::uuid(),
                'category_id' => $catIds[$item['cat']] ?? null,
                'module' => $item['module'],
                'type' => $item['type'],
                'title' => $item['title'],
                'slug' => $item['slug'],
                'excerpt' => $item['excerpt'],
                'body' => $item['body'],
                'duration_sec' => $item['duration_sec'] ?? null,
                'is_premium' => $item['premium'],
                'status' => Content::STATUS_PUBLISHED,
                'published_at' => now()->subHours($item['hours_ago']),
                'created_by' => $author->id,
            ]);
        }
    }

    private function seedSignals(User $author): void
    {
        $seeds = [
            ['pair' => 'XAUUSD', 'direction' => 'buy', 'entry' => 2335.5, 'sl' => 2310, 'tp' => 2360, 'analysis' => 'Liquidity sweep then continuation. Invalidation below SL.', 'hours_ago' => 2],
            ['pair' => 'EURUSD', 'direction' => 'sell', 'entry' => 1.0842, 'sl' => 1.0875, 'tp' => 1.0780, 'analysis' => 'Rejection from HTF supply. Target prior London low.', 'hours_ago' => 5],
        ];

        foreach ($seeds as $row) {
            $exists = Signal::query()
                ->where('pair', $row['pair'])
                ->where('direction', $row['direction'])
                ->where('entry', $row['entry'])
                ->exists();

            if ($exists) {
                continue;
            }

            Signal::query()->create([
                'id' => (string) Str::uuid(),
                'pair' => $row['pair'],
                'direction' => $row['direction'],
                'entry' => $row['entry'],
                'sl' => $row['sl'],
                'tp' => $row['tp'],
                'analysis' => $row['analysis'],
                'status' => 'active',
                'published_at' => now()->subHours($row['hours_ago']),
                'created_by' => $author->id,
            ]);
        }
    }

    private function seedBonuses(): void
    {
        if (Bonus::query()->exists()) {
            return;
        }

        Bonus::query()->create([
            'id' => (string) Str::uuid(),
            'title' => 'Risk pack PDF',
            'description' => 'Position sizing sheet, max-loss calculator notes, and R-multiple examples for verified members.',
            'external_url' => 'https://example.com/bonus-risk-pack.pdf',
            'is_active' => true,
            'sort_order' => 1,
        ]);
    }

    private function seedAiKnowledge(): void
    {
        if (AiKnowledge::query()->exists()) {
            return;
        }

        $seeds = [
            ['title' => 'broker_registration', 'keywords' => ['daftar', 'register', 'ib', 'broker', 'registrasi'], 'answer' => 'Mulai dari onboarding step 1–2: buka link IB broker lalu lanjutkan proses registrasi.', 'redirect_path' => '/onboarding', 'priority' => 10],
            ['title' => 'mt5', 'keywords' => ['mt5', 'meta trader', 'metatrader', 'login mt5', 'akun trading'], 'answer' => 'Setelah akun broker aktif, lanjutkan onboarding untuk menghubungkan MT5 login Anda.', 'redirect_path' => '/onboarding', 'priority' => 9],
            ['title' => 'deposit', 'keywords' => ['deposit', 'setor', 'top up', 'funding'], 'answer' => 'Ikuti tutorial deposit di onboarding, lalu unggah bukti deposit untuk verifikasi.', 'redirect_path' => '/onboarding', 'priority' => 9],
            ['title' => 'telegram', 'keywords' => ['telegram', 'grup', 'group', 'invite'], 'answer' => 'Link Telegram privat tersedia di modul Bonus setelah status verified.', 'redirect_path' => '/member/bonus', 'priority' => 8],
            ['title' => 'verification', 'keywords' => ['verifikasi', 'verification', 'approve', 'pending', 'bukti'], 'answer' => 'Setelah kirim bukti MT5/deposit, status jadi pending. Admin akan review di panel verifikasi.', 'redirect_path' => '/onboarding', 'priority' => 8],
        ];

        foreach ($seeds as $row) {
            AiKnowledge::query()->create([
                'id' => (string) Str::uuid(),
                'title' => $row['title'],
                'keywords' => $row['keywords'],
                'answer' => $row['answer'],
                'redirect_path' => $row['redirect_path'],
                'priority' => $row['priority'],
                'is_active' => true,
            ]);
        }
    }

    private function seedDemoProgress(User $verified): void
    {
        $rows = [
            ['slug' => 'order-flow-walkthrough', 'progress_pct' => 34, 'last_position_sec' => 240],
            ['slug' => 'session-structure-basics', 'progress_pct' => 62, 'last_position_sec' => 0],
        ];

        foreach ($rows as $row) {
            $content = Content::query()->where('slug', $row['slug'])->first();
            if (! $content) {
                continue;
            }

            ViewHistory::query()->updateOrCreate(
                ['user_id' => $verified->id, 'content_id' => $content->id],
                [
                    'id' => (string) Str::uuid(),
                    'progress_pct' => $row['progress_pct'],
                    'last_position_sec' => $row['last_position_sec'],
                    'completed' => false,
                ]
            );
        }
    }
}
