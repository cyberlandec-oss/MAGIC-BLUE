<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Enums\Platform;
use App\Exceptions\AssistantQuotaExceeded;
use App\Http\Requests\ContentAssistantCompleteRequest;
use App\Http\Requests\ContentAssistantReserveRequest;
use App\Models\ContentAssistantGeneration;
use App\Services\ContentAssistant\ContentAssistantUsageService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Http\Request;

class ContentAssistantUsageController extends Controller
{
    public function quota(Request $request, ContentAssistantUsageService $service): JsonResponse
    {
        return response()->json($service->quota($request->user()));
    }

    public function reserve(ContentAssistantReserveRequest $request, ContentAssistantUsageService $service): JsonResponse
    {
        $data = $request->validated();

        try {
            $generation = $service->reserve(
                $request->user(),
                Platform::from((string) $data['platform']),
                (string) $data['brief'],
                (string) $data['idempotency_key'],
            );
        } catch (AssistantQuotaExceeded $exception) {
            return response()->json(['message' => $exception->getMessage()], Response::HTTP_TOO_MANY_REQUESTS);
        }

        return response()->json([
            'generation_id' => $generation->id,
            'provider' => $generation->provider,
            'status' => $generation->status,
            'quota_weight' => $generation->quota_weight,
        ], Response::HTTP_CREATED);
    }

    public function complete(ContentAssistantCompleteRequest $request, string $generation, ContentAssistantUsageService $service): JsonResponse
    {
        $data = $request->validated();
        $model = ContentAssistantGeneration::query()
            ->where('workspace_id', $request->user()->current_workspace_id)
            ->findOrFail($generation);

        $completed = $service->complete($model, (string) $data['suggestion'], (bool) $data['accepted']);

        return response()->json(['generation_id' => $completed->id, 'status' => $completed->status]);
    }

    public function release(Request $request, string $generation, ContentAssistantUsageService $service): JsonResponse
    {
        $model = ContentAssistantGeneration::query()
            ->where('workspace_id', $request->user()->current_workspace_id)
            ->findOrFail($generation);

        $released = $service->release($model, 'assistant_failed');

        return response()->json(['generation_id' => $released->id, 'status' => $released->status]);
    }
}
