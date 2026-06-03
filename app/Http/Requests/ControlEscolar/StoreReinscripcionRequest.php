<?php

declare(strict_types=1);

namespace App\Http\Requests\ControlEscolar;

use Illuminate\Foundation\Http\FormRequest;

class StoreReinscripcionRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user !== null && (
            $user->can('reinscripciones.crear')
            || $user->can('reinscripciones.editar')
        );
    }

    public function rules(): array
    {
        return [
            'alumno_id' => ['required', 'integer', 'exists:alumnos,id'],
            'ciclo_escolar_id' => ['required', 'integer', 'exists:ciclos_escolares,id'],
            'semestre' => ['nullable', 'integer', 'min:1', 'max:20'],
            'programa_id' => ['nullable', 'integer', 'exists:programas_estudio,id'],
            'sede_id' => ['nullable', 'integer', 'exists:sedes,id'],
        ];
    }
}
