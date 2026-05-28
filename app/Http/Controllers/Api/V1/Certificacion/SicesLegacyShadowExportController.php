<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Certificacion;

use App\Http\Controllers\Controller;
use App\Models\DocumentoAcademico;
use App\Services\SicesLegacy\SicesLegacyShadowExportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SicesLegacyShadowExportController extends Controller
{
    public function __construct(
        protected SicesLegacyShadowExportService $exportService,
    ) {}

    public function exportar(Request $request, DocumentoAcademico $documento): JsonResponse
    {
        $this->authorize('view', $documento);

        $result = $this->exportService->exportarDocumentoParaFirma(
            $documento,
            $request->user()?->id,
        );

        $status = $result->success ? 200 : 422;

        return response()->json($result->toResponseArray(), $status);
    }
}
