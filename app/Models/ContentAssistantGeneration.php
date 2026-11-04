<?php

declare(strict_types=1);

namespace App\Models;

use Carbon\CarbonImmutable;
use Database\Factories\ContentAssistantGenerationFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Override;

#[Fillable([
    'workspace_id', 'user_id', 'idempotency_key', 'platform', 'provider', 'status',
    'brief_hash', 'suggestion_hash', 'accepted', 'failure_code', 'quota_weight',
    'reserved_at', 'completed_at',
])]
class ContentAssistantGeneration extends Model
{
    /** @use HasFactory<ContentAssistantGenerationFactory> */
    use HasFactory, HasUuids;

    /** @return array<string, string> */
    #[Override]
    protected function casts(): array
    {
        return [
            'accepted' => 'boolean',
            'quota_weight' => 'integer',
            'reserved_at' => 'immutable_datetime',
            'completed_at' => 'immutable_datetime',
        ];
    }

    /** @return BelongsTo<Workspace, $this> */
    public function workspace(): BelongsTo
    {
        return $this->belongsTo(Workspace::class);
    }

    /** @return BelongsTo<User, $this> */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
