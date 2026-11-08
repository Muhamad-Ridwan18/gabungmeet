<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Ticket extends Model
{
    use HasUuids;

    public const STATUS_OPEN = 'open';

    public const STATUS_IN_PROGRESS = 'in_progress';

    public const STATUS_SOLVED = 'solved';

    public const STATUS_CLOSED = 'closed';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'user_id',
        'name',
        'email',
        'telegram_username',
        'topic',
        'description',
        'status',
        'assigned_to',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function messages(): HasMany
    {
        return $this->hasMany(TicketMessage::class)->orderBy('created_at');
    }

    public function toApiArray(bool $withMessages = false): array
    {
        $data = [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'name' => $this->name,
            'telegram_username' => $this->telegram_username,
            'email' => $this->email,
            'topic' => $this->topic,
            'description' => $this->description,
            'status' => $this->status,
            'assigned_to' => $this->assigned_to,
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];

        if ($withMessages) {
            $data['messages'] = $this->messages->map(fn (TicketMessage $m) => $m->toApiArray())->values()->all();
        }

        return $data;
    }
}
