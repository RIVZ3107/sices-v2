<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Certificacion;

use App\Http\Controllers\Controller;
use App\Http\Requests\Certificacion\StoreInscripcionPeriodoRequest;
use App\Http\Resources\Certificacion\InscripcionPeriodoResource;
use App\Models\InscripcionPeriodo;
use App\Models\Matricula;
use App\Services\Certificacion\AcademicRulesResolver;
use App\Services\Certificacion\CargaAcademicaService;
use App\Services\Certificacion\ValidacionSimultaneidadAcademicaService;
use Illuminate\Http\JsonResponse;

class InscripcionPeriodoController extends Controller
{
    public function __construct(
        protected CargaAcademicaService $cargas,
        protected ValidacionSimultaneidadAcademicaService $simultaneidad,
        protected AcademicRulesResolver $academicRules,
    ) {}

    public function store(StoreInscripcionPeriodoRequest $request): JsonResponse
    {
        $data = $request->validated();
        $generarCarga = (bool) ($data['generar_carga'] ?? false);
        unset($data['generar_carga']);

        $matricula = Matricula::query()->with('ofertaAcademica.institucion.subsistema')->findOrFail((int) $data['matricula_id']);
        $estatus = strtolower((string) ($data['estatus'] ?? 'inscrita'));
        if (in_array($estatus, $this->simultaneidad->estadosInscripcionActivos(), true)) {
            $this->simultaneidad->validarNuevaInscripcionPeriodo(
                $matricula,
                (int) $data['ciclo_escolar_id']
            );
        }

        $this->academicRules->forMatricula($matricula)->validarAltaInscripcionPeriodo($matricula, $data);
        $inscripcion = InscripcionPeriodo::query()->create($data);
        $resumenCarga = null;
        if ($generarCarga) {
            $resumenCarga = $this->cargas->generarDesdePlan($inscripcion, $request->user()?->id);
        }

        return response()->json([
            'data' => new InscripcionPeriodoResource($inscripcion->fresh()),
            'carga_academica' => $resumenCarga,
        ], 201);
    }
}
