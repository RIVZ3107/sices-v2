<?php

declare(strict_types=1);

namespace App\Support\Certificacion;

use App\Models\InscripcionPeriodo;
use App\Models\MateriaCursada;
use App\Models\PlanMateria;

/**
 * Reglas DEC Normal (sin “magia”):
 *
 * - Con `tipo_periodo_curricular = semestre`, el número de semestre académico institucional
 *   es la fuente de verdad (`numero_periodo_curricular`); se iguala la columna `semestre` de BD
 *   a ese valor para expedición/certificación. La etiqueta es solo auxiliar/display, no sustituye
 *   el número ante la SEP/DEC (no parseamos texto libre como entero DEC).
 *
 * - Con otros tipos (cuatrimestre, módulo, etc.) **no** se deriva ni pisa automáticamente `semestre`
 *   desde `numero_periodo_curricular`. El campo `semestre` debe definirla la institución explícitamente
 *   como **mapeo DEC** cuando el XML lo exija.
 *
 * - Si no existe mapeo claro DEC, los métodos de resolución devuelven `null` para que las capas
 *   siguientes fallen de forma visible (captura/importación/generación snapshot), en lugar de inventar “1”.
 */
final class PeriodoCurricularDecMapper
{
    public static function normalizarTipo(?string $tipo): string
    {
        $t = strtolower(trim((string) $tipo));

        return $t === '' ? 'semestre' : $t;
    }

    public static function aplicarDefaultsPlanMateria(PlanMateria $pm): void
    {
        $tipo = self::normalizarTipo($pm->tipo_periodo_curricular);
        $pm->tipo_periodo_curricular = $tipo;

        if ($tipo === 'semestre') {
            if (($pm->numero_periodo_curricular === null || $pm->numero_periodo_curricular === 0)
                && $pm->semestre !== null && (int) $pm->semestre > 0
            ) {
                $pm->numero_periodo_curricular = (int) $pm->semestre;
            }

            if ($pm->numero_periodo_curricular !== null && (int) $pm->numero_periodo_curricular > 0) {
                $pm->semestre = (int) $pm->numero_periodo_curricular;
            }
        }

        /** tipos ≠ semestre: no mover `semestre` institucional (DEC explícito) desde el número curricular */
    }

    public static function aplicarDefaultsInscripcion(InscripcionPeriodo $ins): void
    {
        $tipo = self::normalizarTipo($ins->tipo_periodo_curricular);
        $ins->tipo_periodo_curricular = $tipo;

        if ($tipo === 'semestre') {
            if (($ins->numero_periodo_curricular === null || $ins->numero_periodo_curricular === 0)
                && $ins->semestre !== null && (int) $ins->semestre > 0
            ) {
                $ins->numero_periodo_curricular = (int) $ins->semestre;
            }

            if ($ins->numero_periodo_curricular !== null && (int) $ins->numero_periodo_curricular > 0) {
                $ins->semestre = (int) $ins->numero_periodo_curricular;
            }
        }
    }

    /**
     * Valor DEC (atributo `semestre` en XML DEC Normal) sólo cuando el catálogo del plan define mapeo claro.
     */
    public static function semestreDecDesdePlanMateria(?PlanMateria $planMateria): ?int
    {
        if ($planMateria === null) {
            return null;
        }

        self::aplicarDefaultsPlanMateria($planMateria);
        $tipo = self::normalizarTipo($planMateria->tipo_periodo_curricular);

        if ($tipo === 'semestre') {
            $n = $planMateria->numero_periodo_curricular ?? $planMateria->semestre;

            return $n !== null && (int) $n > 0 ? (int) $n : null;
        }

        if ($planMateria->semestre !== null && (int) $planMateria->semestre > 0) {
            return (int) $planMateria->semestre;
        }

        return null;
    }

    /** Prioriza el `semestre` ya persistido en la materia cursada (DEC acordado al capturarse). */
    public static function semestreDecParaMateriaCursada(MateriaCursada $m): ?int
    {
        if ($m->semestre !== null && (int) $m->semestre > 0) {
            return (int) $m->semestre;
        }

        $m->loadMissing('planMateria');

        return $m->planMateria instanceof PlanMateria
            ? self::semestreDecDesdePlanMateria($m->planMateria)
            : null;
    }

    /** Clave estable para igualar una fila de importación con `plan_materias`. */
    public static function claveNaturalPeriodo(string $tipo, int $numero): string
    {
        return strtolower($tipo).'|'.$numero;
    }
}
