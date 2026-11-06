<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Enums\Platform;
use App\Models\Post;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ContentAssistantReserveRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('viewAny', Post::class) ?? false;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'platform' => ['required', Rule::enum(Platform::class)],
            'brief' => ['required', 'string', 'max:5000'],
            'idempotency_key' => ['required', 'string', 'max:100'],
        ];
    }
}
