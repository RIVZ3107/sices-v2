<?php

declare(strict_types=1);

namespace App\Services\Legacy;

use App\Data\Legacy\LegacyShadowResult;
use App\Models\DocumentoAcademico;
use App\Services\SicesLegacy\SicesLegacyShadowExportService;

/**
 * Adaptador de compatibilidad hacia {@see SicesLegacyShadowExportService}.
 *
 * @deprecated Preferir SicesLegacyShadowExportService directamente.
 */
class SicesLegacyCertificationShadowService
{
    public function __construct(
        protected SicesLegacyShadowExportService $exportService,
    ) {}

    public function syncForSigning(DocumentoAcademico $documento): LegacyShadowResult
    {
        $result = $this->exportService->exportarDocumentoParaFirma($documento, auth()->id());

        return new LegacyShadowResult(
            success: $result->success,
            message: $result->message,
            legacyCertId: $result->legacyId,
            urlShort: $result->urlShort,
            metadata: [
                'materias_exportadas' => $result->materiasExportadas,
                'errors' => $result->errors,
            ],
        );
    }
}
