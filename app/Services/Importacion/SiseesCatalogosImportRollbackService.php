<?php

declare(strict_types=1);

namespace App\Services\Importacion;

use App\Models\Institucion;
use App\Models\Materia;
use App\Models\OfertaAcademica;
use App\Models\PlanEstudio;
use App\Models\PlanMateria;
use App\Models\ProgramaEstudio;
use App\Models\Sede;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use RuntimeException;

final class SiseesCatalogosImportRollbackService
{
    private const ORIGEN = 'import_sisees_legacy';

    /**
     * @return array<string, mixed>
     */
    public function ejecutar(bool $confirmarBorrado): array
    {
        $conteos = $this->contarRegistrosCreadosPorImport();

        $reporte = [
            'modo' => 'rollback-importacion',
            'generado_en' => now()->toIso8601String(),
            'origen_filtro' => self::ORIGEN,
            'conteos_a_eliminar' => $conteos,
            'conteos_actualizados_sin_borrar' => $this->contarRegistrosSoloActualizados(),
            'eliminados' => [],
            'transaccion' => ['estado' => 'simulado'],
        ];

        if (! $confirmarBorrado) {
            $reporte['mensaje'] = 'Dry-run rollback: no se eliminó nada. Use --rollback-importacion --confirm para borrar solo registros creados por la importación.';

            return $reporte;
        }

        $total = array_sum($conteos);
        if ($total === 0) {
            $reporte['transaccion']['estado'] = 'sin_cambios';
            $reporte['mensaje'] = 'No hay registros creados por import_sisees_legacy para eliminar.';

            return $reporte;
        }

        DB::transaction(function () use (&$reporte, $conteos): void {
            $orden = [
                'plan_materias' => fn () => $this->eliminarCreados(PlanMateria::class),
                'ofertas_academicas' => fn () => $this->eliminarCreados(OfertaAcademica::class),
                'materias' => fn () => $this->eliminarCreados(Materia::class),
                'planes_estudio' => fn () => $this->eliminarCreados(PlanEstudio::class),
                'programas_estudio' => fn () => $this->eliminarCreados(ProgramaEstudio::class),
                'sedes' => fn () => $this->eliminarCreados(Sede::class),
                'instituciones' => fn () => $this->eliminarCreados(Institucion::class),
            ];

            foreach ($orden as $entidad => $fn) {
                $reporte['eliminados'][$entidad] = $fn();
            }

            $reporte['transaccion']['estado'] = 'rollback_completado';
        });

        $reporte['mensaje'] = 'Rollback completado: solo registros con metadata.import_creado_en_import=true y origen import_sisees_legacy.';

        return $reporte;
    }

    /**
     * @return array<string, int>
     */
    public function contarRegistrosCreadosPorImport(): array
    {
        return [
            'plan_materias' => $this->contarCreados(PlanMateria::class),
            'ofertas_academicas' => $this->contarCreados(OfertaAcademica::class),
            'materias' => $this->contarCreados(Materia::class),
            'planes_estudio' => $this->contarCreados(PlanEstudio::class),
            'programas_estudio' => $this->contarCreados(ProgramaEstudio::class),
            'sedes' => $this->contarCreados(Sede::class),
            'instituciones' => $this->contarCreados(Institucion::class),
        ];
    }

    /**
     * @return array<string, int>
     */
    private function contarRegistrosSoloActualizados(): array
    {
        return [
            'plan_materias' => $this->contarSoloActualizados(PlanMateria::class),
            'ofertas_academicas' => $this->contarSoloActualizados(OfertaAcademica::class),
            'materias' => $this->contarSoloActualizados(Materia::class),
            'planes_estudio' => $this->contarSoloActualizados(PlanEstudio::class),
            'programas_estudio' => $this->contarSoloActualizados(ProgramaEstudio::class),
            'sedes' => $this->contarSoloActualizados(Sede::class),
            'instituciones' => $this->contarSoloActualizados(Institucion::class),
        ];
    }

    /**
     * @param  class-string<Model>  $modelClass
     */
    private function contarCreados(string $modelClass): int
    {
        return $this->queryImportCreados($modelClass)->count();
    }

    /**
     * @param  class-string<Model>  $modelClass
     */
    private function contarSoloActualizados(string $modelClass): int
    {
        return $modelClass::query()
            ->where('metadata->origen', self::ORIGEN)
            ->where(function ($q): void {
                $q->whereNull('metadata->import_creado_en_import')
                    ->orWhere('metadata->import_creado_en_import', false);
            })
            ->count();
    }

    /**
     * @param  class-string<Model>  $modelClass
     */
    private function eliminarCreados(string $modelClass): int
    {
        return $this->queryImportCreados($modelClass)->delete();
    }

    /**
     * @param  class-string<Model>  $modelClass
     */
    private function queryImportCreados(string $modelClass)
    {
        return $modelClass::query()
            ->where('metadata->origen', self::ORIGEN)
            ->where('metadata->import_creado_en_import', true);
    }
}
