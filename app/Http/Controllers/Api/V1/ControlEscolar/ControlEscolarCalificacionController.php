<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\ControlEscolar;

use App\Http\Controllers\Controller;
use App\Services\ControlEscolar\ControlEscolarCalificacionOperativoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ControlEscolarCalificacionController extends Controller
{
    public function __construct(
        protected ControlEscolarCalificacionOperativoService $service,
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

    public function avance(Request $request): JsonResponse
    {
        $this->authorizeVer($request);

        return response()->json([
            'success' => true,
            'data' => $this->service->avance($request->user()),
        ]);
    }

    public function pendientesAtencion(Request $request): JsonResponse
    {
        $this->authorizeVer($request);

        return response()->json([
            'success' => true,
            'data' => $this->service->pendientesAtencion($request->user()),
        ]);
    }

    public function fechasImportantes(Request $request): JsonResponse
    {
        $this->authorizeVer($request);

        return response()->json([
            'success' => true,
            'data' => $this->service->fechasImportantes($request->user()),
        ]);
    }

    public function show(Request $request, string $grupoMateria): JsonResponse
    {
        $this->authorizeVer($request);

        try {
            return response()->json([
                'success' => true,
                'data' => $this->service->detalleGrupoMateria($request->user(), $grupoMateria),
            ]);
        } catch (ValidationException $e) {
            return $this->errorJson('Grupo o materia no encontrado.', 'CALIFICACIONES_NO_ENCONTRADO', 404);
        }
    }

    public function alumnos(Request $request, string $grupoMateria): JsonResponse
    {
        $this->authorizeCapturar($request);

        try {
            return response()->json([
                'success' => true,
                'data' => $this->service->alumnosGrupoMateria($request->user(), $grupoMateria),
            ]);
        } catch (ValidationException) {
            return $this->errorJson('Grupo o materia no encontrado.', 'CALIFICACIONES_NO_ENCONTRADO', 404);
        }
    }

    public function capturar(Request $request, string $grupoMateria): JsonResponse
    {
        $this->authorizeCapturar($request);
        $validated = $request->validate([
            'calificaciones' => ['required', 'array', 'min:1'],
            'calificaciones.*.materia_cursada_id' => ['nullable', 'integer'],
            'calificaciones.*.alumno_id' => ['nullable', 'integer'],
            'calificaciones.*.calificacion' => ['required'],
            'calificaciones.*.observaciones' => ['nullable', 'string', 'max:500'],
        ]);

        try {
            $data = $this->service->capturar(
                $request->user(),
                $grupoMateria,
                $validated['calificaciones'],
                $request->boolean('forzar'),
            );

            return response()->json([
                'success' => true,
                'message' => 'Calificaciones guardadas correctamente.',
                'data' => $data,
            ]);
        } catch (ValidationException $e) {
            if ($e->errors()['ventana'] ?? false) {
                return $this->errorJson(
                    'La ventana de captura se encuentra cerrada para este periodo.',
                    'CALIFICACIONES_VENTANA_CERRADA',
                    422,
                    $e->errors(),
                );
            }

            return response()->json([
                'success' => false,
                'message' => 'Algunas calificaciones no pudieron procesarse.',
                'errors' => $e->errors(),
                'code' => 'CALIFICACIONES_VALIDACION_FILAS',
            ], 422);
        }
    }

    public function importar(Request $request): JsonResponse
    {
        $this->authorizeImportar($request);
        $request->validate([
            'archivo' => ['required', 'file', 'mimes:csv,txt', 'max:10240'],
            'grupo_materia' => ['nullable', 'string'],
            'preview' => ['nullable', 'boolean'],
            'confirmar' => ['nullable', 'boolean'],
        ]);

        try {
            $data = $this->service->importar(
                $request->user(),
                $request->file('archivo'),
                $request->boolean('preview', true),
                $request->boolean('confirmar'),
                $request->input('grupo_materia'),
            );

            return response()->json(['success' => true, 'data' => $data]);
        } catch (ValidationException $e) {
            return $this->errorJson(
                'La ventana de captura se encuentra cerrada para este periodo.',
                'CALIFICACIONES_VENTANA_CERRADA',
                422,
                $e->errors(),
            );
        }
    }

    public function plantilla(Request $request)
    {
        $this->authorizeImportar($request);

        return $this->service->plantillaCsv($request->query('grupo_materia'));
    }

    public function solicitarCorreccion(Request $request, int $calificacion): JsonResponse
    {
        if (! $request->user()?->can('calificaciones.correccion.solicitar')) {
            abort(403);
        }
        $validated = $request->validate([
            'motivo' => ['required', 'string', 'max:120'],
            'descripcion' => ['required', 'string', 'max:2000'],
        ]);

        try {
            $data = $this->service->solicitarCorreccion($request->user(), $calificacion, $validated);

            return response()->json([
                'success' => true,
                'message' => 'Solicitud de corrección registrada.',
                'data' => $data,
            ]);
        } catch (ValidationException $e) {
            $msg = $e->getMessage() ?: 'Ya existe una solicitud de corrección abierta para esta calificación.';

            return $this->errorJson($msg, 'CALIFICACION_CORRECCION_DUPLICADA', 422, $e->errors());
        }
    }

    public function historial(Request $request): JsonResponse
    {
        if (! $request->user()?->can('calificaciones.historial.ver') && ! $request->user()?->can('calificaciones.ver')) {
            abort(403);
        }

        return response()->json([
            'success' => true,
            'data' => $this->service->historial($request->user(), $request->query()),
        ]);
    }

    public function exportar(Request $request)
    {
        if (! $request->user()?->can('calificaciones.exportar')) {
            abort(403);
        }

        return $this->service->exportar($request->user(), $this->filtros($request));
    }

    public function exportarGrupo(Request $request, string $grupoMateria)
    {
        if (! $request->user()?->can('calificaciones.exportar')) {
            abort(403);
        }

        return $this->service->exportarGrupo($request->user(), $grupoMateria);
    }

    public function cerrarCaptura(Request $request, string $grupoMateria): JsonResponse
    {
        if (! $request->user()?->can('calificaciones.cerrar_captura')) {
            abort(403);
        }

        try {
            $data = $this->service->cerrarCaptura($request->user(), $grupoMateria);

            return response()->json([
                'success' => true,
                'message' => 'Captura cerrada correctamente.',
                'data' => $data,
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'No fue posible cerrar la captura.',
                'errors' => $e->errors(),
                'code' => 'CALIFICACIONES_ERROR',
            ], 422);
        }
    }

    /**
     * @return array<string, mixed>
     */
    protected function filtros(Request $request): array
    {
        return $request->only([
            'search', 'programa_id', 'plan_id', 'sede_id', 'periodo_id', 'grupo_id', 'materia_id',
            'semestre', 'estatus', 'con_pendientes', 'con_correcciones', 'fecha_desde', 'fecha_hasta',
            'sort', 'direction', 'per_page', 'page',
        ]);
    }

    protected function authorizeVer(Request $request): void
    {
        if (! $request->user()?->can('calificaciones.ver')
            && ! $request->user()?->can('calificaciones.capturar')
            && ! $request->user()?->can('alumnos.ver')) {
            abort(403);
        }
    }

    protected function authorizeCapturar(Request $request): void
    {
        if (! $request->user()?->can('calificaciones.capturar')
            && ! $request->user()?->can('calificaciones.editar')) {
            abort(403);
        }
    }

    protected function authorizeImportar(Request $request): void
    {
        if (! $request->user()?->can('calificaciones.importar')
            && ! $request->user()?->can('importaciones_academicas.importar')) {
            abort(403);
        }
    }

    /**
     * @param  array<string, mixed>  $errors
     */
    protected function errorJson(string $message, string $code, int $status, array $errors = []): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
            'errors' => $errors,
            'code' => $code,
        ], $status);
    }
}
