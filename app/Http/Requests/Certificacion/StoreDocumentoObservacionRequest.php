<?php

declare(strict_types=1);

namespace App\Http\Requests\Certificacion;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDocumentoObservacionRequest extends FormRequest
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
            'tipo' => ['required', Rule::in(['academica', 'documental', 'datos_alumno', 'materias', 'trayectoria', 'institucion', 'sistema'])],
            'seccion' => ['nullable', 'string', 'max:120'],
            'observacion' => ['required', 'string', 'max:5000'],
            'prioridad' => ['nullable', Rule::in(['baja', 'media', 'alta', 'critica'])],
            'metadata' => ['nullable', 'array'],
        ];
    }
}
