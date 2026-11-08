<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ViewHistory extends Model
{
    use HasUuids;

    protected $table = 'view_histories';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'user_id',
        'content_id',
        'progress_pct',
        'last_position_sec',
        'completed',
    ];

    protected function casts(): array
    {
        return [
            'completed' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function content(): BelongsTo
    {
        return $this->belongsTo(Content::class);
    }

    public function toApiArray(): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'content_id' => $this->content_id,
            'progress_pct' => (float) $this->progress_pct,
            'last_position_sec' => $this->last_position_sec,
            'completed' => $this->completed,
            'last_viewed_at' => $this->updated_at?->toISOString(),
        ];
    }
}
