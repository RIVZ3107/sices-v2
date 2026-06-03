<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\ControlEscolar;

use App\Http\Controllers\Controller;
use App\Http\Requests\ControlEscolar\CancelarReinscripcionRequest;
use App\Http\Requests\ControlEscolar\CompletarReinscripcionRequest;
use App\Http\Requests\ControlEscolar\DesbloquearReinscripcionRequest;
use App\Http\Requests\ControlEscolar\ObservarReinscripcionRequest;
use App\Http\Requests\ControlEscolar\ReinscripcionMasivoRequest;
use App\Http\Requests\ControlEscolar\StoreReinscripcionRequest;
use App\Services\ControlEscolar\ControlEscolarReinscripcionesService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ControlEscolarReinscripcionController extends Controller
{
    public function __construct(
        protected ControlEscolarReinscripcionesService $service,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorizeVer($request);

        return response()->json([
            'success' => true,
            'data' => $this->service->gestion($request->user(), $this->filtros($request)),
        ]);
    }

    public function resumen(Request $request): JsonResponse
    {
        $this->authorizeVer($request);

        return response()->json([
            'success' => true,
            'data' => $this->service->resumen($request->user()),
        ]);
    }

    public function motivosBloqueo(Request $request): JsonResponse
    {
        $this->authorizeVer($request);

        return response()->json([
            'success' => true,
            'data' => $this->service->motivosBloqueoApi($request->user()),
        ]);
    }

    public function flujo(Request $request): JsonResponse
    {
        $this->authorizeVer($request);

        return response()->json([
            'success' => true,
            'data' => $this->service->flujo($request->user()),
        ]);
    }

    public function elegibles(Request $request): JsonResponse
    {
        $this->authorizeVer($request);

        return response()->json([
            'success' => true,
            'data' => $this->service->elegibles($request->user(), (int) $request->integer('limit', 50)),
        ]);
    }

    public function store(StoreReinscripcionRequest $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Reinscripción iniciada correctamente.',
            'data' => $this->service->crear($request->user(), $request->validated()),
        ], 201);
    }

    public function desbloquear(DesbloquearReinscripcionRequest $request, int $reinscripcion): JsonResponse
    {
        try {
            $v = $request->validated();
            $data = $this->service->desbloquear(
                $request->user(),
                $reinscripcion,
                (string) $v['motivo'],
                (string) $v['comentario'],
            );
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'No es posible desbloquear la reinscripción sin resolver los bloqueos o registrar una justificación autorizada.',
                'errors' => $e->errors(),
                'code' => 'REINSCRIPCION_DESBLOQUEO_NO_PERMITIDO',
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Reinscripción desbloqueada correctamente.',
            'data' => $data,
        ]);
    }

    public function completar(CompletarReinscripcionRequest $request, int $reinscripcion): JsonResponse
    {
        try {
            $data = $this->service->completar(
                $request->user(),
                $reinscripcion,
                $request->validated('comentario'),
            );
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'No es posible completar la reinscripción porque existen requisitos pendientes.',
                'errors' => $e->errors(),
                'code' => 'REINSCRIPCION_REQUISITOS_PENDIENTES',
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Reinscripción completada correctamente.',
            'data' => $data,
        ]);
    }

    public function observar(ObservarReinscripcionRequest $request, int $reinscripcion): JsonResponse
    {
        $v = $request->validated();

        return response()->json([
            'success' => true,
            'message' => 'Reinscripción observada correctamente.',
            'data' => $this->service->observar(
                $request->user(),
                $reinscripcion,
                (string) $v['motivo'],
                $v['descripcion'] ?? null,
            ),
        ]);
    }

    public function cancelar(CancelarReinscripcionRequest $request, int $reinscripcion): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Reinscripción cancelada.',
            'data' => $this->service->cancelar(
                $request->user(),
                $reinscripcion,
                (string) $request->validated('motivo'),
            ),
        ]);
    }

    public function ficha(Request $request, int $reinscripcion): \Symfony\Component\HttpFoundation\Response
    {
        abort_unless(
            $request->user()?->can('reinscripciones.ficha.generar')
            || $request->user()?->can('reinscripciones.ficha.descargar')
            || $request->user()?->can('reinscripciones.completar'),
            403
        );

        return $this->service->ficha($request->user(), $reinscripcion);
    }

    public function desbloquearMasivo(ReinscripcionMasivoRequest $request): JsonResponse
    {
        abort_unless(
            $request->user()?->can('reinscripciones.desbloqueo.masivo')
            || $request->user()?->can('reinscripciones.desbloquear'),
            403
        );

        $v = array_merge($request->validated(), $request->validate([
            'motivo' => ['required', 'string', 'min:5', 'max:255'],
            'comentario' => ['required', 'string', 'min:5', 'max:2000'],
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Desbloqueo masivo procesado.',
            'data' => $this->service->desbloquearMasivo(
                $request->user(),
                $v['ids'],
                (string) $v['motivo'],
                (string) $v['comentario'],
            ),
        ]);
    }

    public function completarMasivo(ReinscripcionMasivoRequest $request): JsonResponse
    {
        abort_unless(
            $request->user()?->can('reinscripciones.completar.masivo')
            || $request->user()?->can('reinscripciones.completar'),
            403
        );

        return response()->json([
            'success' => true,
            'message' => 'Completado masivo procesado.',
            'data' => $this->service->completarMasivo($request->user(), $request->validated('ids')),
        ]);
    }

    public function exportar(Request $request): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $user = $request->user();
        abort_unless($user !== null, 403);
        abort_unless(
            $user->can('reinscripciones.exportar') || $user->can('reportes.ver') || $user->can('exportar_reportes'),
            403
        );

        return $this->service->exportarCsv($user, $this->filtros($request));
    }

    /**
     * @return array<string, mixed>
     */
    private function filtros(Request $request): array
    {
        return [
            'search' => trim((string) $request->query('search', $request->query('q', ''))),
            'estatus' => trim((string) $request->query('estatus', '')),
            'periodo_id' => $request->integer('periodo_id') ?: $request->integer('ciclo_escolar_id'),
            'programa_id' => $request->integer('programa_id'),
            'sede_id' => $request->integer('sede_id'),
            'motivo_bloqueo' => trim((string) $request->query('motivo_bloqueo', '')),
            'con_adeudos' => $request->query('con_adeudos'),
            'con_calificaciones_pendientes' => $request->query('con_calificaciones_pendientes'),
            'con_observaciones' => $request->query('con_observaciones'),
            'validacion_normativa_pendiente' => $request->query('validacion_normativa_pendiente'),
            'fecha_desde' => trim((string) $request->query('fecha_desde', '')),
            'fecha_hasta' => trim((string) $request->query('fecha_hasta', '')),
            'sort' => trim((string) $request->query('sort', 'updated_at')),
            'direction' => trim((string) $request->query('direction', 'desc')),
            'page' => (int) $request->integer('page', 1),
            'per_page' => (int) $request->integer('per_page', 10),
        ];
    }

    private function authorizeVer(Request $request): void
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
    }
}
