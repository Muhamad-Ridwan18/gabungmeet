<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TicketMessage extends Model
{
    use HasUuids;

    public const SENDER_USER = 'user';

    public const SENDER_ADMIN = 'admin';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'ticket_id',
        'user_id',
        'sender_type',
        'body',
        'attachment_key',
    ];

    public function ticket(): BelongsTo
    {
        return $this->belongsTo(Ticket::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function toApiArray(): array
    {
        return [
            'id' => $this->id,
            'ticket_id' => $this->ticket_id,
            'sender_id' => $this->user_id,
            'sender_type' => $this->sender_type,
            'message' => $this->body,
            'attachment_key' => $this->attachment_key,
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
