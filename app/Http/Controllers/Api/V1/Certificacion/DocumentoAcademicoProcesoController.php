<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Certificacion;

use App\Http\Controllers\Controller;
use App\Http\Requests\Certificacion\DocumentoAccionCapturaRequest;
use App\Http\Requests\Certificacion\StoreDocumentoAcademicoCapturaRequest;
use App\Http\Resources\Certificacion\DocumentoAcademicoCapturaResource;
use App\Enums\Certificacion\EstadoWorkflow;
use App\Models\DocumentoAcademico;
use App\Models\Matricula;
use App\Services\Certificacion\CertificacionAlcanceService;
use App\Services\Certificacion\AuditoriaService;
use App\Services\Certificacion\DocumentoAcademicoCapturaService;
use App\Services\Certificacion\DocumentoAcademicoRequisitosService;
use App\Services\Certificacion\DocumentoAcademicoWorkflowService;
use App\Services\Certificacion\DocumentoRevisionInstitucionalService;
use App\Services\Certificacion\FolioService;
use App\Services\Certificacion\UrlShortTokenService;
use App\Services\Certificacion\ValidacionAcademicaDocumentoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

class DocumentoAcademicoProcesoController extends Controller
{
    public function __construct(
        protected DocumentoAcademicoWorkflowService $workflow,
        protected DocumentoAcademicoCapturaService $captura,
        protected DocumentoAcademicoRequisitosService $requisitos,
        protected ValidacionAcademicaDocumentoService $validacionAcademica,
        protected FolioService $folioService,
        protected UrlShortTokenService $urlShortTokenService,
        protected CertificacionAlcanceService $alcance,
        protected DocumentoRevisionInstitucionalService $revisionInstitucional,
        protected AuditoriaService $auditoria,
    ) {}

    public function store(StoreDocumentoAcademicoCapturaRequest $request): JsonResponse
    {
        $this->authorize('create', DocumentoAcademico::class);

        $data = $request->validated();
        $matricula = Matricula::query()->with('subsistema')->findOrFail($data['matricula_id']);

        if ((int) $matricula->alumno_id !== (int) $data['alumno_id']) {
            throw ValidationException::withMessages([
                'matricula_id' => ['La matrícula no corresponde al alumno.'],
            ]);
        }

        if ((int) $matricula->ciclo_escolar_id !== (int) $data['ciclo_escolar_id']) {
            throw ValidationException::withMessages([
                'ciclo_escolar_id' => ['El ciclo escolar no coincide con la matrícula.'],
            ]);
        }

        $ofertaId = $data['oferta_academica_id'] ?? $matricula->oferta_academica_id;

        if (! $this->alcance->ofertaEnAlcance($request->user(), (int) $ofertaId)) {
            throw new AccessDeniedHttpException('La oferta académica está fuera de su alcance territorial.');
        }

        $subsistemaId = (int) ($matricula->subsistema_id ?? 0);
        if ($subsistemaId <= 0) {
            throw ValidationException::withMessages([
                'matricula_id' => ['La matrícula no tiene subsistema configurado.'],
            ]);
        }

        if (isset($data['subsistema_id']) && (int) $data['subsistema_id'] > 0 && (int) $data['subsistema_id'] !== $subsistemaId) {
            throw ValidationException::withMessages([
                'subsistema_id' => ['El subsistema del documento no coincide con el subsistema de la matrícula.'],
            ]);
        }

        $atributos = collect($data)->only([
            'alumno_id',
            'matricula_id',
            'ciclo_escolar_id',
            'region_id',
            'institucion_id',
            'sede_id',
            'tipo_documento',
            'tipo_certificacion',
            'metadata',
        ])->merge([
            'subsistema_id' => $subsistemaId,
            'oferta_academica_id' => $ofertaId,
            'fecha_solicitud' => now(),
        ])->all();

        $preview = new DocumentoAcademico(array_merge($atributos, [
            'estado_workflow' => EstadoWorkflow::BORRADOR->value,
        ]));
        $validacionCrear = $this->validacionAcademica->validarParaCrearBorrador($preview, $request->user()?->id);
        if ($validacionCrear['ok'] !== true) {
            throw ValidationException::withMessages([
                'documento' => $validacionCrear['errores'],
            ]);
        }

        $documento = $this->workflow->crearBorrador(
            $atributos,
            $request->user()?->id,
        );

        return (new DocumentoAcademicoCapturaResource($documento->fresh()))
            ->response()
            ->setStatusCode(201);
    }

    public function show(DocumentoAcademico $documento): DocumentoAcademicoCapturaResource
    {
        $this->authorize('view', $documento);

        $documento->load([
            'alumno',
            'matricula',
            'institucion',
            'sede',
            'ofertaAcademica.programaEstudio',
            'ofertaAcademica.planEstudio',
        ]);

        return new DocumentoAcademicoCapturaResource($documento);
    }

    public function revisionInstitucional(DocumentoAcademico $documento): JsonResponse
    {
        $this->authorize('view', $documento);

        $detalle = $this->revisionInstitucional->armarDetalle($documento->fresh(), request()->user());

        $this->auditoria->registrar(
            'documento_academico.revision_institucional_consulta',
            DocumentoAcademico::class,
            $documento->id,
            ['estado_workflow' => $documento->estado_workflow],
            request()->user()?->id,
            request()->ip(),
            request()->userAgent(),
        );

        return response()->json(['data' => $detalle]);
    }

    public function validar(DocumentoAcademico $documento): JsonResponse
    {
        $this->authorize('validar', $documento);

        $ev = $this->requisitos->evaluar($documento->fresh());
        $resumen = $this->validacionAcademica->resumen($documento->fresh());

        return response()->json([
            'data' => [
                'documento_id' => $documento->id,
                'valido' => $ev['valido'],
                'errores' => $ev['errores'],
                'resumen' => $resumen,
            ],
        ]);
    }

    public function pasarPendiente(DocumentoAccionCapturaRequest $request, DocumentoAcademico $documento): DocumentoAcademicoCapturaResource
    {
        $this->authorize('pasarPendiente', $documento);

        $doc = $this->captura->pasarAPendienteDesdeCaptura(
            $documento,
            $request->user()?->id,
            $request->input('motivo'),
            $request->ip(),
            $request->userAgent(),
        );

        return new DocumentoAcademicoCapturaResource($doc->fresh());
    }

    public function enviarRevision(DocumentoAccionCapturaRequest $request, DocumentoAcademico $documento): DocumentoAcademicoCapturaResource
    {
        $this->authorize('enviarRevision', $documento);

        $doc = $this->captura->enviarARevision(
            $documento,
            $request->user()?->id,
            $request->input('motivo'),
            $request->ip(),
            $request->userAgent(),
        );

        return new DocumentoAcademicoCapturaResource($doc->fresh());
    }

    public function aprobar(DocumentoAccionCapturaRequest $request, DocumentoAcademico $documento): DocumentoAcademicoCapturaResource
    {
        $this->authorize('aprobar', $documento);

        $doc = $this->captura->aprobar(
            $documento,
            $request->user()?->id,
            $request->input('motivo'),
            $request->ip(),
            $request->userAgent(),
        );

        return new DocumentoAcademicoCapturaResource($doc->fresh());
    }

    public function rechazar(DocumentoAccionCapturaRequest $request, DocumentoAcademico $documento): DocumentoAcademicoCapturaResource
    {
        $this->authorize('rechazar', $documento);

        $doc = $this->workflow->rechazar(
            $documento->fresh(),
            $request->user()?->id,
            $request->input('motivo'),
            $request->ip(),
            $request->userAgent(),
        );

        return new DocumentoAcademicoCapturaResource($doc->fresh());
    }

    public function asignarFolioInterno(Request $request, DocumentoAcademico $documento): DocumentoAcademicoCapturaResource
    {
        $this->authorize('asignarFolioInterno', $documento);

        $request->validate([
            'prefijo' => ['nullable', 'string', 'max:10'],
        ]);

        $this->folioService->asignarFolioInterno($documento->fresh(), $request->input('prefijo'));

        return new DocumentoAcademicoCapturaResource($documento->fresh());
    }

    public function emitirTokenConsultaPublica(Request $request, DocumentoAcademico $documento): JsonResponse
    {
        $this->authorize('emitirTokenConsultaPublica', $documento);

        $request->validate([
            'expires_at' => ['nullable', 'date'],
        ]);

        $token = $this->urlShortTokenService->emitirTokenConsulta(
            $documento->fresh(),
            $request->date('expires_at'),
            ['origen' => 'captura_api'],
        );

        return response()->json([
            'data' => [
                'token' => $token->token,
                'expires_at' => $token->expires_at?->toIso8601String(),
                'documento' => new DocumentoAcademicoCapturaResource($documento->fresh()),
            ],
        ]);
    }

    public function marcarListoParaFirma(DocumentoAccionCapturaRequest $request, DocumentoAcademico $documento): DocumentoAcademicoCapturaResource
    {
        $this->authorize('marcarListoParaFirma', $documento);

        $doc = $this->workflow->marcarListoParaFirma(
            $documento->fresh(),
            $this->requisitos,
            $request->user()?->id,
            $request->ip(),
            $request->userAgent(),
        );

        return new DocumentoAcademicoCapturaResource($doc->fresh());
    }
}
