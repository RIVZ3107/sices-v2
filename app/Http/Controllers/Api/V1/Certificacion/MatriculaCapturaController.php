<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Certificacion;

use App\Http\Controllers\Controller;
use App\Http\Requests\Certificacion\StoreMatriculaCapturaRequest;
use App\Http\Resources\Certificacion\MatriculaResource;
use App\Models\Matricula;
use App\Services\Certificacion\CertificacionAlcanceService;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

class MatriculaCapturaController extends Controller
{
    public function __construct(
        protected CertificacionAlcanceService $alcance,
    ) {}

    public function store(StoreMatriculaCapturaRequest $request): JsonResponse
    {
        $this->authorize('create', Matricula::class);

        $ofertaId = (int) $request->validated()['oferta_academica_id'];
        if (! $this->alcance->ofertaEnAlcance($request->user(), $ofertaId)) {
            throw new AccessDeniedHttpException('La oferta académica está fuera de su alcance territorial.');
        }

        $matricula = Matricula::query()->create($request->validated());

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
