<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Certificacion;

use App\Http\Controllers\Controller;
use App\Models\DocumentoAcademico;
use App\Services\SicesLegacy\LegacyCertificadoTimbradoJsonService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Exporta JSON con estructura legacy (e11superior_cert + e11materias_cert)
 * para generación de cadena, XML y timbrado SEP en SICES PHP.
 */
class LegacyCertificadoTimbradoJsonController extends Controller
{
    public function __construct(
        protected LegacyCertificadoTimbradoJsonService $exportJson,
    ) {}

    public function show(Request $request, DocumentoAcademico $documento): JsonResponse
    {
        $this->authorize('view', $documento);

        $resultado = $this->exportJson->exportar($documento, $request->user()?->id);
        $status = $resultado->valido ? 200 : 422;

        return response()->json($resultado->toResponseArray(), $status);
    }
}
