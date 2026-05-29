<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\Certificacion\BandejaDocumentoAcademicoResource;
use App\Services\Certificacion\BandejaDocumentoAcademicoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BandejaDocumentoAcademicoController extends Controller
{
    public function __construct(
        protected BandejaDocumentoAcademicoService $bandejas,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $lista = $this->bandejas->listar($request, (string) $request->query('bandeja', ''));

        return response()->json([
            'data' => BandejaDocumentoAcademicoResource::collection($lista->getCollection()),
            'meta' => [
                'current_page' => $lista->currentPage(),
                'last_page' => $lista->lastPage(),
                'per_page' => $lista->perPage(),
                'total' => $lista->total(),
                'bandeja' => $request->query('bandeja'),
            ],
        ]);
    }

    public function porRol(Request $request): JsonResponse
    {
        $lista = $this->bandejas->listar($request, '');

        return response()->json([
            'data' => BandejaDocumentoAcademicoResource::collection($lista->getCollection()),
            'meta' => [
                'current_page' => $lista->currentPage(),
                'last_page' => $lista->lastPage(),
                'per_page' => $lista->perPage(),
                'total' => $lista->total(),
                'bandejas_disponibles' => $this->bandejas->bandejasPorRol($request->user()),
            ],
        ]);
    }

    public function borradores(Request $request): JsonResponse
    {
        return $this->resolver($request, 'borradores');
    }

    public function porEnviar(Request $request): JsonResponse
    {
        return $this->resolver($request, 'por_enviar');
    }

    public function enRevision(Request $request): JsonResponse
    {
        return $this->resolver($request, 'en_revision');
    }

    public function pendientesRevision(Request $request): JsonResponse
    {
        return $this->resolver($request, 'pendientes_revision');
    }

    public function aprobados(Request $request): JsonResponse
    {
        return $this->resolver($request, 'aprobados');
    }

    public function rechazados(Request $request): JsonResponse
    {
        return $this->resolver($request, 'rechazados');
    }

    public function cancelados(Request $request): JsonResponse
    {
        return $this->resolver($request, 'cancelados');
    }

    public function listosParaFirma(Request $request): JsonResponse
    {
        return $this->resolver($request, 'listos_para_firma');
    }

    public function firmados(Request $request): JsonResponse
    {
        return $this->resolver($request, 'firmados');
    }

    public function erroresFirma(Request $request): JsonResponse
    {
        return $this->resolver($request, 'error_firma');
    }

    public function pendientesTecnicos(Request $request): JsonResponse
    {
        return $this->resolver($request, 'pendientes_tecnicos');
    }

    public function resumen(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $this->bandejas->resumen($request),
        ]);
    }

    public function resolverDinamico(Request $request, string $bandeja): JsonResponse
    {
        return $this->resolver($request, $bandeja);
    }

    protected function resolver(Request $request, string $bandeja): JsonResponse
    {
        $lista = $this->bandejas->listar($request, $bandeja);

        return response()->json([
            'data' => BandejaDocumentoAcademicoResource::collection($lista->getCollection()),
            'meta' => [
                'current_page' => $lista->currentPage(),
                'last_page' => $lista->lastPage(),
                'per_page' => $lista->perPage(),
                'total' => $lista->total(),
                'bandeja' => $bandeja,
            ],
        ]);
    }
}
