<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Certificacion;

use App\Http\Controllers\Controller;
use App\Http\Requests\Certificacion\StoreMatriculaCapturaRequest;
use App\Http\Resources\Certificacion\MatriculaResource;
use App\Models\Alumno;
use App\Models\Matricula;
use App\Models\OfertaAcademica;
use App\Services\Certificacion\AcademicRulesResolver;
use App\Services\Certificacion\CertificacionAlcanceService;
use App\Services\Certificacion\MatriculaUpnService;
use App\Services\Certificacion\ValidacionSimultaneidadAcademicaService;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

class MatriculaCapturaController extends Controller
{
    public function __construct(
        protected CertificacionAlcanceService $alcance,
        protected ValidacionSimultaneidadAcademicaService $simultaneidad,
        protected AcademicRulesResolver $academicRules,
        protected MatriculaUpnService $matriculaUpn,
    ) {}

    public function store(StoreMatriculaCapturaRequest $request): JsonResponse
    {
        $this->authorize('create', Matricula::class);

        $payload = $request->validated();
        $ofertaId = (int) $payload['oferta_academica_id'];
        if (! $this->alcance->ofertaEnAlcance($request->user(), $ofertaId)) {
            throw new AccessDeniedHttpException('La oferta académica está fuera de su alcance territorial.');
        }

        $alumno = Alumno::query()->findOrFail((int) $payload['alumno_id']);
        $this->simultaneidad->validarNuevaMatricula($alumno, $payload);

        $oferta = OfertaAcademica::query()->with('institucion.subsistema')->findOrFail($ofertaId);
        $subsistemaOferta = (int) ($oferta->institucion?->subsistema_id ?? 0);
        if ($subsistemaOferta <= 0) {
            throw new AccessDeniedHttpException('La oferta académica no tiene subsistema institucional configurado.');
        }
        if (isset($payload['subsistema_id']) && (int) $payload['subsistema_id'] > 0 && (int) $payload['subsistema_id'] !== $subsistemaOferta) {
            throw new AccessDeniedHttpException('El subsistema de la matrícula no coincide con el subsistema de la oferta académica.');
        }

        $payload['subsistema_id'] = $subsistemaOferta;
        $claveSub = strtoupper((string) ($oferta->institucion?->subsistema?->clave ?? ''));

        $rules = $this->academicRules->forSubsistemaId($subsistemaOferta);
        $metaOferta = is_array($oferta->metadata) ? $oferta->metadata : [];
        $rules->validarModalidadOferta((string) ($oferta->modalidad ?? ''), $metaOferta);

        if ($claveSub === 'UPN') {
            $payload['metadata'] = $this->matriculaUpn->prepararMetadataUpn($payload['metadata'] ?? []);
            $claveMat = trim((string) ($payload['matricula'] ?? ''));
            if ($claveMat !== '') {
                $this->matriculaUpn->validarUnicidadGlobal($claveMat);
            }
        }

        $matricula = Matricula::query()->create($payload);

        return (new MatriculaResource($matricula->fresh()))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Matricula $matricula): MatriculaResource
    {
        $this->authorize('view', $matricula);

        return new MatriculaResource($matricula);
    }
}
