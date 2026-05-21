<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\ControlEscolar;

use App\Http\Controllers\Controller;
use App\Services\ControlEscolar\ControlEscolarAlumnosService;
use App\Services\ControlEscolar\ControlEscolarBajasCambiosService;
use App\Services\ControlEscolar\ControlEscolarCalificacionesService;
use App\Services\ControlEscolar\ControlEscolarDashboardService;
use App\Services\ControlEscolar\ControlEscolarDocumentosService;
use App\Services\ControlEscolar\ControlEscolarExpedientesService;
use App\Services\ControlEscolar\ControlEscolarImportacionesService;
use App\Services\ControlEscolar\ControlEscolarInscripcionesService;
use App\Services\ControlEscolar\ControlEscolarNotificacionesService;
use App\Services\ControlEscolar\ControlEscolarObservacionesService;
use App\Services\ControlEscolar\ControlEscolarReinscripcionesService;
use App\Services\ControlEscolar\ControlEscolarReportesService;
use App\Services\ControlEscolar\ControlEscolarSolicitudesService;
use App\Services\ControlEscolar\ControlEscolarTrayectoriaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ControlEscolarController extends Controller
{
    public function __construct(
        protected ControlEscolarDashboardService $dashboardService,
        protected ControlEscolarAlumnosService $alumnosService,
        protected ControlEscolarExpedientesService $expedientesService,
        protected ControlEscolarImportacionesService $importacionesService,
        protected ControlEscolarInscripcionesService $inscripcionesService,
        protected ControlEscolarReinscripcionesService $reinscripcionesService,
        protected ControlEscolarTrayectoriaService $trayectoriaService,
        protected ControlEscolarCalificacionesService $calificacionesService,
        protected ControlEscolarDocumentosService $documentosService,
        protected ControlEscolarBajasCambiosService $bajasCambiosService,
        protected ControlEscolarSolicitudesService $solicitudesService,
        protected ControlEscolarObservacionesService $observacionesService,
        protected ControlEscolarNotificacionesService $notificacionesService,
        protected ControlEscolarReportesService $reportesService,
    ) {}

    public function dashboard(Request $request): JsonResponse
    {
        $request->user()->can('ver_documentos');

        return response()->json([
            'ok' => true,
            'data' => $this->dashboardService->resumen($request->user()),
        ]);
    }

    public function alumnos(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user !== null, 403);
        abort_unless(
            $user->can('ver_alumnos') || $user->can('alumnos.ver') || $user->can('expedientes.ver'),
            403
        );

        $search = trim((string) $request->query('search', $request->query('q', '')));
        $page = (int) $request->integer('page', 1);
        $perPage = (int) $request->integer('per_page', 10);

        return response()->json([
            'ok' => true,
            'data' => $this->alumnosService->gestion($user, $search !== '' ? $search : null, $page, $perPage),
        ]);
    }

    public function expedientes(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user !== null, 403);
        abort_unless(
            $user->can('ver_alumnos') || $user->can('alumnos.ver') || $user->can('expedientes.ver'),
            403
        );

        $search = trim((string) $request->query('search', $request->query('q', '')));
        $page = (int) $request->integer('page', 1);
        $perPage = (int) $request->integer('per_page', 10);

        return response()->json([
            'ok' => true,
            'data' => $this->expedientesService->gestion($user, $search !== '' ? $search : null, $page, $perPage),
        ]);
    }

    public function inscripciones(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user !== null, 403);
        abort_unless(
            $user->can('inscripciones.ver')
            || $user->can('gestionar_inscripciones_periodo')
            || $user->can('ver_alumnos')
            || $user->can('alumnos.ver'),
            403
        );

        $search = trim((string) $request->query('search', $request->query('q', '')));
        $page = (int) $request->integer('page', 1);
        $perPage = (int) $request->integer('per_page', 10);

        return response()->json([
            'ok' => true,
            'data' => $this->inscripcionesService->gestion($user, $search !== '' ? $search : null, $page, $perPage),
        ]);
    }

    public function reinscripciones(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user !== null, 403);
        abort_unless(
            $user->can('reinscripciones.ver')
            || $user->can('reinscripciones.revisar')
            || $user->can('reinscripciones.crear')
            || $user->can('ver_alumnos')
            || $user->can('alumnos.ver'),
            403
        );

        $search = trim((string) $request->query('search', $request->query('q', '')));
        $page = (int) $request->integer('page', 1);
        $perPage = (int) $request->integer('per_page', 10);

        return response()->json([
            'ok' => true,
            'data' => $this->reinscripcionesService->gestion($user, $search !== '' ? $search : null, $page, $perPage),
        ]);
    }

    public function trayectoria(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user !== null, 403);
        abort_unless(
            $user->can('trayectoria.ver')
            || $user->can('ver_trayectorias')
            || $user->can('kardex.ver')
            || $user->can('ver_alumnos')
            || $user->can('alumnos.ver'),
            403
        );

        $search = trim((string) $request->query('search', $request->query('q', '')));
        $alumnoId = $request->filled('alumno_id') ? (int) $request->integer('alumno_id') : null;
        $periodo = trim((string) $request->query('periodo', ''));
        $historialSearch = trim((string) $request->query('historial_search', ''));

        return response()->json([
            'ok' => true,
            'data' => $this->trayectoriaService->consulta(
                $user,
                $search !== '' ? $search : null,
                $alumnoId,
                $periodo !== '' ? $periodo : null,
                $historialSearch !== '' ? $historialSearch : null,
            ),
        ]);
    }

    public function calificaciones(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user !== null, 403);
        abort_unless(
            $user->can('calificaciones.ver')
            || $user->can('calificaciones.capturar')
            || $user->can('calificaciones.revisar')
            || $user->can('ver_alumnos')
            || $user->can('alumnos.ver'),
            403
        );

        $search = trim((string) $request->query('search', $request->query('q', '')));
        $page = (int) $request->integer('page', 1);
        $perPage = (int) $request->integer('per_page', 10);

        return response()->json([
            'ok' => true,
            'data' => $this->calificacionesService->gestion($user, $search !== '' ? $search : null, $page, $perPage),
        ]);
    }

    public function documentos(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user !== null, 403);
        abort_unless(
            $user->can('documentos.ver')
            || $user->can('ver_documentos')
            || $user->can('documentos.crear_borrador')
            || $user->can('expedientes.ver'),
            403
        );

        $search = trim((string) $request->query('search', $request->query('q', '')));
        $page = (int) $request->integer('page', 1);
        $perPage = (int) $request->integer('per_page', 10);

        return response()->json([
            'ok' => true,
            'data' => $this->documentosService->gestion($user, $search !== '' ? $search : null, $page, $perPage),
        ]);
    }

    public function bajasCambios(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user !== null, 403);
        abort_unless(
            $user->can('expedientes.ver')
            || $user->can('expedientes.editar')
            || $user->can('ver_alumnos')
            || $user->can('alumnos.ver'),
            403
        );

        $search = trim((string) $request->query('search', $request->query('q', '')));
        $estatus = trim((string) $request->query('estatus', ''));
        $page = (int) $request->integer('page', 1);
        $perPage = (int) $request->integer('per_page', 10);

        return response()->json([
            'ok' => true,
            'data' => $this->bajasCambiosService->gestion(
                $user,
                $search !== '' ? $search : null,
                $estatus !== '' ? $estatus : null,
                $page,
                $perPage,
            ),
        ]);
    }

    public function solicitudes(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user !== null, 403);
        abort_unless(
            $user->can('expedientes.ver')
            || $user->can('ver_solicitud_matricula')
            || $user->can('solicitudes_matricula.ver')
            || $user->can('documentos.ver')
            || $user->can('ver_documentos')
            || $user->can('inscripciones.ver')
            || $user->can('ver_alumnos')
            || $user->can('alumnos.ver'),
            403
        );

        $search = trim((string) $request->query('search', $request->query('q', '')));
        $page = (int) $request->integer('page', 1);
        $perPage = (int) $request->integer('per_page', 10);

        return response()->json([
            'ok' => true,
            'data' => $this->solicitudesService->gestion(
                $user,
                $search !== '' ? $search : null,
                $page,
                $perPage,
            ),
        ]);
    }

    public function observaciones(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user !== null, 403);
        abort_unless(
            $user->can('observaciones.ver')
            || $user->can('documentos.ver')
            || $user->can('ver_documentos')
            || $user->can('expedientes.ver')
            || $user->can('ver_alumnos')
            || $user->can('alumnos.ver'),
            403
        );

        $search = trim((string) $request->query('search', $request->query('q', '')));
        $page = (int) $request->integer('page', 1);
        $perPage = (int) $request->integer('per_page', 10);
        $observacionId = $request->filled('observacion_id') ? (int) $request->integer('observacion_id') : null;

        return response()->json([
            'ok' => true,
            'data' => $this->observacionesService->gestion(
                $user,
                $search !== '' ? $search : null,
                $page,
                $perPage,
                $observacionId,
            ),
        ]);
    }

    public function reportes(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user !== null, 403);
        abort_unless(
            $user->can('reportes.ver')
            || $user->can('exportar_reportes')
            || $user->can('expedientes.ver')
            || $user->can('ver_alumnos')
            || $user->can('alumnos.ver'),
            403
        );

        return response()->json([
            'ok' => true,
            'data' => $this->reportesService->indicadores($user),
        ]);
    }

    public function importaciones(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user !== null, 403);
        abort_unless(
            $user->can('importaciones_academicas.ver')
            || $user->can('importar_calificaciones')
            || $user->can('calificaciones.ver')
            || $user->can('ver_alumnos')
            || $user->can('alumnos.ver'),
            403
        );

        $search = trim((string) $request->query('search', $request->query('q', '')));
        $page = (int) $request->integer('page', 1);
        $perPage = (int) $request->integer('per_page', 10);

        return response()->json([
            'ok' => true,
            'data' => $this->importacionesService->gestion(
                $user,
                $search !== '' ? $search : null,
                $page,
                $perPage,
            ),
        ]);
    }

    public function notificaciones(Request $request): JsonResponse
    {
        $user = $request->user();
        abort_unless($user !== null, 403);
        abort_unless($user->can('notificaciones.ver'), 403);

        $search = trim((string) $request->query('search', $request->query('q', '')));
        $categoria = trim((string) $request->query('categoria', ''));
        $page = (int) $request->integer('page', 1);
        $perPage = (int) $request->integer('per_page', 8);
        $notificacionId = $request->filled('notificacion_id')
            ? (string) $request->query('notificacion_id')
            : null;

        return response()->json([
            'ok' => true,
            'data' => $this->notificacionesService->gestion(
                $user,
                $search !== '' ? $search : null,
                $categoria !== '' ? $categoria : null,
                $page,
                $perPage,
                $notificacionId,
            ),
        ]);
    }
}
