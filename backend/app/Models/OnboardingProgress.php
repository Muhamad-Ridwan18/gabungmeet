<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OnboardingProgress extends Model
{
    protected $table = 'onboarding_progress';

    protected $primaryKey = 'user_id';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'user_id',
        'current_step',
        'step1_done_at',
        'step2_done_at',
        'step3_done_at',
        'step4_done_at',
        'step5_done_at',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'step1_done_at' => 'datetime',
            'step2_done_at' => 'datetime',
            'step3_done_at' => 'datetime',
            'step4_done_at' => 'datetime',
            'step5_done_at' => 'datetime',
            'completed_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
