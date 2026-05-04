<?php

declare(strict_types=1);

namespace App\Http\Requests\Certificacion;

use Illuminate\Foundation\Http\FormRequest;

class StoreAlumnoCapturaRequest extends FormRequest
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
            'curp' => ['required', 'string', 'size:18', 'unique:alumnos,curp'],
            'nombre' => ['required', 'string', 'max:120'],
            'primer_apellido' => ['required', 'string', 'max:120'],
            'segundo_apellido' => ['nullable', 'string', 'max:120'],
            'fecha_nacimiento' => ['nullable', 'date'],
            'genero' => ['nullable', 'string', 'max:20'],
            'nacionalidad' => ['nullable', 'string', 'max:80'],
            'estatus' => ['sometimes', 'string', 'max:30'],
            'metadata' => ['nullable', 'array'],
        ];
    }

    public function messages(): array
    {
        return [
            //CURP
            'curp.unique' => 'Esta CURP ya se encuentra registrada en el sistema. Intente con otra o busque al alumno existente.',
            'curp.size' => 'La CURP debe tener exactamente 18 caracteres.',
            'curp.required' => 'La CURP es un dato obligatorio.',

            //Nombre
            'nombre.required' => 'El nombre es un dato obligatorio.',
            'nombre.string' => 'El nombre debe ser una cadena de texto.',
            'nombre.max' => 'El nombre no puede exceder los 120 caracteres.',

        ];
}
}