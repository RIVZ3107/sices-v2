<?php

declare(strict_types=1);

namespace App\Http\Requests\ControlEscolar;

use Illuminate\Foundation\Http\FormRequest;

class ObservarExpedienteOperativoRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user !== null && (
            $user->can('expedientes.observar')
            || $user->can('observaciones.crear')
            || $user->can('documentos.observar')
        );
    }

    public function rules(): array
    {
        return [
            'motivo' => ['required', 'string', 'min:5', 'max:255'],
            'descripcion' => ['nullable', 'string', 'max:2000'],
        ];
    }

    public function messages(): array
    {
        return [
            'motivo.required' => 'Indique el motivo de la observación.',
            'motivo.min' => 'El motivo debe tener al menos 5 caracteres.',
        ];
    }
}
