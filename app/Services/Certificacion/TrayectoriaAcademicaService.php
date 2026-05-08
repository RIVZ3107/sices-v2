<?php

declare(strict_types=1);

namespace App\Services\Certificacion;

use App\Models\DocumentoAcademico;
use App\Models\MateriaCursada;
use App\Models\Matricula;
use App\Models\PlanMateria;
use App\Models\TrayectoriaAcademica;
use Illuminate\Support\Facades\DB;

/**
 * Consolidación de trayectoria desde materias cursadas de la matrícula única.
 */
class TrayectoriaAcademicaService
{
    public function __construct(
        protected AuditoriaService $auditoria,
    ) {}

    /**
     * Recalcula métricas agregadas. Respeta bloqueo si existe documento aprobado o firmado asociado a la matrícula.
     *
     * @return array{
     *   trayectoria: TrayectoriaAcademica,
     *   creada_trayectoria?: bool,
     *   bloqueado: bool,
     *   motivo?: ?string
     * }
     */
    public function sincronizarDesdeMaterias(Matricula $matricula, ?int $actorId = null): array
    {
        if ($this->matriculaBloqueadaParaRecalculo($matricula)) {
            $existente = TrayectoriaAcademica::query()->where('matricula_id', $matricula->id)->first()
                ?? new TrayectoriaAcademica(['matricula_id' => $matricula->id]);

            return [
                'trayectoria' => $existente,
                'creada_trayectoria' => false,
                'bloqueado' => true,
                'motivo' => 'Existen documentos aprobados o firmados asociados a esta matrícula; el recálculo requiere reapertura formal con auditoría.',
            ];
        }

        $materias = MateriaCursada::query()
            ->where('matricula_id', $matricula->id)
            ->get();
        $matricula->loadMissing('ofertaAcademica');

        $umbral = (float) config('certificacion.calificacion_aprobatoria_minima', 6.0);

        $total = $materias->count();
        $asignaturasCursadas = $total;
        $creditosTotales = (int) $materias->sum(fn (MateriaCursada $m) => (int) ($m->creditos ?? 0));

        $acreditadas = 0;
        $noAcreditadas = 0;
        $sumaCalif = 0.0;
        $nCalif = 0;
        $creditosObtenidos = 0;

        foreach ($materias as $m) {
            $aprobada = $this->materiaAcreditada($m, $umbral);
            if ($aprobada === true) {
                $acreditadas++;
                $creditosObtenidos += (int) ($m->creditos ?? 0);
            } elseif ($aprobada === false) {
                $noAcreditadas++;
            }

            if ($m->calificacion !== null) {
                $sumaCalif += (float) $m->calificacion;
                $nCalif++;
            }
        }

        $promedio = $nCalif > 0 ? round($sumaCalif / $nCalif, 2) : null;
        $planId = $matricula->ofertaAcademica?->plan_estudio_id;
        $asignaturasTotal = $planId
            ? (int) PlanMateria::query()->where('plan_estudio_id', $planId)->where('estatus', 'activa')->count()
            : $total;
        $estatusTrayectoria = $total === 0
            ? 'sin_materias'
            : ($asignaturasTotal > 0 && $acreditadas >= $asignaturasTotal ? 'cumple_plan' : ($noAcreditadas === 0 ? 'consolidada' : 'con_pendientes'));

        $existente = TrayectoriaAcademica::query()->where('matricula_id', $matricula->id)->first();
        $metadataPrevio = (array) ($existente?->metadata ?? []);

        $payload = [
            'alumno_id' => $matricula->alumno_id,
            'matricula_id' => $matricula->id,
            'total_materias' => $total,
            'materias_aprobadas' => $acreditadas,
            'materias_reprobadas' => $noAcreditadas,
            'asignaturas_cursadas' => $asignaturasCursadas,
            'asignaturas_total' => $asignaturasTotal,
            'creditos_totales' => $creditosTotales,
            'creditos_obtenidos' => $creditosObtenidos,
            'promedio' => $promedio,
            'promedio_texto' => $promedio !== null ? (string) $promedio : null,
            'promedio_aprovechamiento' => $promedio,
            'materias_acreditadas' => $acreditadas,
            'materias_no_acreditadas' => $noAcreditadas,
            'estatus_trayectoria' => $estatusTrayectoria,
            'estado' => 'activa',
            'metadata' => array_merge($metadataPrevio, [
                'estatus_trayectoria' => $estatusTrayectoria,
                'umbral_aprobatorio_interno' => $umbral,
                'asignaturas_total_plan' => $asignaturasTotal,
                'sincronizado_en' => now()->toIso8601String(),
            ]),
        ];

        $resultadoInterno = DB::transaction(function () use ($payload, $matricula, $actorId) {
            $model = TrayectoriaAcademica::query()->updateOrCreate(
                ['matricula_id' => $matricula->id],
                $payload,
            );
            $creada = $model->wasRecentlyCreated;

            $this->auditoria->registrar(
                'trayectoria_academica.sincronizada',
                TrayectoriaAcademica::class,
                $model->id,
                ['matricula_id' => $matricula->id],
                $actorId,
                null,
                null,
                ['servicio' => self::class],
            );

            return [
                'modelo' => $model->fresh(),
                'creada' => $creada,
            ];
        });

        return [
            'trayectoria' => $resultadoInterno['modelo'],
            'creada_trayectoria' => $resultadoInterno['creada'],
            'bloqueado' => false,
            'motivo' => null,
        ];
    }

    public function matriculaBloqueadaParaRecalculo(Matricula $matricula): bool
    {
        return DocumentoAcademico::query()
            ->where('matricula_id', $matricula->id)
            ->where(function ($q): void {
                $q->where('estado_workflow', 'aprobado')
                    ->orWhere('estado_firma', 'firmado');
            })
            ->exists();
    }

    /**
     * @return ?bool null si no hay información suficiente para clasificar (sin calificación clara ni estado texto)
     */
    protected function materiaAcreditada(MateriaCursada $m, float $umbral): ?bool
    {
        $estado = strtolower((string) ($m->estado ?? ''));

        if (in_array($estado, ['acreditada', 'aprobada', 'acreditado'], true)) {
            return true;
        }
        if (in_array($estado, ['no_acreditada', 'reprobada', 'reprobado'], true)) {
            return false;
        }

        if ($m->calificacion !== null) {
            return (float) $m->calificacion >= $umbral;
        }

        if ($m->calificacion_texto !== null && trim((string) $m->calificacion_texto) !== '') {
            return null;
        }

        return null;
    }
}
