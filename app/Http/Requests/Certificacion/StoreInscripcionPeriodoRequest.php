<?php

declare(strict_types=1);

namespace App\Http\Requests\Certificacion;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreInscripcionPeriodoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $tipo = strtolower((string) $this->input('tipo_periodo_curricular', 'semestre'));
        if ($tipo === '') {
            $tipo = 'semestre';
        }
        $numero = $this->input('numero_periodo_curricular');
        if (($numero === null || $numero === '') && $tipo === 'semestre') {
            $numero = $this->input('semestre');
        }

        $this->merge([
            'tipo_periodo_curricular' => $tipo,
            'numero_periodo_curricular' => $numero !== null && $numero !== '' ? (int) $numero : null,
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'matricula_id' => ['required', 'integer', 'exists:matriculas,id'],
            'ciclo_escolar_id' => ['required', 'integer', 'exists:ciclos_escolares,id'],
            'periodo_escolar_id' => ['nullable', 'integer', 'exists:periodos_escolares,id'],
            'grupo_id' => ['nullable', 'integer', 'exists:grupos,id'],
            'semestre' => ['required', 'integer', 'min:1', 'max:20'],
            'tipo_periodo_curricular' => ['required', 'string', 'max:40'],
            'numero_periodo_curricular' => ['required', 'integer', 'min:1', 'max:30'],
            'etiqueta_periodo_curricular' => ['nullable', 'string', 'max:120'],
            'estatus' => ['sometimes', Rule::in(['inscrita', 'cursando', 'concluida', 'baja', 'cancelada', 'acreditada', 'reprobada'])],
            'fecha_inscripcion' => ['nullable', 'date'],
            'metadata' => ['nullable', 'array'],
            'generar_carga' => ['nullable', 'boolean'],
        ];
    }
}
