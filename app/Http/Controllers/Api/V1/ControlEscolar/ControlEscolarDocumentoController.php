<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\ControlEscolar;

use App\Http\Controllers\Controller;
use App\Models\DocumentoAcademico;
use App\Services\ControlEscolar\ControlEscolarDocumentoEscolarOperativoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ControlEscolarDocumentoController extends Controller
{
    public function __construct(
        protected ControlEscolarDocumentoEscolarOperativoService $service,
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

    public function tiposAutorizados(Request $request): JsonResponse
    {
        if (! $request->user()?->can('documentos.tipos.ver')
            && ! $request->user()?->can('documentos.ver')
            && ! $request->user()?->can('documentos.crear')
            && ! $request->user()?->can('documentos.crear_borrador')) {
            abort(403);
        }

        return response()->json([
            'success' => true,
            'data' => $this->service->tiposAutorizados($request->user()),
        ]);
    }

    public function pendientesAtencion(Request $request): JsonResponse
    {
        if (! $request->user()?->can('documentos.pendientes.ver') && ! $this->puedeVer($request)) {
            abort(403);
        }

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

    public function show(Request $request, DocumentoAcademico $documento): JsonResponse
    {
        $this->authorizeVer($request);

        try {
            return response()->json([
                'success' => true,
                'data' => $this->service->detalle($request->user(), $documento),
            ]);
        } catch (\Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException) {
            return $this->errorJson('No tiene permiso para consultar este documento.', 'DOCUMENTOS_ESCOLARES_ERROR', 403);
        }
    }

    public function store(Request $request): JsonResponse
    {
        if (! $request->user()?->can('documentos.crear')
            && ! $request->user()?->can('documentos.crear_borrador')
            && ! $request->user()?->can('crear_documentos')) {
            abort(403);
        }

        $data = $request->validate([
            'alumno_id' => ['required', 'integer', 'exists:alumnos,id'],
            'matricula_id' => ['required', 'integer', 'exists:matriculas,id'],
            'tipo_documento_id' => ['required_without:tipo_documento', 'string'],
            'tipo_documento' => ['required_without:tipo_documento_id', 'string'],
            'periodo_id' => ['nullable', 'integer'],
            'ciclo_escolar_id' => ['nullable', 'integer'],
            'oferta_academica_id' => ['nullable', 'integer'],
            'motivo' => ['nullable', 'string', 'max:2000'],
            'observaciones' => ['nullable', 'string', 'max:2000'],
            'enviar_validacion' => ['nullable', 'boolean'],
        ]);

        try {
            $doc = $this->service->crear(
                $request->user(),
                $data,
                $request->ip(),
                $request->userAgent(),
            );

            return response()->json([
                'success' => true,
                'message' => 'Solicitud documental registrada correctamente.',
                'data' => $this->service->detalle($request->user(), $doc),
            ], 201);
        } catch (ValidationException $e) {
            return $this->errorFromValidation($e);
        }
    }

    public function update(Request $request, DocumentoAcademico $documento): JsonResponse
    {
        if (! $request->user()?->can('documentos.editar') && ! $request->user()?->can('editar_documentos')) {
            abort(403);
        }

        $data = $request->validate([
            'motivo' => ['nullable', 'string', 'max:2000'],
            'observaciones' => ['nullable', 'string', 'max:2000'],
        ]);

        try {
            $doc = $this->service->actualizar(
                $request->user(),
                $documento,
                $data,
                $request->ip(),
                $request->userAgent(),
            );

            return response()->json([
                'success' => true,
                'message' => 'Solicitud actualizada correctamente.',
                'data' => $this->service->detalle($request->user(), $doc),
            ]);
        } catch (ValidationException $e) {
            return $this->errorFromValidation($e);
        }
    }

    public function enviarValidacion(Request $request, DocumentoAcademico $documento): JsonResponse
    {
        if (! $request->user()?->can('documentos.enviar_validacion')
            && ! $request->user()?->can('documentos.enviar_revision')
            && ! $request->user()?->can('enviar_revision')) {
            abort(403);
        }

        $data = $request->validate(['motivo' => ['nullable', 'string', 'max:2000']]);

        try {
            $doc = $this->service->enviarValidacion(
                $request->user(),
                $documento,
                $data['motivo'] ?? null,
                $request->ip(),
                $request->userAgent(),
            );

            return response()->json([
                'success' => true,
                'message' => 'Solicitud enviada a validación.',
                'data' => $this->service->detalle($request->user(), $doc),
            ]);
        } catch (ValidationException $e) {
            return $this->errorFromValidation($e);
        }
    }

    public function atenderObservacion(Request $request, DocumentoAcademico $documento): JsonResponse
    {
        if (! $request->user()?->can('documentos.observaciones.atender')
            && ! $request->user()?->can('observaciones.atender')
            && ! $request->user()?->can('editar_documentos')) {
            abort(403);
        }

        $data = $request->validate([
            'respuesta' => ['required', 'string', 'max:5000'],
            'observacion_id' => ['nullable', 'integer'],
        ]);

        try {
            $doc = $this->service->atenderObservacion(
                $request->user(),
                $documento,
                $data,
                $request->ip(),
                $request->userAgent(),
            );

            return response()->json([
                'success' => true,
                'message' => 'Observación atendida correctamente.',
                'data' => $this->service->detalle($request->user(), $doc),
            ]);
        } catch (ValidationException $e) {
            return $this->errorFromValidation($e);
        }
    }

    public function cancelar(Request $request, DocumentoAcademico $documento): JsonResponse
    {
        if (! $request->user()?->can('documentos.cancelar')
            && ! $request->user()?->can('rechazar_documentos')) {
            abort(403);
        }

        $data = $request->validate(['motivo' => ['required', 'string', 'max:2000']]);

        try {
            $doc = $this->service->cancelar(
                $request->user(),
                $documento,
                $data['motivo'],
                $request->ip(),
                $request->userAgent(),
            );

            return response()->json([
                'success' => true,
                'message' => 'Solicitud cancelada.',
                'data' => $this->service->detalle($request->user(), $doc),
            ]);
        } catch (ValidationException $e) {
            return $this->errorFromValidation($e);
        }
    }

    public function descargar(Request $request, DocumentoAcademico $documento)
    {
        if (! $request->user()?->can('documentos.descargar')
            && ! $request->user()?->can('expedientes.documentos.descargar')) {
            abort(403);
        }

        try {
            return $this->service->descargar($request->user(), $documento);
        } catch (ValidationException $e) {
            return $this->errorFromValidation($e);
        }
    }

    public function acuse(Request $request, DocumentoAcademico $documento)
    {
        if (! $request->user()?->can('documentos.acuse.descargar')) {
            abort(403);
        }

        try {
            return $this->service->descargarAcuse($request->user(), $documento);
        } catch (ValidationException $e) {
            return $this->errorFromValidation($e);
        }
    }

    public function exportar(Request $request)
    {
        if (! $request->user()?->can('documentos.exportar')) {
            abort(403);
        }

        return $this->service->exportar($request->user(), $this->filtros($request));
    }

    /**
     * @return array<string, mixed>
     */
    protected function filtros(Request $request): array
    {
        return $request->only([
            'search', 'estatus', 'periodo_id', 'tipo_documento_id', 'programa_id', 'sede_id',
            'fecha_desde', 'fecha_hasta', 'solo_mis_solicitudes', 'con_observaciones',
            'a_punto_de_vencer', 'requiere_correccion', 'sort', 'direction', 'per_page', 'page',
        ]);
    }

    protected function authorizeVer(Request $request): void
    {
        if (! $this->puedeVer($request)) {
            abort(403);
        }
    }

    protected function puedeVer(Request $request): bool
    {
        $user = $request->user();

        return $user !== null && (
            $user->can('documentos.ver')
            || $user->can('ver_documentos')
            || $user->can('documentos.crear_borrador')
            || $user->can('expedientes.ver')
            || $user->can('alumnos.ver')
        );
    }

    protected function errorFromValidation(ValidationException $e): JsonResponse
    {
        $errors = $e->errors();
        $first = collect($errors)->flatten()->first() ?? 'No fue posible completar la operación.';
        $code = str_contains($first, 'duplicad') || str_contains($first, 'activo')
            ? 'DOCUMENTO_SOLICITUD_DUPLICADA'
            : (str_contains($first, 'autorizado') ? 'DOCUMENTO_TIPO_NO_AUTORIZADO'
                : (str_contains($first, 'disponible') ? 'DOCUMENTO_NO_DISPONIBLE' : 'DOCUMENTOS_ESCOLARES_ERROR'));

        return response()->json([
            'success' => false,
            'message' => $first,
            'errors' => $errors,
            'code' => $code,
        ], 422);
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
