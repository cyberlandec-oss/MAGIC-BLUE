<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('content_assistant_generations', function (Blueprint $table): void {
            $table->uuid('id')->primary();
            $table->foreignUuid('workspace_id')->constrained()->cascadeOnDelete();
            $table->foreignUuid('user_id')->constrained()->cascadeOnDelete();
            $table->string('idempotency_key', 100);
            $table->string('platform', 30);
            $table->string('provider', 40)->default('simulated');
            $table->string('status', 20)->default('reserved');
            $table->string('brief_hash', 64);
            $table->string('suggestion_hash', 64)->nullable();
            $table->boolean('accepted')->default(false);
            $table->string('failure_code', 50)->nullable();
            $table->unsignedInteger('quota_weight')->default(1);
            $table->timestamp('reserved_at');
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();

            $table->unique(['workspace_id', 'idempotency_key']);
            $table->index(['workspace_id', 'status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('content_assistant_generations');
    }
};
