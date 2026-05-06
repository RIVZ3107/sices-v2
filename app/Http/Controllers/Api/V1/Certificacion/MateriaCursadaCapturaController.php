<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Certificacion;

use App\Http\Controllers\Controller;
use App\Http\Requests\Certificacion\StoreMateriaCursadaCapturaRequest;
use App\Http\Resources\Certificacion\MateriaCursadaResource;
use App\Models\MateriaCursada;
use App\Models\Matricula;
use App\Services\Certificacion\TrayectoriaAcademicaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class MateriaCursadaCapturaController extends Controller
{
    public function __construct(
        protected TrayectoriaAcademicaService $trayectoria,
    ) {}

    public function store(StoreMateriaCursadaCapturaRequest $request): JsonResponse
    {
        $data = $request->validated();
        $matricula = Matricula::query()->findOrFail($data['matricula_id']);
        if ((int) $matricula->alumno_id !== (int) $data['alumno_id']) {
            throw ValidationException::withMessages([
                'alumno_id' => ['La matrícula no corresponde al alumno indicado.'],
            ]);
        }

        $this->authorize('capturarMaterias', $matricula);

        if ($this->trayectoria->matriculaBloqueadaParaRecalculo($matricula)) {
            throw ValidationException::withMessages([
                'matricula_id' => ['No se pueden editar materias cuando la matrícula ya tiene documento aprobado o firmado.'],
            ]);
        }

        $materia = MateriaCursada::query()->create($data);

        $this->trayectoria->sincronizarDesdeMaterias($matricula, $request->user()?->id);

        return (new MateriaCursadaResource($materia->fresh()))
            ->response()
            ->setStatusCode(201);
    }
}
