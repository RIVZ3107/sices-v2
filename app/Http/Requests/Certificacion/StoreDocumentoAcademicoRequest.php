<?php

declare(strict_types=1);

namespace App\Http\Requests\Certificacion;

use App\Rules\TipoDocumentoAcademicoCatalogoRule;
use Illuminate\Foundation\Http\FormRequest;

/** Alias de captura — usar StoreDocumentoAcademicoCapturaRequest en el flujo activo. */
class StoreDocumentoAcademicoRequest extends FormRequest
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
            'tipo_documento' => ['required', 'string', 'max:64', new TipoDocumentoAcademicoCatalogoRule()],
        ];
    }
}
