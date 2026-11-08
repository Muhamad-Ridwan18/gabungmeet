<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Signal extends Model
{
    use HasUuids;

    public const STATUS_ACTIVE = 'active';

    public const STATUS_CLOSED = 'closed';

    public const STATUS_CANCELLED = 'cancelled';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'pair',
        'direction',
        'entry',
        'sl',
        'tp',
        'analysis',
        'chart_key',
        'status',
        'result',
        'min_plan_code',
        'published_at',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'entry' => 'float',
            'sl' => 'float',
            'tp' => 'float',
            'published_at' => 'datetime',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function toApiArray(): array
    {
        return [
            'id' => $this->id,
            'pair' => $this->pair,
            'direction' => $this->direction,
            'entry' => (float) $this->entry,
            'sl' => $this->sl !== null ? (float) $this->sl : null,
            'tp' => $this->tp !== null ? (float) $this->tp : null,
            'analysis' => $this->analysis,
            'chart_key' => $this->chart_key,
            'status' => $this->status,
            'result' => $this->result,
            'published_at' => $this->published_at?->toISOString(),
            'created_by' => $this->created_by,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
