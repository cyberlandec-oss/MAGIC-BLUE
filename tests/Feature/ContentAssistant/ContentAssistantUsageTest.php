<?php

use App\Enums\Platform;
use App\Exceptions\AssistantQuotaExceeded;
use App\Models\ContentAssistantGeneration;
use App\Models\UsageEvent;
use App\Models\User;
use App\Services\ContentAssistant\ContentAssistantUsageService;

beforeEach(function (): void {
    config()->set('instance.defaults.usage_tracking_enabled', true);
});

it('reserves one quota unit per idempotency key and does not duplicate it', function () {
    $user = User::factory()->withWorkspace()->create();
    $service = app(ContentAssistantUsageService::class);

    $first = $service->reserve($user, Platform::LinkedIn, 'brief', 'same-request');
    $second = $service->reserve($user, Platform::LinkedIn, 'brief', 'same-request');

    expect($second->is($first))->toBeTrue()
        ->and(ContentAssistantGeneration::count())->toBe(1);
});

it('releases a failed generation without consuming usage', function () {
    $user = User::factory()->withWorkspace()->create();
    $service = app(ContentAssistantUsageService::class);
    $generation = $service->reserve($user, Platform::Instagram, 'brief', 'failed-request');

    $service->release($generation, 'provider_unavailable');

    expect($generation->refresh()->status)->toBe('released')
        ->and(UsageEvent::count())->toBe(0);
});

it('consumes usage once when a generation completes and records only hashes', function () {
    $user = User::factory()->withWorkspace()->create();
    $service = app(ContentAssistantUsageService::class);
    $generation = $service->reserve($user, Platform::LinkedIn, 'private brief', 'complete-request');

    $service->complete($generation, 'private suggestion', true);
    $service->complete($generation, 'changed suggestion', false);

    expect($generation->refresh()->status)->toBe('completed')
        ->and(UsageEvent::count())->toBe(1)
        ->and($generation->brief_hash)->not->toContain('private')
        ->and($generation->suggestion_hash)->not->toContain('private');
});

it('enforces the workspace monthly quota without affecting another workspace', function () {
    config()->set('assistant.monthly_generation_limit', 1);
    $user = User::factory()->withWorkspace()->create();
    $otherUser = User::factory()->withWorkspace()->create();
    $service = app(ContentAssistantUsageService::class);

    $service->reserve($user, Platform::Facebook, 'brief', 'first-request');

    expect(fn () => $service->reserve($user, Platform::Facebook, 'brief', 'second-request'))
        ->toThrow(AssistantQuotaExceeded::class);
    expect($service->reserve($otherUser, Platform::Facebook, 'brief', 'other-request'))
        ->toBeInstanceOf(ContentAssistantGeneration::class);
});
