<?php

declare(strict_types=1);

namespace App\Http\Requests\Certificacion;

use Illuminate\Foundation\Http\FormRequest;

class RechazarValidacionNormativaLegacyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('rechazar_importacion_legacy_normativa') === true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'motivo' => ['required', 'string', 'min:5', 'max:2000'],
        ];
    }
}
