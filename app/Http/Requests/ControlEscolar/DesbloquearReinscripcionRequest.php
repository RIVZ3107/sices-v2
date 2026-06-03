<?php

declare(strict_types=1);

namespace App\Http\Requests\ControlEscolar;

use Illuminate\Foundation\Http\FormRequest;

class DesbloquearReinscripcionRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user !== null && (
            $user->can('reinscripciones.desbloquear')
            || $user->can('reinscripciones.autorizar_excepcion')
        );
    }

    public function rules(): array
    {
        return [
            'motivo' => ['required', 'string', 'min:5', 'max:255'],
            'comentario' => ['required', 'string', 'min:5', 'max:2000'],
        ];
    }
}
