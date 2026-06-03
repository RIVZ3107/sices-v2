<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\ControlEscolar;

use App\Http\Controllers\Controller;
use App\Services\ControlEscolar\ControlEscolarTrayectoriaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ControlEscolarTrayectoriaController extends Controller
{
    public function __construct(
        protected ControlEscolarTrayectoriaService $service,
    ) {}

    public function buscar(Request $request): JsonResponse
    {
        $this->authorizeVer($request);

        return response()->json([
            'success' => true,
            'data' => $this->service->buscarAlumnos($request->user(), $request->only([
                'search', 'programa_id', 'sede_id', 'estatus', 'per_page', 'page',
            ])),
        ]);
    }

    public function show(Request $request, int $alumno): JsonResponse
    {
        $this->authorizeVer($request);

        try {
            return response()->json([
                'success' => true,
                'data' => $this->service->alumnoDetalle($request->user(), $alumno),
            ]);
        } catch (ValidationException $e) {
            return $this->alumnoNoEncontrado();
        }
    }

    public function resumen(Request $request, int $alumno): JsonResponse
    {
        $this->authorizeVer($request);

        try {
            return response()->json([
                'success' => true,
                'data' => $this->service->resumenKpis($request->user(), $alumno),
            ]);
        } catch (ValidationException) {
            return $this->alumnoNoEncontrado();
        }
    }

    public function ultimoPeriodo(Request $request, int $alumno): JsonResponse
    {
        $this->authorizeVer($request);

        try {
            return response()->json([
                'success' => true,
                'data' => $this->service->ultimoPeriodo($request->user(), $alumno),
            ]);
        } catch (ValidationException) {
            return $this->alumnoNoEncontrado();
        }
    }

    public function kardex(Request $request, int $alumno): JsonResponse
    {
        $this->authorizeKardex($request);

        try {
            return response()->json([
                'success' => true,
                'data' => $this->service->kardex($request->user(), $alumno),
            ]);
        } catch (ValidationException) {
            return $this->alumnoNoEncontrado();
        }
    }

    public function planEstudios(Request $request, int $alumno): JsonResponse
    {
        $this->authorizePlan($request);

        try {
            return response()->json([
                'success' => true,
                'data' => $this->service->planEstudios($request->user(), $alumno),
            ]);
        } catch (ValidationException) {
            return $this->alumnoNoEncontrado();
        }
    }

    public function historialPeriodos(Request $request, int $alumno): JsonResponse
    {
        $this->authorizeHistorial($request);

        try {
            return response()->json([
                'success' => true,
                'data' => $this->service->historialPeriodos($request->user(), $alumno),
            ]);
        } catch (ValidationException) {
            return $this->alumnoNoEncontrado();
        }
    }

    public function estadisticas(Request $request, int $alumno): JsonResponse
    {
        $this->authorizeEstadisticas($request);

        try {
            return response()->json([
                'success' => true,
                'data' => $this->service->estadisticas($request->user(), $alumno),
            ]);
        } catch (ValidationException) {
            return $this->alumnoNoEncontrado();
        }
    }

    public function equivalencias(Request $request, int $alumno): JsonResponse
    {
        $this->authorizeEquivalencias($request);

        return response()->json([
            'success' => true,
            'data' => $this->service->equivalencias($request->user(), $alumno),
        ]);
    }

    public function actividad(Request $request, int $alumno): JsonResponse
    {
        $this->authorizeVer($request);

        try {
            return response()->json([
                'success' => true,
                'data' => $this->service->actividadReciente($request->user(), $alumno),
            ]);
        } catch (ValidationException) {
            return $this->alumnoNoEncontrado();
        }
    }

    public function kardexPdf(Request $request, int $alumno)
    {
        $this->authorizeKardexExportar($request);

        try {
            return $this->service->kardexPdf($request->user(), $alumno);
        } catch (ValidationException) {
            return $this->alumnoNoEncontrado();
        }
    }

    public function constancia(Request $request, int $alumno)
    {
        if (! $request->user()?->can('constancias.generar')) {
            abort(403);
        }

        try {
            return $this->service->constanciaPdf($request->user(), $alumno, $request->query('tipo_constancia'));
        } catch (ValidationException) {
            return $this->alumnoNoEncontrado();
        }
    }

    public function exportar(Request $request, int $alumno)
    {
        if (! $request->user()?->can('trayectoria.exportar') && ! $request->user()?->can('trayectoria.ver')) {
            abort(403);
        }

        try {
            return $this->service->exportarCsv($request->user(), $alumno);
        } catch (ValidationException) {
            return $this->alumnoNoEncontrado();
        }
    }

    protected function authorizeVer(Request $request): void
    {
        if (! $request->user()?->can('trayectoria.ver')
            && ! $request->user()?->can('ver_trayectorias')
            && ! $request->user()?->can('alumnos.ver')) {
            abort(403);
        }
    }

    protected function authorizeKardex(Request $request): void
    {
        if (! $request->user()?->can('kardex.ver')
            && ! $request->user()?->can('trayectoria.ver')
            && ! $request->user()?->can('alumnos.kardex.ver')) {
            abort(403);
        }
    }

    protected function authorizeKardexExportar(Request $request): void
    {
        if (! $request->user()?->can('kardex.exportar')
            && ! $request->user()?->can('trayectoria.exportar')
            && ! $request->user()?->can('kardex.ver')) {
            abort(403);
        }
    }

    protected function authorizePlan(Request $request): void
    {
        if (! $request->user()?->can('trayectoria.ver') && ! $request->user()?->can('materias.ver')) {
            abort(403);
        }
    }

    protected function authorizeHistorial(Request $request): void
    {
        if (! $request->user()?->can('trayectoria.ver') && ! $request->user()?->can('kardex.ver')) {
            abort(403);
        }
    }

    protected function authorizeEstadisticas(Request $request): void
    {
        if (! $request->user()?->can('trayectoria.ver') && ! $request->user()?->can('reportes.ver')) {
            abort(403);
        }
    }

    protected function authorizeEquivalencias(Request $request): void
    {
        if (! $request->user()?->can('trayectoria.ver')) {
            abort(403);
        }
    }

    protected function alumnoNoEncontrado(): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => 'No se encontró un alumno con los criterios proporcionados dentro de tu alcance.',
            'errors' => [],
            'code' => 'TRAYECTORIA_ALUMNO_NO_ENCONTRADO',
        ], 404);
    }
}
