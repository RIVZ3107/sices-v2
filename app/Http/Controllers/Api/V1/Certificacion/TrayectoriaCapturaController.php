<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Certificacion;

use App\Http\Controllers\Controller;
use App\Http\Requests\Certificacion\UpsertTrayectoriaCapturaRequest;
use App\Http\Resources\Certificacion\TrayectoriaAcademicaResource;
use App\Models\Matricula;
use App\Services\Certificacion\TrayectoriaAcademicaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class TrayectoriaCapturaController extends Controller
{
    public function __construct(
        protected TrayectoriaAcademicaService $trayectoria,
    ) {}

    public function upsert(UpsertTrayectoriaCapturaRequest $request): JsonResponse
    {
        $data = $request->validated();
        $matricula = Matricula::query()->findOrFail($data['matricula_id']);
        if ((int) $matricula->alumno_id !== (int) $data['alumno_id']) {
            throw ValidationException::withMessages([
                'alumno_id' => ['La matrícula no corresponde al alumno indicado.'],
            ]);
        }

        $this->authorize('sincronizarTrayectoria', $matricula);

        if ($this->trayectoria->matriculaBloqueadaParaRecalculo($matricula)) {
            throw ValidationException::withMessages([
                'matricula_id' => ['No se puede modificar la trayectoria con documento aprobado o firmado asociado a esta matrícula.'],
            ]);
        }

        $resultado = $this->trayectoria->sincronizarDesdeMaterias($matricula, $request->user()?->id);
        $trayectoria = $resultado['trayectoria']->fresh();

        $trayectoria->fill(collect($data)->only(['fecha_inicio', 'fecha_fin'])->all());
        if (isset($data['metadata']) && is_array($data['metadata'])) {
            $trayectoria->metadata = array_merge((array) $trayectoria->metadata, $data['metadata']);
        }
        $trayectoria->save();

        return (new TrayectoriaAcademicaResource($trayectoria->fresh()))
            ->response()
            ->setStatusCode($resultado['creada_trayectoria'] ? 201 : 200);
    }
}
