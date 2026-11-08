<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AiMessage extends Model
{
    use HasUuids;

    protected $table = 'ai_messages';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'conversation_id',
        'role',
        'content',
        'intent',
        'redirect_path',
        'failed_attempt',
    ];

    protected function casts(): array
    {
        return [
            'failed_attempt' => 'boolean',
        ];
    }

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(AiConversation::class, 'conversation_id');
    }

    public function toApiArray(): array
    {
        return [
            'id' => $this->id,
            'conversation_id' => $this->conversation_id,
            'role' => $this->role,
            'content' => $this->content,
            'intent' => $this->intent,
            'redirect_path' => $this->redirect_path,
            'failed_attempt' => $this->failed_attempt,
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
