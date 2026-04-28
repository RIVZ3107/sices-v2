<?php

declare(strict_types=1);

namespace App\Http\Requests\Certificacion;

use Illuminate\Foundation\Http\FormRequest;

class UpsertTrayectoriaCapturaRequest extends FormRequest
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
            'matricula_id' => ['required', 'integer', 'exists:matriculas,id'],
            'fecha_inicio' => ['nullable', 'date'],
            'fecha_fin' => ['nullable', 'date'],
            'promedio' => ['nullable', 'numeric'],
            'promedio_texto' => ['nullable', 'string', 'max:40'],
            'creditos_obtenidos' => ['nullable', 'integer', 'min:0'],
            'creditos_totales' => ['nullable', 'integer', 'min:0'],
            'total_materias' => ['nullable', 'integer', 'min:0'],
            'materias_aprobadas' => ['nullable', 'integer', 'min:0'],
            'materias_reprobadas' => ['nullable', 'integer', 'min:0'],
            'estado' => ['sometimes', 'string', 'max:30'],
            'metadata' => ['nullable', 'array'],
        ];
    }
}
