<?php

declare(strict_types=1);

namespace App\Http\Requests\ControlEscolar;

use Illuminate\Foundation\Http\FormRequest;

class StoreExpedienteOperativoRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user !== null && (
            $user->can('expedientes.crear')
            || $user->can('expedientes.editar')
            || $user->can('gestionar_alumnos')
        );
    }

    public function rules(): array
    {
        return [
            'alumno_id' => ['required', 'integer', 'exists:alumnos,id'],
            'ciclo_escolar_id' => ['nullable', 'integer', 'exists:ciclos_escolares,id'],
            'tipo_expediente' => ['nullable', 'string', 'max:80'],
        ];
    }
}
