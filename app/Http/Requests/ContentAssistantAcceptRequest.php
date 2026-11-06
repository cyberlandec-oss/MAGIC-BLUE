<?php

declare(strict_types=1);

namespace App\Http\Requests;

use App\Models\Post;
use Illuminate\Foundation\Http\FormRequest;

class ContentAssistantAcceptRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('viewAny', Post::class) ?? false;
    }
}
