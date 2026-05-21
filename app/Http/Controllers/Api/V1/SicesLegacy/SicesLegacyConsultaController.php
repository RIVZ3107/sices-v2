<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\SicesLegacy;

use App\Http\Controllers\Controller;
use App\Models\Alumno;
use App\Models\DocumentoAcademico;
use App\Services\SicesLegacy\SicesLegacyConsultaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SicesLegacyConsultaController extends Controller
{
    public function __construct(
        protected SicesLegacyConsultaService $consulta,
    ) {}

    public function health(Request $request): JsonResponse
    {
        $data = $this->consulta->health();

        return response()->json(['data' => $data]);
    }

    public function estadoSepAlumno(Request $request, Alumno $alumno): JsonResponse
    {
        $result = $this->consulta->consultarEstadoPorAlumno(
            $alumno,
            $request->user()?->id,
            $request->ip(),
            $request->userAgent(),
        );

        return $this->jsonResultado($result);
    }

    public function estadoSepDocumento(Request $request, DocumentoAcademico $documento): JsonResponse
    {
        $result = $this->consulta->consultarEstadoPorDocumento(
            $documento,
            $request->user()?->id,
            $request->ip(),
            $request->userAgent(),
        );

        return $this->jsonResultado($result);
    }

    public function porCurp(Request $request, string $curp): JsonResponse
    {
        $result = $this->consulta->consultarPorCurp(
            $curp,
            $request->user()?->id,
            $request->ip(),
            $request->userAgent(),
        );

        return $this->jsonResultado($result);
    }

    public function porUrlShort(Request $request, string $urlShort): JsonResponse
    {
        $result = $this->consulta->consultarPorUrlShort(
            $urlShort,
            $request->user()?->id,
            $request->ip(),
            $request->userAgent(),
        );

        return $this->jsonResultado($result);
    }

    /**
     * @param  array<string, mixed>  $result
     */
    protected function jsonResultado(array $result): JsonResponse
    {
        $status = ($result['success'] ?? false) ? 200 : (int) ($result['http_status'] ?? 503);

        return response()->json(['data' => $result], $status);
    }
}
