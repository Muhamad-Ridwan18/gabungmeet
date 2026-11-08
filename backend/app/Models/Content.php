<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Content extends Model
{
    use HasUuids, SoftDeletes;

    public const MODULE_ACADEMY = 'academy';

    public const MODULE_TUTORIAL = 'tutorial';

    public const MODULE_PSYCHOLOGY = 'psychology';

    public const MODULE_MONEY_MANAGEMENT = 'money_management';

    public const MODULE_DAILY_ANALYSIS = 'daily_analysis';

    public const MODULE_LANDING = 'landing';

    public const TYPE_VIDEO = 'video';

    public const TYPE_ARTICLE = 'article';

    public const STATUS_DRAFT = 'draft';

    public const STATUS_PUBLISHED = 'published';

    public const STATUS_ARCHIVED = 'archived';

    public $incrementing = false;

    protected $keyType = 'string';

    protected $fillable = [
        'module',
        'type',
        'category_id',
        'title',
        'slug',
        'excerpt',
        'body',
        'thumbnail_url',
        'video_url',
        'file_key',
        'file_url',
        'duration_sec',
        'is_premium',
        'min_plan_code',
        'status',
        'sort_order',
        'published_at',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'is_premium' => 'boolean',
            'published_at' => 'datetime',
        ];
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
