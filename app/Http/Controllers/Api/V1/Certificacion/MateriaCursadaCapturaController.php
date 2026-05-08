<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Certificacion;

use App\Http\Controllers\Controller;
use App\Http\Requests\Certificacion\StoreMateriaCursadaCapturaRequest;
use App\Http\Resources\Certificacion\MateriaCursadaResource;
use App\Models\CargaAcademica;
use App\Models\MateriaCursada;
use App\Models\Matricula;
use App\Models\PlanMateria;
use App\Services\Certificacion\AcademicRulesResolver;
use App\Services\Certificacion\TrayectoriaAcademicaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class MateriaCursadaCapturaController extends Controller
{
    public function __construct(
        protected TrayectoriaAcademicaService $trayectoria,
        protected AcademicRulesResolver $academicRules,
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

        $this->academicRules->forMatricula($matricula)->validarCapturaCalificacion($matricula, $data);

        $carga = null;
        if (! empty($data['carga_academica_id'])) {
            $carga = CargaAcademica::query()->with('planMateria')->findOrFail($data['carga_academica_id']);
            $inscripcionMatricula = (int) $carga->inscripcionPeriodo?->matricula_id;
            if ($inscripcionMatricula !== (int) $matricula->id) {
                throw ValidationException::withMessages([
                    'carga_academica_id' => ['La carga académica no pertenece a la matrícula indicada.'],
                ]);
            }
            $this->aplicarCamposDePlanMateria($data, $carga->planMateria);
            $data['inscripcion_periodo_id'] = $carga->inscripcion_periodo_id;
            $data['plan_materia_id'] = $carga->plan_materia_id;
            $data['materia_id'] = $carga->materia_id;
        } elseif (! empty($data['plan_materia_id'])) {
            $planMateria = PlanMateria::query()->findOrFail($data['plan_materia_id']);
            $this->aplicarCamposDePlanMateria($data, $planMateria);
        } else {
            // Política: Control Escolar no debe capturar materias "desde cero" cuando existen en plan.
            $planId = $matricula->ofertaAcademica?->plan_estudio_id;
            $tipoLibre = strtolower((string) ($data['tipo_periodo_curricular'] ?? 'semestre'));
            $numeroLibre = (int) ($data['numero_periodo_curricular'] ?? $data['semestre'] ?? 0);
            if ($planId !== null && ($numeroLibre > 0 || ! empty($data['semestre']))) {
                $existeEnPlan = PlanMateria::query()
                    ->where('plan_estudio_id', $planId)
                    ->where('tipo_periodo_curricular', $tipoLibre ?: 'semestre')
                    ->where('numero_periodo_curricular', $numeroLibre ?: (int) $data['semestre'])
                    ->where('estatus', 'activa')
                    ->exists();
                if ($existeEnPlan) {
                    throw ValidationException::withMessages([
                        'plan_materia_id' => ['Debe capturarse usando plan_materia/carga_academica; no se permite captura libre de clave/nombre/créditos/orden.'],
                    ]);
                }
            }
        }

        if (! isset($data['calificacion_final']) || $data['calificacion_final'] === null) {
            $data['calificacion_final'] = $data['calificacion'] ?? null;
        }
        if (! isset($data['estatus_acreditacion']) || $data['estatus_acreditacion'] === null) {
            $data['estatus_acreditacion'] = $data['estado'] ?? null;
        }

        $materia = MateriaCursada::query()->create($data);

        $this->trayectoria->sincronizarDesdeMaterias($matricula, $request->user()?->id);

        return (new MateriaCursadaResource($materia->fresh()))
            ->response()
            ->setStatusCode(201);
    }

    /**
     * @param array<string,mixed> $data
     */
    private function aplicarCamposDePlanMateria(array &$data, ?PlanMateria $planMateria): void
    {
        if ($planMateria === null) {
            return;
        }
        $data['clave'] = $planMateria->clave_materia;
        $data['nombre'] = $planMateria->nombre_materia;
        $data['semestre'] = $planMateria->semestre;
        $data['tipo_periodo_curricular'] = $planMateria->tipo_periodo_curricular;
        $data['numero_periodo_curricular'] = $planMateria->numero_periodo_curricular;
        $data['etiqueta_periodo_curricular'] = $planMateria->etiqueta_periodo_curricular;
        $data['orden'] = $planMateria->orden;
        $data['creditos'] = $planMateria->creditos;
        $data['materia_id'] = $planMateria->materia_id;
        $data['plan_materia_id'] = $planMateria->id;
    }
}
