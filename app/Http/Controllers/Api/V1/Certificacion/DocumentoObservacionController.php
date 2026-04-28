<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Certificacion;

use App\Http\Controllers\Controller;
use App\Http\Requests\Certificacion\AtenderDocumentoObservacionRequest;
use App\Http\Requests\Certificacion\DocumentoAccionCapturaRequest;
use App\Http\Requests\Certificacion\StoreDocumentoObservacionRequest;
use App\Http\Resources\Certificacion\DocumentoAcademicoCapturaResource;
use App\Http\Resources\Certificacion\DocumentoObservacionResource;
use App\Models\DocumentoAcademico;
use App\Models\DocumentoObservacion;
use App\Services\Certificacion\DocumentoObservacionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\ValidationException;

class DocumentoObservacionController extends Controller
{
    public function __construct(
        protected DocumentoObservacionService $service,
    ) {}

    public function index(Request $request, DocumentoAcademico $documento): AnonymousResourceCollection
    {
        $this->authorize('view', $documento);

        $q = $documento->observaciones()->orderByDesc('id');
        if ($request->filled('estado')) {
            $q->where('estado', $request->string('estado')->toString());
        }

        return DocumentoObservacionResource::collection($q->get());
    }

    public function store(StoreDocumentoObservacionRequest $request, DocumentoAcademico $documento): JsonResponse
    {
        $this->authorize('rechazar', $documento);
        if (! $request->user()->hasRole('educacion_superior') && ! $request->user()->hasAnyRole(['admin', 'superadmin'])) {
            throw ValidationException::withMessages([
                'rol' => ['Solo Educación Superior puede registrar observaciones institucionales.'],
            ]);
        }

        $obs = $this->service->crear(
            $documento->fresh(),
            $request->validated(),
            $request->user()?->id,
            $request->ip(),
            $request->userAgent(),
        );

        return (new DocumentoObservacionResource($obs))
            ->response()
            ->setStatusCode(200);
    }

    public function atender(AtenderDocumentoObservacionRequest $request, DocumentoAcademico $documento, DocumentoObservacion $observacion): DocumentoObservacionResource
    {
        $this->authorize('update', $documento);
        if ((int) $observacion->documento_academico_id !== (int) $documento->id) {
            throw ValidationException::withMessages(['observacion' => ['La observación no pertenece al documento.']]);
        }

        $obs = $this->service->atender(
            $observacion,
            $request->validated(),
            $request->user()?->id,
            $request->ip(),
            $request->userAgent(),
        );

        return new DocumentoObservacionResource($obs);
    }

    public function devolver(DocumentoAccionCapturaRequest $request, DocumentoAcademico $documento): DocumentoAcademicoCapturaResource
    {
        $this->authorize('rechazar', $documento);

        $doc = $this->service->devolverConObservaciones(
            $documento->fresh(),
            $request->user()?->id,
            $request->input('motivo'),
            $request->ip(),
            $request->userAgent(),
        );

        return new DocumentoAcademicoCapturaResource($doc->fresh());
    }
}
