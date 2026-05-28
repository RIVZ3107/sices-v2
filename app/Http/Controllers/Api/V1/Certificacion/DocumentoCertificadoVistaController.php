<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Certificacion;

use App\Http\Controllers\Controller;
use App\Models\DocumentoAcademico;
use App\Services\Certificacion\CertificadoVistaJsonService;
use App\Support\SicesAuth;
use Illuminate\Http\JsonResponse;

class DocumentoCertificadoVistaController extends Controller
{
    public function __construct(
        protected CertificadoVistaJsonService $vistaJson,
    ) {}

    /**
     * JSON para plantilla PDF en React (requiere documento firmado).
     */
    public function show(DocumentoAcademico $documento): JsonResponse
    {
        $this->authorize('view', $documento);

        if (! SicesAuth::canAny(auth()->user(), 'pdf.ver', 'pdf.generar', 'firma.ejecutar', 'documentos.ver', 'ver_documentos')) {
            abort(403);
        }

        $vista = $this->vistaJson->construirVista($documento->fresh(), requiereFirmado: true);

        return response()->json(['data' => $vista]);
    }
}
