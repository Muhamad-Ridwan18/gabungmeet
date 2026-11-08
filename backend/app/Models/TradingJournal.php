<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TradingJournal extends Model
{
    use HasUuids;

    protected $table = 'trading_journals';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'user_id',
        'pair',
        'direction',
        'traded_at',
        'entry',
        'exit',
        'sl',
        'tp',
        'result',
        'rr',
        'emotion',
        'screenshot_key',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'traded_at' => 'datetime',
            'entry' => 'float',
            'exit' => 'float',
            'sl' => 'float',
            'tp' => 'float',
            'rr' => 'float',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function toApiArray(): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'pair' => $this->pair,
            'direction' => $this->direction,
            'traded_at' => $this->traded_at?->toISOString(),
            'entry' => $this->entry !== null ? (float) $this->entry : null,
            'exit' => $this->exit !== null ? (float) $this->exit : null,
            'sl' => $this->sl !== null ? (float) $this->sl : null,
            'tp' => $this->tp !== null ? (float) $this->tp : null,
            'result' => $this->result,
            'rr' => $this->rr !== null ? (float) $this->rr : null,
            'emotion' => $this->emotion,
            'screenshot_key' => $this->screenshot_key,
            'notes' => $this->notes,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
