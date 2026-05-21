<?php

declare(strict_types=1);

namespace App\Http\Requests\Certificacion;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class FirmarDocumentoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'firmante_autorizado_id' => ['nullable', 'integer', 'exists:firmantes_autorizados,id'],
        ];
    }
}
