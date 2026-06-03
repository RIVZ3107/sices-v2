<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\ControlEscolar;

use App\Http\Controllers\Controller;
use App\Http\Requests\ControlEscolar\CancelarInscripcionRequest;
use App\Http\Requests\ControlEscolar\ConfirmarInscripcionRequest;
use App\Http\Requests\ControlEscolar\InscripcionMasivoRequest;
use App\Http\Requests\ControlEscolar\ObservarInscripcionRequest;
use App\Http\Requests\ControlEscolar\StoreInscripcionCeRequest;
use App\Http\Requests\ControlEscolar\ValidarDocumentosInscripcionRequest;
use App\Services\ControlEscolar\ControlEscolarInscripcionesService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ControlEscolarInscripcionController extends Controller
{
    public function __construct(
        protected ControlEscolarInscripcionesService $service,
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

    public function proceso(Request $request): JsonResponse
    {
        $this->authorizeVer($request);

        return response()->json([
            'success' => true,
            'data' => $this->service->proceso($request->user()),
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

    public function actividadReciente(Request $request): JsonResponse
    {
        $this->authorizeVer($request);

        $limit = max(1, min(20, (int) $request->integer('limit', 8)));

        return response()->json([
            'success' => true,
            'data' => $this->service->actividadReciente($request->user(), $limit),
        ]);
    }

    public function store(StoreInscripcionCeRequest $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'Inscripción creada correctamente.',
            'data' => $this->service->crear($request->user(), $request->validated()),
        ], 201);
    }

    public function validarDocumentos(ValidarDocumentosInscripcionRequest $request, int $inscripcion): JsonResponse
    {
        try {
            $data = $this->service->validarDocumentos(
                $request->user(),
                $inscripcion,
                $request->validated('comentario'),
            );
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'No es posible validar los documentos porque faltan requisitos.',
                'errors' => $e->errors(),
                'code' => 'INSCRIPCION_DOCUMENTOS_INCOMPLETOS',
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Documentos validados correctamente.',
            'data' => $data,
        ]);
    }

    public function confirmar(ConfirmarInscripcionRequest $request, int $inscripcion): JsonResponse
    {
        try {
            $data = $this->service->confirmar(
                $request->user(),
                $inscripcion,
                $request->validated('comentario'),
            );
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'No es posible confirmar la inscripción porque existen requisitos pendientes.',
                'errors' => $e->errors(),
                'code' => 'INSCRIPCION_REQUISITOS_PENDIENTES',
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Inscripción confirmada correctamente.',
            'data' => $data,
        ]);
    }

    public function observar(ObservarInscripcionRequest $request, int $inscripcion): JsonResponse
    {
        $v = $request->validated();

        return response()->json([
            'success' => true,
            'message' => 'Inscripción observada correctamente.',
            'data' => $this->service->observar(
                $request->user(),
                $inscripcion,
                (string) $v['motivo'],
                $v['descripcion'] ?? null,
            ),
        ]);
    }

    public function cancelar(CancelarInscripcionRequest $request, int $inscripcion): JsonResponse
    {
        $v = $request->validated();

        return response()->json([
            'success' => true,
            'message' => 'Inscripción cancelada.',
            'data' => $this->service->cancelar(
                $request->user(),
                $inscripcion,
                (string) $v['motivo'],
            ),
        ]);
    }

    public function comprobante(Request $request, int $inscripcion): \Symfony\Component\HttpFoundation\Response
    {
        abort_unless($request->user()?->can('inscripciones.comprobante.imprimir')
            || $request->user()?->can('inscripciones.confirmar')
            || $request->user()?->can('inscripciones.ver'), 403);

        return $this->service->comprobante($request->user(), $inscripcion);
    }

    public function validarDocumentosMasivo(InscripcionMasivoRequest $request): JsonResponse
    {
        abort_unless($request->user()?->can('inscripciones.validacion.masiva')
            || $request->user()?->can('inscripciones.validar_documentos'), 403);

        return response()->json([
            'success' => true,
            'message' => 'Validación documental masiva procesada.',
            'data' => $this->service->validarDocumentosMasivo($request->user(), $request->validated('ids')),
        ]);
    }

    public function confirmarMasivo(InscripcionMasivoRequest $request): JsonResponse
    {
        abort_unless($request->user()?->can('inscripciones.confirmacion.masiva')
            || $request->user()?->can('inscripciones.confirmar'), 403);

        return response()->json([
            'success' => true,
            'message' => 'Confirmación masiva procesada.',
            'data' => $this->service->confirmarMasivo($request->user(), $request->validated('ids')),
        ]);
    }

    public function exportar(Request $request): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $user = $request->user();
        abort_unless($user !== null, 403);
        abort_unless(
            $user->can('inscripciones.exportar') || $user->can('reportes.ver') || $user->can('exportar_reportes'),
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
            'turno' => trim((string) $request->query('turno', '')),
            'tipo_inscripcion' => trim((string) $request->query('tipo_inscripcion', '')),
            'documentos_pendientes' => $request->query('documentos_pendientes'),
            'con_observaciones' => $request->query('con_observaciones'),
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
            $user->can('inscripciones.ver')
            || $user->can('gestionar_inscripciones_periodo')
            || $user->can('ver_alumnos')
            || $user->can('alumnos.ver'),
            403
        );
    }
}
