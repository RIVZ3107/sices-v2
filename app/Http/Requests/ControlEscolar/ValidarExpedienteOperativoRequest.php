<?php

declare(strict_types=1);

namespace App\Http\Requests\ControlEscolar;

use Illuminate\Foundation\Http\FormRequest;

class ValidarExpedienteOperativoRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user !== null && (
            $user->can('expedientes.validar')
            || $user->can('expedientes.editar')
            || $user->can('expedientes.revisar')
        );
    }

    public function rules(): array
    {
        return [
            'comentario' => ['nullable', 'string', 'max:500'],
        ];
    }
}
