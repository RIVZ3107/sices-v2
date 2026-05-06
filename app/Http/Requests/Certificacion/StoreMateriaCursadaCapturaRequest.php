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
            'ciclo_escolar_id' => ['required', 'integer', 'exists:ciclos_escolares,id'],
            'materia_id' => ['nullable', 'integer', 'exists:materias,id'],
            'clave' => ['required', 'string', 'max:40'],
            'nombre' => ['required', 'string', 'max:180'],
            'calificacion' => ['nullable', 'numeric'],
            'calificacion_texto' => ['nullable', 'string', 'max:40'],
            'periodo' => ['nullable', 'string', 'max:40'],
            'semestre' => ['nullable', 'integer', 'min:1', 'max:20'],
            'creditos' => ['nullable', 'integer', 'min:0'],
            'tipo' => ['nullable', 'string', 'max:50'],
            'estado' => ['sometimes', 'string', 'max:30'],
            'metadata' => ['nullable', 'array'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v): void {
            $matriculaId = (int) $this->input('matricula_id');
            $cicloId = (int) $this->input('ciclo_escolar_id');
            $clave = (string) $this->input('clave');
            $periodo = $this->input('periodo');

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
