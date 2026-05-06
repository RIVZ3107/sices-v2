<?php

declare(strict_types=1);

namespace App\Http\Requests\Certificacion;

use App\Models\Matricula;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

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
            'matricula' => ['nullable', 'string', 'max:50'],
            'estado' => ['sometimes', 'string', 'max:30'],
            'fecha_ingreso' => ['nullable', 'date'],
            'fecha_egreso' => ['nullable', 'date'],
            'metadata' => ['nullable', 'array'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v): void {
            $alumnoId = (int) $this->input('alumno_id');
            if ($alumnoId <= 0) {
                return;
            }
            if (Matricula::query()->where('alumno_id', $alumnoId)->exists()) {
                $v->errors()->add(
                    'alumno_id',
                    'El alumno ya tiene una matrícula activa registrada; la regla institucional permite una sola matrícula por alumno.',
                );
            }
        });
    }
}
