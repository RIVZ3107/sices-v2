<?php

declare(strict_types=1);

namespace App\Http\Requests\Certificacion;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAlumnoCapturaRequest extends FormRequest
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
            'curp' => ['sometimes', 'string', 'size:18', Rule::unique('alumnos', 'curp')->ignore($this->route('alumno'))],
            'nombre' => ['sometimes', 'string', 'max:120'],
            'primer_apellido' => ['sometimes', 'string', 'max:120'],
            'segundo_apellido' => ['nullable', 'string', 'max:120'],
            'fecha_nacimiento' => ['nullable', 'date'],
            'genero' => ['nullable', 'string', 'max:20'],
            'nacionalidad' => ['nullable', 'string', 'max:80'],
            'estatus' => ['sometimes', 'string', 'max:30'],
            'metadata' => ['nullable', 'array'],
        ];
    }
}
