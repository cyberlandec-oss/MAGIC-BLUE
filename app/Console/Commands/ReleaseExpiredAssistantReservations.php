<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\ContentAssistant\ContentAssistantUsageService;
use Illuminate\Console\Command;

class ReleaseExpiredAssistantReservations extends Command
{
    protected $signature = 'assistant:release-expired';

    protected $description = 'Release abandoned content assistant reservations.';

    public function handle(ContentAssistantUsageService $usageService): int
    {
        $released = $usageService->releaseExpiredReservations();

        $this->info("Released {$released} expired assistant reservations.");

        return self::SUCCESS;
    }
}
