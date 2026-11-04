<?php

declare(strict_types=1);

namespace Database\Factories;

use App\Models\ContentAssistantGeneration;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<ContentAssistantGeneration> */
class ContentAssistantGenerationFactory extends Factory
{
    protected $model = ContentAssistantGeneration::class;

    public function definition(): array
    {
        return [
            'workspace_id' => Workspace::factory(),
            'user_id' => User::factory(),
            'idempotency_key' => fake()->uuid(),
            'platform' => 'linkedin',
            'provider' => 'simulated',
            'status' => 'reserved',
            'brief_hash' => hash('sha256', fake()->sentence()),
            'quota_weight' => 1,
            'reserved_at' => now(),
        ];
    }
}
