<?php

declare(strict_types=1);

namespace App\Services\Certificacion;

use App\Models\DocumentoAcademico;

/**
 * Punto de extensión para resolver datos del responsable cuando exista especificación oficial / XML legacy.
 *
 * TODO: Implementar cuando se disponga de la fuente normativa o comparación contra XML/cadena legacy real.
 */
class NoCertificadoResponsableExtractor
{
    /**
     * @return array<string, mixed>|null
     */
    public function extraer(DocumentoAcademico $documento): ?array
    {
        return null;
    }
}
