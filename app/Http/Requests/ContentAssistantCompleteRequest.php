<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Models\Post;
use Illuminate\Foundation\Http\FormRequest;

class ContentAssistantCompleteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('viewAny', Post::class) ?? false;
    }

    /** @return array<string, array<int, mixed>> */
    public function rules(): array
    {
        return [
            'suggestion' => ['required', 'string', 'max:10000'],
        ];
    }
}
