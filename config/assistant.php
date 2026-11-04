<?php

declare(strict_types=1);

return [
    'monthly_generation_limit' => (int) env('ASSISTANT_MONTHLY_GENERATION_LIMIT', 100),
    'provider' => 'simulated',
];
