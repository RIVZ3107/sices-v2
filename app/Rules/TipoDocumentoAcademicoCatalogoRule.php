<?php

declare(strict_types=1);

namespace App\Rules;

use App\Services\DocumentosAcademicos\DocumentoAcademicoTipoService;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;

/**
 * Valida que tipo_documento exista en config/sices_documentos.php.
 */
class TipoDocumentoAcademicoCatalogoRule implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        if (! is_string($value) || $value === '') {
            $fail('Seleccione un tipo documental del catálogo institucional.');

            return;
        }

        if (! app(DocumentoAcademicoTipoService::class)->existeEnCatalogo($value)) {
            $fail('El tipo documental no está registrado en el catálogo institucional.');
        }
    }
}
