<?php

declare(strict_types=1);

namespace App\Http\Requests\ControlEscolar;

use Illuminate\Foundation\Http\FormRequest;

class StoreExpedienteDocumentoRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user !== null && (
            $user->can('expedientes.documentos.cargar')
            || $user->can('documentos.crear_borrador')
            || $user->can('documentos.crear')
        );
    }

    public function rules(): array
    {
        return [
            'tipo_documento' => ['required', 'string', 'max:80'],
            'archivo' => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:10240'],
        ];
    }
}
