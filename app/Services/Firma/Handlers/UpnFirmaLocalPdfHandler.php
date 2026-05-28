<?php

declare(strict_types=1);

namespace App\Services\Firma\Handlers;

use App\Contracts\Firma\DocumentoFirmaCanalHandlerInterface;
use App\Data\Firma\FirmaDocumentoResult;
use App\Enums\Certificacion\CanalFirmaDocumento;
use App\Models\DocumentoAcademico;
use App\Services\Firma\UpnFirmaLocalService;

class UpnFirmaLocalPdfHandler implements DocumentoFirmaCanalHandlerInterface
{
    public function __construct(
        protected UpnFirmaLocalService $upnFirma,
    ) {}

    public function canal(): CanalFirmaDocumento
    {
        return CanalFirmaDocumento::UPN_FIRMA_LOCAL;
    }

    public function firmar(DocumentoAcademico $documento, ?int $usuarioId = null): FirmaDocumentoResult
    {
        return $this->upnFirma->firmar($documento, $usuarioId);
    }
}
