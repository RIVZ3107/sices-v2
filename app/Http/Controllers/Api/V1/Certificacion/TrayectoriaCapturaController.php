<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Certificacion;

use App\Http\Controllers\Controller;
use App\Http\Requests\Certificacion\UpsertTrayectoriaCapturaRequest;
use App\Http\Resources\Certificacion\TrayectoriaAcademicaResource;
use App\Models\Matricula;
use App\Models\TrayectoriaAcademica;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class TrayectoriaCapturaController extends Controller
{
    public function upsert(UpsertTrayectoriaCapturaRequest $request): JsonResponse
    {
        $data = $request->validated();
        $matricula = Matricula::query()->findOrFail($data['matricula_id']);
        if ((int) $matricula->alumno_id !== (int) $data['alumno_id']) {
            throw ValidationException::withMessages([
                'alumno_id' => ['La matrícula no corresponde al alumno indicado.'],
            ]);
        }

        $this->authorize('view', $matricula);

        $trayectoria = TrayectoriaAcademica::query()->updateOrCreate(
            [
                'alumno_id' => $data['alumno_id'],
                'matricula_id' => $data['matricula_id'],
            ],
            collect($data)->except(['alumno_id', 'matricula_id'])->all(),
        );

        return (new TrayectoriaAcademicaResource($trayectoria->fresh()))
            ->response()
            ->setStatusCode($trayectoria->wasRecentlyCreated ? 201 : 200);
    }
}
