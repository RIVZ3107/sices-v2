<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Certificacion;

use App\Http\Controllers\Controller;
use App\Http\Requests\Certificacion\FirmarDocumentoRequest;
use App\Models\DocumentoAcademico;
use App\Services\Firma\DocumentoFirmaUnificadoService;
use Illuminate\Http\JsonResponse;

class DocumentoFirmaController extends Controller
{
    public function __construct(
        protected DocumentoFirmaUnificadoService $firmaUnificada,
    ) {}

    public function ejecutar(FirmarDocumentoRequest $request, DocumentoAcademico $documento): JsonResponse
    {
        $this->authorize('firmar', $documento);

        $resultado = $this->firmaUnificada->firmar(
            $documento->fresh(),
            $request->user()?->id,
        );

        $status = $resultado->success ? 200 : 422;

        return response()->json($resultado->toResponseArray(), $status);
    }

    public function config(): JsonResponse
    {
        return response()->json([
            'data' => array_merge(
                $this->firmaUnificada->configuracionCanales(),
                ['since_firma_env' => config('since.firma.env', 'dev')],
            ),
        ]);
    }
}
