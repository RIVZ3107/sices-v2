<?php

declare(strict_types=1);

namespace App\Contracts\Firma;

use App\Data\Firma\FirmaDocumentoResult;
use App\Enums\Certificacion\CanalFirmaDocumento;
use App\Models\DocumentoAcademico;

interface DocumentoFirmaCanalHandlerInterface
{
    public function canal(): CanalFirmaDocumento;

    public function firmar(DocumentoAcademico $documento, ?int $usuarioId = null): FirmaDocumentoResult;
}
