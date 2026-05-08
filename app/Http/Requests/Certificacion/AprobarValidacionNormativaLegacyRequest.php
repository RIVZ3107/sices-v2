<?php

declare(strict_types=1);

namespace App\Http\Requests\Certificacion;

use Illuminate\Foundation\Http\FormRequest;

class AprobarValidacionNormativaLegacyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('aprobar_importacion_legacy_normativa') === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'motivo' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
