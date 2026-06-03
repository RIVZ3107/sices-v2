<?php

declare(strict_types=1);

namespace App\Http\Requests\ControlEscolar;

use Illuminate\Foundation\Http\FormRequest;

class StoreInscripcionCeRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user !== null && (
            $user->can('inscripciones.crear')
            || $user->can('gestionar_inscripciones_periodo')
            || $user->can('inscripciones.editar')
        );
    }

    public function rules(): array
    {
        return [
            'alumno_id' => ['required', 'integer', 'exists:alumnos,id'],
            'ciclo_escolar_id' => ['required', 'integer', 'exists:ciclos_escolares,id'],
            'semestre' => ['nullable', 'integer', 'min:1', 'max:20'],
            'tipo_inscripcion' => ['nullable', 'string', 'max:80'],
        ];
    }
}
