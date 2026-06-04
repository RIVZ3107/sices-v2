<?php

declare(strict_types=1);

namespace App\Services\Demo;

use App\Services\ControlEscolar\ResetDemoControlEscolarService;
use App\Support\Demo\DemoPatternQuery;
use App\Support\Demo\DemoSoftDeletedCriteria;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

final class DemoSoftDeletedPurgeService
{
    /** @var list<array{tabla: string, claves?: list<string>, email?: bool}> */
    private const ORDEN_PURGA = [
        ['tabla' => 'documento_observaciones'],
        ['tabla' => 'documento_estados_historial'],
        ['tabla' => 'documento_materias_snapshot'],
        ['tabla' => 'documentos_academicos'],
        ['tabla' => 'trayectorias_academicas'],
        ['tabla' => 'materias_cursadas'],
        ['tabla' => 'cargas_academicas'],
        ['tabla' => 'inscripciones_periodo'],
        ['tabla' => 'matriculas'],
        ['tabla' => 'alumnos'],
        ['tabla' => 'plan_materias'],
        ['tabla' => 'materias'],
        ['tabla' => 'ofertas_academicas'],
        ['tabla' => 'planes_estudio', 'claves' => ResetDemoControlEscolarService::PLANES_DEMO_CLAVES],
        ['tabla' => 'programas_estudio', 'claves' => ResetDemoControlEscolarService::PROGRAMAS_DEMO_CLAVES],
        ['tabla' => 'ciclos_escolares', 'claves' => ResetDemoControlEscolarService::CICLOS_DEMO_CLAVES],
    ];

    /**
     * @return array<string, int>
     */
    public function plan(bool $incluirUsuariosDemo): array
    {
        return $this->conteosPorTabla($incluirUsuariosDemo);
    }

    /**
     * @return array{antes: array<string, int>, eliminados: array<string, int>, despues: array<string, int>}
     */
    public function ejecutar(bool $incluirUsuariosDemo): array
    {
        $antes = $this->plan($incluirUsuariosDemo);

        DB::transaction(function () use ($incluirUsuariosDemo): void {
            foreach ($this->tablasPurge($incluirUsuariosDemo) as $cfg) {
                $this->purgeTable($cfg['tabla'], $cfg['claves'] ?? [], $cfg['email'] ?? false);
            }
        });

        $despues = $this->plan($incluirUsuariosDemo);
        $eliminados = [];
        foreach ($antes as $tabla => $total) {
            $eliminados[$tabla] = max(0, $total - ($despues[$tabla] ?? 0));
        }

        return [
            'antes' => $antes,
            'eliminados' => $eliminados,
            'despues' => $despues,
        ];
    }

    /**
     * @param  list<string>  $clavesExactas
     */
    public function countPurgableForTable(string $table, array $clavesExactas = [], bool $incluirEmail = false): int
    {
        if (! DemoSoftDeletedCriteria::hasSoftDeletes($table)) {
            return 0;
        }

        return (int) $this->baseQuery($table, $clavesExactas, $incluirEmail)->count();
    }

    /**
     * @return array<string, int>
     */
    private function conteosPorTabla(bool $incluirUsuariosDemo): array
    {
        $conteos = [];
        foreach ($this->tablasPurge($incluirUsuariosDemo) as $cfg) {
            $tabla = $cfg['tabla'];
            if (! DemoPatternQuery::hasTable($tabla)) {
                $conteos[$tabla] = 0;

                continue;
            }
            $conteos[$tabla] = $this->countPurgableForTable($tabla, $cfg['claves'] ?? [], $cfg['email'] ?? false);
        }

        return $conteos;
    }

    /**
     * @return list<array{tabla: string, claves?: list<string>, email?: bool}>
     */
    private function tablasPurge(bool $incluirUsuariosDemo): array
    {
        $tablas = self::ORDEN_PURGA;
        if ($incluirUsuariosDemo && DemoSoftDeletedCriteria::hasSoftDeletes('users')) {
            $tablas[] = ['tabla' => 'users', 'email' => true];
        }

        return $tablas;
    }

    /**
     * @param  list<string>  $clavesExactas
     */
    private function purgeTable(string $table, array $clavesExactas, bool $incluirEmail): void
    {
        if (! DemoSoftDeletedCriteria::hasSoftDeletes($table)) {
            return;
        }

        $this->baseQuery($table, $clavesExactas, $incluirEmail)->delete();
    }

    /**
     * @param  list<string>  $clavesExactas
     */
    private function baseQuery(string $table, array $clavesExactas, bool $incluirEmail): \Illuminate\Database\Query\Builder
    {
        return match ($table) {
            'plan_materias' => $this->queryPlanMateriasTrashedDemo(),
            'documento_observaciones' => $this->queryPorDocumentoDemoTrashed('documento_observaciones'),
            'documento_estados_historial' => $this->queryPorDocumentoDemoTrashed('documento_estados_historial'),
            'documento_materias_snapshot' => $this->queryPorDocumentoDemoTrashed('documento_materias_snapshot'),
            default => tap(DB::table($table), static function (\Illuminate\Database\Query\Builder $q) use ($table, $clavesExactas, $incluirEmail): void {
                DemoSoftDeletedCriteria::apply($q, $table, $clavesExactas, $incluirEmail);
            }),
        };
    }

    private function queryPlanMateriasTrashedDemo(): \Illuminate\Database\Query\Builder
    {
        $query = DB::table('plan_materias')->whereNotNull('deleted_at');
        $demoPlanIds = $this->idsPlanesTrashedDemo();

        $query->where(function (\Illuminate\Database\Query\Builder $q) use ($demoPlanIds): void {
            $matched = false;
            if ($demoPlanIds !== []) {
                $q->orWhereIn('plan_estudio_id', $demoPlanIds);
                $matched = true;
            }
            if (Schema::hasColumn('plan_materias', 'metadata')) {
                DemoPatternQuery::apply($q, 'plan_materias');
                $matched = true;
            }
            if (! $matched) {
                $q->whereRaw('1 = 0');
            }
        });

        return $query;
    }

    private function queryPorDocumentoDemoTrashed(string $table): \Illuminate\Database\Query\Builder
    {
        $query = DB::table($table)->whereNotNull('deleted_at');
        if (! Schema::hasColumn($table, 'documento_academico_id')) {
            return $query->whereRaw('1 = 0');
        }

        $docIds = $this->idsDocumentosTrashedDemo();

        $query->where(function (\Illuminate\Database\Query\Builder $q) use ($docIds, $table): void {
            $matched = false;
            if ($docIds !== []) {
                $q->orWhereIn('documento_academico_id', $docIds);
                $matched = true;
            }
            if (Schema::hasColumn($table, 'metadata')) {
                $q->where(function (\Illuminate\Database\Query\Builder $inner) use ($table): void {
                    $inner->whereNotNull('deleted_at');
                    DemoPatternQuery::apply($inner, $table);
                });
                $matched = true;
            }
            if (! $matched) {
                $q->whereRaw('1 = 0');
            }
        });

        return $query;
    }

    /**
     * @return list<int>
     */
    private function idsPlanesTrashedDemo(): array
    {
        if (! DemoSoftDeletedCriteria::hasSoftDeletes('planes_estudio')) {
            return [];
        }

        $q = DB::table('planes_estudio');
        DemoSoftDeletedCriteria::apply($q, 'planes_estudio', ResetDemoControlEscolarService::PLANES_DEMO_CLAVES);

        return $q->pluck('id')->map(static fn ($id) => (int) $id)->all();
    }

    /**
     * @return list<int>
     */
    private function idsDocumentosTrashedDemo(): array
    {
        if (! DemoSoftDeletedCriteria::hasSoftDeletes('documentos_academicos')) {
            return [];
        }

        $q = DB::table('documentos_academicos');
        DemoSoftDeletedCriteria::apply($q, 'documentos_academicos');

        return $q->pluck('id')->map(static fn ($id) => (int) $id)->all();
    }

    public function totalCandidatos(bool $incluirUsuariosDemo): int
    {
        return array_sum($this->plan($incluirUsuariosDemo));
    }
}
