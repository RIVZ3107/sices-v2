<?php

declare(strict_types=1);

namespace App\Http\Requests\Academico;

use Illuminate\Foundation\Http\FormRequest;

class ConfirmImportacionHistoricaMateriasRequest extends FormRequest
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
            'forzar_sin_plan_materia' => ['sometimes', 'boolean'],
            'motivo_forzar_sin_plan' => ['required_if:forzar_sin_plan_materia,true', 'nullable', 'string', 'min:20', 'max:2000'],
            'filas_ejecucion' => ['nullable', 'array'],
            // Permite enviar filas editadas tras conciliación sin nuevo endpoint (opcional).
            'filas_payload' => ['sometimes', 'array', 'min:1'],
            'filas_payload.*.clave' => ['required_with:filas_payload', 'string', 'max:40'],
            'filas_payload.*.nombre' => ['nullable', 'string', 'max:180'],
            'filas_payload.*.calificacion' => ['nullable', 'numeric'],
            'filas_payload.*.calificacion_final' => ['nullable', 'numeric'],
            'filas_payload.*.calificacion_texto' => ['nullable', 'string', 'max:40'],
            'filas_payload.*.tipo_periodo_curricular' => ['nullable', 'string', 'max:40'],
            'filas_payload.*.numero_periodo_curricular' => ['nullable', 'integer', 'min:1', 'max:30'],
            'filas_payload.*.etiqueta_periodo_curricular' => ['nullable', 'string', 'max:120'],
            'filas_payload.*.semestre' => ['nullable', 'integer', 'min:1', 'max:20'],
            'filas_payload.*.semestre_dec' => ['nullable', 'integer', 'min:1', 'max:20'],
            'filas_payload.*.periodo' => ['nullable', 'string', 'max:40'],
            'filas_payload.*.tipo' => ['nullable', 'string', 'max:50'],
            'filas_payload.*.tipo_evaluacion' => ['nullable', 'string', 'max:40'],
            'filas_payload.*.estado' => ['nullable', 'string', 'max:30'],
            'filas_payload.*.estatus_acreditacion' => ['nullable', 'string', 'max:40'],
            'filas_payload.*.creditos' => ['nullable', 'integer', 'min:0'],
            'filas_payload.*.orden' => ['nullable', 'integer', 'min:1', 'max:1000'],
            'filas_payload.*.metadata' => ['nullable', 'array'],
        ];
    }
}
