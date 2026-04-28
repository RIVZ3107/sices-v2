<?php

declare(strict_types=1);

namespace App\Http\Requests\Certificacion;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AtenderDocumentoObservacionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'estado' => ['required', Rule::in(['atendida', 'descartada'])],
            'respuesta' => ['nullable', 'string', 'max:5000'],
            'metadata' => ['nullable', 'array'],
        ];
    }
}
