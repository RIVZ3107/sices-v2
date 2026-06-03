<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\ControlEscolar;

use App\Http\Controllers\Controller;
use App\Models\BajaCambioSolicitud;
use App\Services\ControlEscolar\ControlEscolarBajaCambioOperativoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ControlEscolarBajaCambioController extends Controller
{
    public function __construct(
        protected ControlEscolarBajaCambioOperativoService $service,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $this->authorizeVer($request);

        return response()->json([
            'success' => true,
            'data' => $this->service->index($request->user(), $this->filtros($request)),
        ]);
    }

    public function resumen(Request $request): JsonResponse
    {
        $this->authorizeVer($request);

        return response()->json([
            'success' => true,
            'data' => $this->service->resumen($request->user(), $this->filtros($request)),
        ]);
    }

    public function flujo(Request $request): JsonResponse
    {
        $this->authorizeVer($request);

        return response()->json(['success' => true, 'data' => $this->service->flujo($request->user())]);
    }

    public function riesgoOperativo(Request $request): JsonResponse
    {
        $this->authorizeVer($request);

        return response()->json(['success' => true, 'data' => $this->service->riesgoOperativo($request->user())]);
    }

    public function motivosFrecuentes(Request $request): JsonResponse
    {
        $this->authorizeVer($request);

        return response()->json(['success' => true, 'data' => $this->service->motivosFrecuentes($request->user())]);
    }

    public function cambiosRecientes(Request $request): JsonResponse
    {
        $this->authorizeVer($request);

        return response()->json(['success' => true, 'data' => $this->service->cambiosRecientes($request->user())]);
    }

    public function show(Request $request, BajaCambioSolicitud $solicitud): JsonResponse
    {
        $this->authorizeVer($request);

        try {
            return response()->json([
                'success' => true,
                'data' => $this->service->detalle($request->user(), $solicitud),
            ]);
        } catch (\Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException) {
            return $this->errorJson('No tiene permiso para consultar esta solicitud.', 'BAJAS_CAMBIOS_ERROR', 403);
        }
    }

    public function store(Request $request): JsonResponse
    {
        abort_unless($request->user()?->can('bajas_cambios.crear'), 403);

        $data = $request->validate([
            'alumno_id' => ['required', 'integer', 'exists:alumnos,id'],
            'matricula_id' => ['required', 'integer', 'exists:matriculas,id'],
            'tipo_cambio' => ['required', 'string', 'max:40'],
            'motivo' => ['required', 'string', 'max:120'],
            'descripcion' => ['nullable', 'string', 'max:5000'],
            'fecha_efectiva' => ['nullable', 'date'],
            'fecha_inicio' => ['nullable', 'date'],
            'fecha_fin' => ['nullable', 'date'],
            'grupo_destino_id' => ['nullable', 'integer'],
            'turno_destino' => ['nullable', 'string', 'max:60'],
            'oferta_destino_id' => ['nullable', 'integer'],
            'documentacion_completa' => ['nullable', 'boolean'],
        ]);

        try {
            $s = $this->service->crear($request->user(), $data, $request->ip(), $request->userAgent());

            return response()->json([
                'success' => true,
                'message' => 'Solicitud registrada correctamente.',
                'data' => $this->service->detalle($request->user(), $s),
            ], 201);
        } catch (ValidationException $e) {
            return $this->errorFromValidation($e);
        }
    }

    public function update(Request $request, BajaCambioSolicitud $solicitud): JsonResponse
    {
        abort_unless($request->user()?->can('bajas_cambios.editar'), 403);

        $data = $request->validate([
            'motivo' => ['nullable', 'string', 'max:120'],
            'descripcion' => ['nullable', 'string'],
            'fecha_efectiva' => ['nullable', 'date'],
            'grupo_destino_id' => ['nullable', 'integer'],
            'turno_destino' => ['nullable', 'string'],
            'oferta_destino_id' => ['nullable', 'integer'],
            'documentacion_completa' => ['nullable', 'boolean'],
        ]);

        try {
            $s = $this->service->actualizar($request->user(), $solicitud, $data, $request->ip(), $request->userAgent());

            return response()->json([
                'success' => true,
                'message' => 'Solicitud actualizada.',
                'data' => $this->service->detalle($request->user(), $s),
            ]);
        } catch (ValidationException $e) {
            return $this->errorFromValidation($e);
        }
    }

    public function revisar(Request $request, BajaCambioSolicitud $solicitud): JsonResponse
    {
        abort_unless($request->user()?->can('bajas_cambios.revisar'), 403);

        try {
            $s = $this->service->revisar($request->user(), $solicitud, $request->ip(), $request->userAgent());

            return response()->json(['success' => true, 'message' => 'Solicitud en revisión.', 'data' => $this->service->detalle($request->user(), $s)]);
        } catch (ValidationException $e) {
            return $this->errorFromValidation($e);
        }
    }

    public function aprobar(Request $request, BajaCambioSolicitud $solicitud): JsonResponse
    {
        abort_unless($request->user()?->can('bajas_cambios.aprobar'), 403);

        $data = $request->validate([
            'dictamen' => ['required', 'string', 'max:5000'],
            'comentario' => ['nullable', 'string'],
            'fecha_efectiva' => ['nullable', 'date'],
        ]);

        try {
            $s = $this->service->aprobar($request->user(), $solicitud, $data, $request->ip(), $request->userAgent());

            return response()->json(['success' => true, 'message' => 'Solicitud aprobada.', 'data' => $this->service->detalle($request->user(), $s)]);
        } catch (ValidationException $e) {
            return $this->errorFromValidation($e);
        }
    }

    public function rechazar(Request $request, BajaCambioSolicitud $solicitud): JsonResponse
    {
        abort_unless($request->user()?->can('bajas_cambios.rechazar'), 403);

        $data = $request->validate([
            'motivo' => ['required', 'string', 'max:500'],
            'comentario' => ['required', 'string', 'max:5000'],
            'clasificacion' => ['nullable', 'string'],
        ]);

        try {
            $s = $this->service->rechazar($request->user(), $solicitud, $data, $request->ip(), $request->userAgent());

            return response()->json(['success' => true, 'message' => 'Solicitud rechazada.', 'data' => $this->service->detalle($request->user(), $s)]);
        } catch (ValidationException $e) {
            return $this->errorFromValidation($e);
        }
    }

    public function observar(Request $request, BajaCambioSolicitud $solicitud): JsonResponse
    {
        abort_unless($request->user()?->can('bajas_cambios.observar'), 403);

        $data = $request->validate([
            'motivo' => ['required', 'string', 'max:500'],
            'descripcion' => ['required', 'string', 'max:5000'],
        ]);

        try {
            $s = $this->service->observar($request->user(), $solicitud, $data, $request->ip(), $request->userAgent());

            return response()->json(['success' => true, 'message' => 'Observación registrada.', 'data' => $this->service->detalle($request->user(), $s)]);
        } catch (ValidationException $e) {
            return $this->errorFromValidation($e);
        }
    }

    public function aplicar(Request $request, BajaCambioSolicitud $solicitud): JsonResponse
    {
        abort_unless($request->user()?->can('bajas_cambios.aplicar'), 403);

        try {
            $s = $this->service->aplicar($request->user(), $solicitud, $request->ip(), $request->userAgent());

            return response()->json(['success' => true, 'message' => 'Cambio aplicado correctamente.', 'data' => $this->service->detalle($request->user(), $s)]);
        } catch (ValidationException $e) {
            return $this->errorFromValidation($e);
        }
    }

    public function dictamen(Request $request, BajaCambioSolicitud $solicitud)
    {
        abort_unless(
            $request->user()?->can('bajas_cambios.dictamen.generar')
            || $request->user()?->can('bajas_cambios.dictamen.descargar'),
            403
        );

        return $this->service->dictamen($request->user(), $solicitud);
    }

    public function aprobarMasivo(Request $request): JsonResponse
    {
        abort_unless($request->user()?->can('bajas_cambios.aprobar_masivo'), 403);

        try {
            $data = $this->service->aprobarMasivo($request->user(), $request->all(), $request->ip(), $request->userAgent());

            return response()->json(['success' => true, 'message' => 'Proceso masivo finalizado.', 'data' => $data]);
        } catch (ValidationException $e) {
            return $this->errorFromValidation($e);
        }
    }

    public function rechazarMasivo(Request $request): JsonResponse
    {
        abort_unless($request->user()?->can('bajas_cambios.rechazar_masivo'), 403);

        try {
            $data = $this->service->rechazarMasivo($request->user(), $request->all(), $request->ip(), $request->userAgent());

            return response()->json(['success' => true, 'message' => 'Rechazo masivo finalizado.', 'data' => $data]);
        } catch (ValidationException $e) {
            return $this->errorFromValidation($e);
        }
    }

    public function exportar(Request $request)
    {
        abort_unless($request->user()?->can('bajas_cambios.exportar'), 403);

        return $this->service->exportar($request->user(), $this->filtros($request));
    }

    /**
     * @return array<string, mixed>
     */
    protected function filtros(Request $request): array
    {
        return $request->only([
            'search', 'estatus', 'tipo_cambio', 'etapa', 'prioridad', 'motivo', 'periodo_id',
            'programa_id', 'sede_id', 'responsable_id', 'fecha_desde', 'fecha_hasta',
            'vencidas', 'criticas', 'con_observaciones', 'documentos_pendientes',
            'sort', 'direction', 'per_page', 'page',
        ]);
    }

    protected function authorizeVer(Request $request): void
    {
        $user = $request->user();
        abort_unless(
            $user !== null && (
                $user->can('bajas_cambios.ver')
                || $user->can('expedientes.ver')
                || $user->can('alumnos.ver')
            ),
            403
        );
    }

    protected function errorFromValidation(ValidationException $e): JsonResponse
    {
        $errors = $e->errors();
        $first = collect($errors)->flatten()->first() ?? 'No fue posible completar la operación.';
        $code = str_contains($first, 'duplicad') || str_contains($first, 'activa')
            ? 'BAJA_CAMBIO_SOLICITUD_DUPLICADA'
            : (str_contains($first, 'aprobar') || isset($errors['requisitos'])
                ? 'BAJA_CAMBIO_APROBACION_BLOQUEADA'
                : (str_contains($first, 'aplicar') ? 'BAJA_CAMBIO_APLICACION_BLOQUEADA' : 'BAJAS_CAMBIOS_ERROR'));

        return response()->json([
            'success' => false,
            'message' => $first,
            'errors' => $errors,
            'code' => $code,
        ], 422);
    }

    protected function errorJson(string $message, string $code, int $status): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
            'errors' => [],
            'code' => $code,
        ], $status);
    }
}
