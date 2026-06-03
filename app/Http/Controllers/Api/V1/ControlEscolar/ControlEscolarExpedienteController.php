<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\ControlEscolar;

use App\Http\Controllers\Controller;
use App\Http\Requests\ControlEscolar\ExpedienteMasivoRequest;
use App\Http\Requests\ControlEscolar\ObservarExpedienteOperativoRequest;
use App\Http\Requests\ControlEscolar\StoreExpedienteDocumentoRequest;
use App\Http\Requests\ControlEscolar\StoreExpedienteOperativoRequest;
use App\Http\Requests\ControlEscolar\ValidarExpedienteOperativoRequest;
use App\Services\ControlEscolar\ControlEscolarExpedienteOperativoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ControlEscolarExpedienteController extends Controller
{
    public function __construct(
        protected ControlEscolarExpedienteOperativoService $service,
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

    public function documentosRequeridos(Request $request): JsonResponse
    {
        $this->authorizeVer($request);

        return response()->json([
            'success' => true,
            'data' => $this->service->documentosRequeridos($request->user()),
        ]);
    }

    public function actividadReciente(Request $request): JsonResponse
    {
        $this->authorizeVer($request);

        $limit = max(1, min(20, (int) $request->integer('limit', 8)));

        return response()->json([
            'success' => true,
            'data' => $this->service->actividadReciente($request->user(), $limit),
        ]);
    }

    public function store(StoreExpedienteOperativoRequest $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Expediente creado correctamente.',
            'data' => $this->service->crear($request->user(), $request->validated()),
        ], 201);
    }

    public function cargarDocumento(StoreExpedienteDocumentoRequest $request, int $alumno): JsonResponse
    {
        /** @var \Illuminate\Http\UploadedFile $archivo */
        $archivo = $request->file('archivo');

        return response()->json([
            'success' => true,
            'message' => 'Documento cargado correctamente.',
            'data' => $this->service->cargarDocumento(
                $request->user(),
                $alumno,
                (string) $request->validated('tipo_documento'),
                $archivo,
            ),
        ], 201);
    }

    public function validar(ValidarExpedienteOperativoRequest $request, int $alumno): JsonResponse
    {
        try {
            $data = $this->service->validar(
                $request->user(),
                $alumno,
                $request->validated('comentario'),
            );
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'No es posible validar el expediente porque faltan documentos obligatorios o hay observaciones abiertas.',
                'errors' => $e->errors(),
                'code' => 'EXPEDIENTE_DOCUMENTOS_INCOMPLETOS',
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Expediente validado correctamente.',
            'data' => $data,
        ]);
    }

    public function observar(ObservarExpedienteOperativoRequest $request, int $alumno): JsonResponse
    {
        $v = $request->validated();

        return response()->json([
            'success' => true,
            'message' => 'Expediente observado correctamente.',
            'data' => $this->service->observar(
                $request->user(),
                $alumno,
                (string) $v['motivo'],
                $v['descripcion'] ?? null,
            ),
        ]);
    }

    public function validarMasivo(ExpedienteMasivoRequest $request): JsonResponse
    {
        abort_unless($request->user()?->can('expedientes.validar') || $request->user()?->can('expedientes.validacion.masiva'), 403);

        return response()->json([
            'success' => true,
            'message' => 'Validación masiva procesada.',
            'data' => $this->service->validarMasivo($request->user(), $request->validated('ids')),
        ]);
    }

    public function observarMasivo(ExpedienteMasivoRequest $request): JsonResponse
    {
        abort_unless($request->user()?->can('expedientes.observar') || $request->user()?->can('expedientes.observacion.masiva'), 403);

        $v = array_merge($request->validated(), $request->validate([
            'motivo' => ['required', 'string', 'min:5', 'max:255'],
            'descripcion' => ['nullable', 'string', 'max:2000'],
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Observación masiva registrada.',
            'data' => $this->service->observarMasivo(
                $request->user(),
                $v['ids'],
                (string) ($v['motivo'] ?? 'Observación masiva'),
                $v['descripcion'] ?? null,
            ),
        ]);
    }

    public function exportar(Request $request): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $user = $request->user();
        abort_unless($user !== null, 403);
        abort_unless(
            $user->can('expedientes.exportar') || $user->can('reportes.ver') || $user->can('exportar_reportes'),
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
            'programa_id' => $request->integer('programa_id'),
            'sede_id' => $request->integer('sede_id'),
            'documento_faltante' => trim((string) $request->query('documento_faltante', '')),
            'documentos_faltantes' => trim((string) $request->query('documentos_faltantes', '')),
            'con_observaciones' => $request->query('con_observaciones'),
            'fecha_desde' => trim((string) $request->query('fecha_desde', '')),
            'fecha_hasta' => trim((string) $request->query('fecha_hasta', '')),
            'sort' => trim((string) $request->query('sort', $request->query('sort_by', 'updated_at'))),
            'direction' => trim((string) $request->query('direction', $request->query('sort_dir', 'desc'))),
            'page' => (int) $request->integer('page', 1),
            'per_page' => (int) $request->integer('per_page', 10),
        ];
    }

    private function authorizeVer(Request $request): void
    {
        $user = $request->user();
        abort_unless($user !== null, 403);
        abort_unless(
            $user->can('expedientes.ver') || $user->can('ver_alumnos') || $user->can('alumnos.ver'),
            403
        );
    }
}
