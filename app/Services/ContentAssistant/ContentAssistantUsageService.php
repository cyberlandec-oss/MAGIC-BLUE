<?php

declare(strict_types=1);

namespace App\Services\ContentAssistant;

use App\Enums\Platform;
use App\Enums\UsageCategory;
use App\Exceptions\AssistantQuotaExceeded;
use App\Models\ContentAssistantGeneration;
use App\Models\User;
use App\Services\Usage\UsageRecorder;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ContentAssistantUsageService
{
    public function __construct(private readonly UsageRecorder $usageRecorder) {}

    public function reserve(User $user, Platform $platform, string $brief, string $idempotencyKey): ContentAssistantGeneration
    {
        $workspaceId = $user->current_workspace_id;

        return DB::transaction(function () use ($user, $workspaceId, $platform, $brief, $idempotencyKey): ContentAssistantGeneration {
            $this->releaseExpiredReservations($workspaceId);
            $existing = ContentAssistantGeneration::query()
                ->where('workspace_id', $workspaceId)
                ->where('idempotency_key', $idempotencyKey)
                ->lockForUpdate()
                ->first();

            if ($existing !== null) {
                return $existing;
            }

            $limit = (int) config('assistant.monthly_generation_limit');
            $used = ContentAssistantGeneration::query()
                ->where('workspace_id', $workspaceId)
                ->whereIn('status', ['reserved', 'completed'])
                ->where('created_at', '>=', CarbonImmutable::now()->startOfMonth())
                ->sum('quota_weight');

            if ($limit > 0 && $used >= $limit) {
                throw new AssistantQuotaExceeded('The content assistant monthly quota has been reached.');
            }

            return ContentAssistantGeneration::query()->create([
                'workspace_id' => $workspaceId,
                'user_id' => $user->id,
                'idempotency_key' => Str::limit($idempotencyKey, 100, ''),
                'platform' => $platform->value,
                'provider' => (string) config('assistant.provider', 'simulated'),
                'status' => 'reserved',
                'brief_hash' => hash('sha256', $brief),
                'quota_weight' => 1,
                'reserved_at' => CarbonImmutable::now(),
            ]);
        });
    }

    /** @return array{limit: int, used: int, remaining: int} */
    public function quota(User $user): array
    {
        $this->releaseExpiredReservations($user->current_workspace_id);
        $limit = (int) config('assistant.monthly_generation_limit');
        $used = (int) ContentAssistantGeneration::query()
            ->where('workspace_id', $user->current_workspace_id)
            ->whereIn('status', ['reserved', 'completed'])
            ->where('created_at', '>=', CarbonImmutable::now()->startOfMonth())
            ->sum('quota_weight');

        return [
            'limit' => $limit,
            'used' => $used,
            'remaining' => $limit > 0 ? max(0, $limit - $used) : -1,
        ];
    }

    public function complete(ContentAssistantGeneration $generation, string $suggestion, bool $accepted): ContentAssistantGeneration
    {
        $completed = DB::transaction(function () use ($generation, $suggestion, $accepted): ?ContentAssistantGeneration {
            $locked = ContentAssistantGeneration::query()
                ->whereKey($generation->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($locked->status !== 'reserved') {
                return null;
            }

            $locked->update([
                'status' => 'completed',
                'suggestion_hash' => hash('sha256', $suggestion),
                'accepted' => $accepted,
                'completed_at' => CarbonImmutable::now(),
            ]);

            return $locked;
        });

        if ($completed === null) {
            return $generation->refresh();
        }

        $this->usageRecorder->record(
            UsageCategory::Ai,
            'content_assistant_generation',
            $completed->workspace_id,
            Platform::tryFrom($completed->platform),
            $completed->quota_weight,
            true,
            ['provider' => $completed->provider, 'accepted' => $accepted],
        );

        return $completed->refresh();
    }

    public function release(ContentAssistantGeneration $generation, string $failureCode): ContentAssistantGeneration
    {
        DB::transaction(function () use ($generation, $failureCode): void {
            $locked = ContentAssistantGeneration::query()
                ->whereKey($generation->id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($locked->status === 'reserved') {
                $locked->update([
                    'status' => 'released',
                    'failure_code' => Str::limit($failureCode, 50, ''),
                    'completed_at' => CarbonImmutable::now(),
                ]);
            }
        });

        return $generation->refresh();
    }

    private function releaseExpiredReservations(string $workspaceId): void
    {
        ContentAssistantGeneration::query()
            ->where('workspace_id', $workspaceId)
            ->where('status', 'reserved')
            ->where('reserved_at', '<', CarbonImmutable::now()->subMinutes((int) config('assistant.reservation_ttl_minutes', 30)))
            ->update([
                'status' => 'released',
                'failure_code' => 'reservation_expired',
                'completed_at' => CarbonImmutable::now(),
                'updated_at' => CarbonImmutable::now(),
            ]);
    }
}
