<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Certificacion;

use App\Http\Controllers\Controller;
use App\Http\Requests\Certificacion\FirmarDocumentoRequest;
use App\Models\DocumentoAcademico;
use App\Services\Firma\LegacySinceSigningBridgeService;
use Illuminate\Http\JsonResponse;

class DocumentoFirmaController extends Controller
{
    public function __construct(
        protected LegacySinceSigningBridgeService $signingBridge,
    ) {}

    public function ejecutar(FirmarDocumentoRequest $request, DocumentoAcademico $documento): JsonResponse
    {
        $this->authorize('firmar', $documento);

        $resultado = $this->signingBridge->ejecutarFirma(
            $documento->fresh(),
            $request->user()?->id,
        );

        $status = $resultado['success'] ? 200 : 422;

        return response()->json($resultado, $status);
    }
}
