<?php

declare(strict_types=1);

namespace App\Http\Requests\Certificacion;

use App\Models\MateriaCursada;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

class StoreMateriaCursadaCapturaRequest extends FormRequest
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
            'inscripcion_periodo_id' => ['nullable', 'integer', 'exists:inscripciones_periodo,id'],
            'carga_academica_id' => ['nullable', 'integer', 'exists:cargas_academicas,id'],
            'ciclo_escolar_id' => ['required', 'integer', 'exists:ciclos_escolares,id'],
            'materia_id' => ['nullable', 'integer', 'exists:materias,id'],
            'plan_materia_id' => ['nullable', 'integer', 'exists:plan_materias,id'],
            'clave' => ['nullable', 'string', 'max:40'],
            'nombre' => ['nullable', 'string', 'max:180'],
            'calificacion' => ['nullable', 'numeric'],
            'calificacion_final' => ['nullable', 'numeric'],
            'calificacion_texto' => ['nullable', 'string', 'max:40'],
            'periodo' => ['nullable', 'string', 'max:40'],
            'semestre' => ['nullable', 'integer', 'min:1', 'max:20'],
            'tipo_periodo_curricular' => ['nullable', 'string', 'max:40'],
            'numero_periodo_curricular' => ['nullable', 'integer', 'min:1', 'max:30'],
            'etiqueta_periodo_curricular' => ['nullable', 'string', 'max:120'],
            'orden' => ['nullable', 'integer', 'min:1', 'max:1000'],
            'creditos' => ['nullable', 'integer', 'min:0'],
            'tipo' => ['nullable', 'string', 'max:50'],
            'tipo_evaluacion' => ['nullable', 'string', 'max:40'],
            'estado' => ['sometimes', 'string', 'max:30'],
            'estatus_acreditacion' => ['nullable', 'string', 'max:40'],
            'metadata' => ['nullable', 'array'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v): void {
            if (
                empty($this->input('carga_academica_id'))
                && empty($this->input('plan_materia_id'))
                && (trim((string) $this->input('clave')) === '' || trim((string) $this->input('nombre')) === '')
            ) {
                $v->errors()->add(
                    'carga_academica_id',
                    'Debe capturarse con carga académica o plan_materia; en modo legacy ambos clave y nombre son obligatorios.',
                );
            }

            $matriculaId = (int) $this->input('matricula_id');
            $cicloId = (int) $this->input('ciclo_escolar_id');
            $clave = (string) $this->input('clave');
            $periodo = $this->input('periodo');
            if (trim($clave) === '') {
                return;
            }

            $q = MateriaCursada::query()
                ->where('matricula_id', $matriculaId)
                ->where('ciclo_escolar_id', $cicloId)
                ->where('clave', $clave);

            if ($periodo === null || $periodo === '') {
                $q->where(function ($scope): void {
                    $scope->whereNull('periodo')->orWhere('periodo', '');
                });
            } else {
                $q->where('periodo', $periodo);
            }

            if ($q->exists()) {
                $v->errors()->add(
                    'clave',
                    'Ya existe un registro para la misma matrícula, ciclo, materia (clave) y periodo.',
                );
            }
        });
    }
}
