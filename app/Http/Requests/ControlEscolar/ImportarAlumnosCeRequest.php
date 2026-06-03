<?php

declare(strict_types=1);

namespace App\Http\Requests\ControlEscolar;

use Illuminate\Foundation\Http\FormRequest;

class ImportarAlumnosCeRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user !== null && (
            $user->can('alumnos.importar')
            || $user->can('importaciones_academicas.importar')
            || $user->can('control_escolar.importar')
            || $user->can('gestionar_alumnos')
        );
    }

    public function rules(): array
    {
        return [
            'archivo' => ['required', 'file', 'mimes:csv,txt', 'max:5120'],
        ];
    }

    public function messages(): array
    {
        return [
            'archivo.required' => 'Seleccione un archivo CSV para importar.',
            'archivo.mimes' => 'El archivo debe ser formato CSV.',
            'archivo.max' => 'El archivo no puede superar 5 MB.',
        ];
    }
}
