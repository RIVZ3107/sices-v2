<?php

declare(strict_types=1);

namespace App\Http\Requests\Certificacion;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMatriculaCapturaRequest extends FormRequest
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
            'alumno_id' => ['required', 'integer', 'exists:alumnos,id'],
            'oferta_academica_id' => ['required', 'integer', 'exists:ofertas_academicas,id'],
            'ciclo_escolar_id' => ['required', 'integer', 'exists:ciclos_escolares,id'],
            'subsistema_id' => ['nullable', 'integer', 'exists:subsistemas,id'],
            'matricula' => ['nullable', 'string', 'max:50'],
            'estado' => ['sometimes', Rule::in(['activa', 'suspendida', 'baja', 'egresado', 'concluida', 'cancelada'])],
            'fecha_ingreso' => ['nullable', 'date'],
            'fecha_egreso' => ['nullable', 'date'],
            'metadata' => ['nullable', 'array'],
        ];
    }
}
