<?php

declare(strict_types=1);

namespace App\Http\Requests\Certificacion;

use Illuminate\Foundation\Http\FormRequest;

class DocumentoWorkflowTransicionRequest extends FormRequest
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
            'accion' => ['nullable', 'string', 'max:80'],
            'etapa_institucional' => ['nullable', 'string', 'max:80'],
            'motivo' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
