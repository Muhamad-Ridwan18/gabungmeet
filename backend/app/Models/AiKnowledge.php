<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class AiKnowledge extends Model
{
    use HasUuids;

    protected $table = 'ai_knowledge';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'title',
        'keywords',
        'answer',
        'redirect_path',
        'priority',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'keywords' => 'array',
            'is_active' => 'boolean',
        ];
    }

    /** @return list<string> */
    public function keywordList(): array
    {
        $keywords = $this->keywords;
        if (is_string($keywords)) {
            return array_filter(array_map('trim', explode(',', $keywords)));
        }

        return is_array($keywords) ? array_values(array_filter($keywords)) : [];
    }
}
