<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Certificacion;

use App\Http\Controllers\Controller;
use App\Http\Requests\Certificacion\StoreAlumnoCapturaRequest;
use App\Http\Requests\Certificacion\UpdateAlumnoCapturaRequest;
use App\Http\Resources\Certificacion\AlumnoResource;
use App\Models\Alumno;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AlumnoCapturaController extends Controller
{
        public function index(Request $request): AnonymousResourceCollection
    {
        $termino = $request->input('q');

        $alumnos = Alumno::query()
            ->when($termino, function ($query, $termino) {
                $query->where('curp', 'LIKE', "%{$termino}%")
                      ->orWhere('nombre', 'LIKE', "%{$termino}%")
                      ->orWhere('primer_apellido', 'LIKE', "%{$termino}%")
                      ->orWhere('segundo_apellido', 'LIKE', "%{$termino}%");
            })
            ->limit(100) 
            ->get();

        return AlumnoResource::collection($alumnos);
    }

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