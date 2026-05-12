<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreMenuRequest extends FormRequest
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
            'parent_id' => ['nullable', 'integer', 'exists:menus,id'],
            'label' => ['required', 'string', 'max:255'],
            'route' => ['required', 'string', 'max:512'],
            'icon' => ['nullable', 'string', 'max:64'],
            'order' => ['nullable', 'integer', 'min:0'],
            'section' => ['nullable', 'string', 'max:64'],
            'is_active' => ['nullable', 'boolean'],
            'permission_name' => ['nullable', 'string', 'max:255'],
            'metadata' => ['nullable', 'array'],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function validatedPayload(): array
    {
        $data = $this->validated();
        $data['icon'] = $data['icon'] ?? 'docs';
        $data['order'] = $data['order'] ?? 0;
        $data['section'] = $data['section'] ?? 'MAIN';
        $data['is_active'] = $data['is_active'] ?? true;

        return $data;
    }
}
