<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMenuRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'parent_id' => ['sometimes', 'nullable', 'integer', 'exists:menus,id'],
            'label' => ['sometimes', 'required', 'string', 'max:255'],
            'route' => ['sometimes', 'required', 'string', 'max:512'],
            'icon' => ['sometimes', 'nullable', 'string', 'max:64'],
            'order' => ['sometimes', 'nullable', 'integer', 'min:0'],
            'section' => ['sometimes', 'nullable', 'string', 'max:64'],
            'is_active' => ['sometimes', 'nullable', 'boolean'],
            'permission_name' => ['sometimes', 'nullable', 'string', 'max:255'],
            'metadata' => ['sometimes', 'nullable', 'array'],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function validatedPayload(): array
    {
        return $this->validated();
    }
}
