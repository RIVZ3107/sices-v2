<?php

declare(strict_types=1);

namespace App\Services\Firma\Handlers;

use App\Contracts\Firma\DocumentoFirmaCanalHandlerInterface;
use App\Data\Firma\FirmaDocumentoResult;
use App\Enums\Certificacion\CanalFirmaDocumento;
use App\Models\DocumentoAcademico;
use App\Services\Firma\LegacySinceSigningBridgeService;

class NormalCertificadoSepFirmaHandler implements DocumentoFirmaCanalHandlerInterface
{
    public function __construct(
        protected LegacySinceSigningBridgeService $bridge,
    ) {}

    public function canal(): CanalFirmaDocumento
    {
        return CanalFirmaDocumento::NORMAL_CERTIFICADO_SEP;
    }

    public function firmar(DocumentoAcademico $documento, ?int $usuarioId = null): FirmaDocumentoResult
    {
        $result = $this->bridge->firmar($documento, $usuarioId);

        return new FirmaDocumentoResult(
            success: $result->success,
            message: $result->message,
            documentoId: $result->documentoId,
            urlShort: $result->urlShort,
            folioDigitalSep: $result->folioDigitalSep,
            estadoFirma: $result->estadoFirma,
            errorCode: $result->errorCode,
            errors: $result->errors,
            canalFirma: $this->canal()->value,
        );
    }
}
