<?php

declare(strict_types=1);

namespace App\Services\Firma\Handlers;

use App\Contracts\Firma\DocumentoFirmaCanalHandlerInterface;
use App\Data\Firma\FirmaDocumentoResult;
use App\Enums\Certificacion\CanalFirmaDocumento;
use App\Models\DocumentoAcademico;
use App\Services\Firma\TituloGradoSepFirmaService;

class TituloSepFirmaHandler implements DocumentoFirmaCanalHandlerInterface
{
    public function __construct(
        protected TituloGradoSepFirmaService $titulosFirma,
    ) {}

    public function canal(): CanalFirmaDocumento
    {
        return CanalFirmaDocumento::TITULO_SEP;
    }

    public function firmar(DocumentoAcademico $documento, ?int $usuarioId = null): FirmaDocumentoResult
    {
        return $this->titulosFirma->firmar($documento, $this->canal(), $usuarioId);
    }
}
