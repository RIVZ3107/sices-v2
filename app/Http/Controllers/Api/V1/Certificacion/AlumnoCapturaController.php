<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Certificacion;

use App\Http\Controllers\Controller;
use App\Http\Requests\Certificacion\StoreAlumnoCapturaRequest;
use App\Http\Requests\Certificacion\UpdateAlumnoCapturaRequest;
use App\Http\Resources\Certificacion\AlumnoResource;
use App\Models\Alumno;
use Illuminate\Http\JsonResponse;

class AlumnoCapturaController extends Controller
{
    public function store(StoreAlumnoCapturaRequest $request): JsonResponse
    {
        $this->authorize('create', Alumno::class);

        $alumno = Alumno::query()->create($request->validated());

        return (new AlumnoResource($alumno->fresh()))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Alumno $alumno): AlumnoResource
    {
        $this->authorize('view', $alumno);

        return new AlumnoResource($alumno);
    }

    public function update(UpdateAlumnoCapturaRequest $request, Alumno $alumno): AlumnoResource
    {
        $this->authorize('update', $alumno);

        $alumno->fill($request->validated());
        $alumno->save();

        return new AlumnoResource($alumno->fresh());
    }
}
