<?php

declare(strict_types=1);

namespace App\Http\Requests\ControlEscolar;

use Illuminate\Foundation\Http\FormRequest;

class ConfirmarInscripcionRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user !== null && (
            $user->can('inscripciones.confirmar')
            || $user->can('inscripciones.editar')
            || $user->can('gestionar_inscripciones_periodo')
        );
    }

    public function rules(): array
    {
        return [
            'comentario' => ['nullable', 'string', 'max:500'],
        ];
    }
}
