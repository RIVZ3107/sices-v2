<?php

declare(strict_types=1);

namespace App\Services\Certificacion;

use App\Models\CargaAcademica;
use App\Models\InscripcionPeriodo;
use App\Models\PlanMateria;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CargaAcademicaService
{
    public function __construct(
        protected AuditoriaService $auditoria,
    ) {}

    /**
     * @return array{total:int, creadas:int}
     */
    public function generarDesdePlan(InscripcionPeriodo $inscripcion, ?int $actorId = null): array
    {
        $inscripcion->loadMissing('matricula.ofertaAcademica');
        $planId = $inscripcion->matricula?->ofertaAcademica?->plan_estudio_id;
        if ($planId === null) {
            throw ValidationException::withMessages([
                'plan_estudio_id' => ['La matrícula/oferta no tiene plan de estudios asociado.'],
            ]);
        }

        $tipo = $inscripcion->tipo_periodo_curricular ?: 'semestre';
        $numero = $inscripcion->numero_periodo_curricular ?? $inscripcion->semestre;
        $planMaterias = PlanMateria::query()
            ->where('plan_estudio_id', $planId)
            ->where('tipo_periodo_curricular', $tipo)
            ->where('numero_periodo_curricular', $numero)
            ->where('estatus', 'activa')
            ->orderBy('orden')
            ->orderBy('id')
            ->get();

        if ($planMaterias->isEmpty()) {
            throw ValidationException::withMessages([
                'plan_materias' => ['No existen materias activas para el plan y periodo curricular de esta inscripción.'],
            ]);
        }

        $creadas = DB::transaction(function () use ($inscripcion, $planMaterias, $actorId): int {
            $count = 0;
            foreach ($planMaterias as $planMateria) {
                $model = CargaAcademica::query()->firstOrCreate(
                    [
                        'inscripcion_periodo_id' => $inscripcion->id,
                        'plan_materia_id' => $planMateria->id,
                    ],
                    [
                        'materia_id' => $planMateria->materia_id,
                        'estatus' => 'activa',
                        'metadata' => [
                            'generada_automaticamente' => true,
                            'plan_estudio_id' => $planMateria->plan_estudio_id,
                        ],
                    ]
                );
                if ($model->wasRecentlyCreated) {
                    $count++;
                }
            }

            $this->auditoria->registrar(
                'carga_academica.generada_desde_plan',
                InscripcionPeriodo::class,
                $inscripcion->id,
                ['cargas_creadas' => $count],
                $actorId,
            );

            return $count;
        });

        $total = CargaAcademica::query()
            ->where('inscripcion_periodo_id', $inscripcion->id)
            ->count();

        return ['total' => $total, 'creadas' => $creadas];
    }
}
