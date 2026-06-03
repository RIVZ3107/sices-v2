<?php

declare(strict_types=1);

namespace App\Http\Requests\ControlEscolar;

use Illuminate\Foundation\Http\FormRequest;

class CancelarInscripcionRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user !== null && (
            $user->can('inscripciones.cancelar')
            || $user->can('inscripciones.editar')
            || $user->can('gestionar_inscripciones_periodo')
        );
    }

    public function rules(): array
    {
        return [
            'motivo' => ['required', 'string', 'min:3', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'motivo.required' => 'Indique el motivo de la cancelación.',
        ];
    }
}
