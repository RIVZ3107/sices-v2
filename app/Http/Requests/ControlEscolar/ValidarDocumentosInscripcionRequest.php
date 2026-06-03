<?php

declare(strict_types=1);

namespace App\Http\Requests\ControlEscolar;

use Illuminate\Foundation\Http\FormRequest;

class ValidarDocumentosInscripcionRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        return $user !== null && (
            $user->can('inscripciones.validar_documentos')
            || $user->can('inscripciones.revisar')
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
