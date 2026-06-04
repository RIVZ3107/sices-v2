<?php

declare(strict_types=1);

namespace App\Services\Demo;

use App\Services\ControlEscolar\ResetDemoControlEscolarService;
use App\Support\Demo\DemoPatternQuery;
use App\Support\Demo\DemoSoftDeletedCriteria;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Clasifica registros demo: activos, soft-deleted y purgables.
 */
final class DemoDataCatalogClassifier
{
    /** @var list<array{tabla: string, claves?: list<string>, email?: bool}> */
    public const TABLAS = [
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
        ['tabla' => 'users', 'email' => true],
    ];

    public function __construct(
        private readonly DemoSoftDeletedPurgeService $purge = new DemoSoftDeletedPurgeService,
    ) {}

    /**
     * @return array{
     *     demo_activo: array<string, int>,
     *     demo_soft_deleted: array<string, int>,
     *     demo_purgable: array<string, int>,
     *     catalogos_activos_reales: array<string, int>,
     *     totales: array{activo: int, soft_deleted: int, purgable: int}
     * }
     */
    public function clasificar(bool $incluirUsuariosDemo = false): array
    {
        $activo = [];
        $soft = [];
        $purgable = [];

        foreach (self::TABLAS as $cfg) {
            $tabla = $cfg['tabla'];
            if ($tabla === 'users' && ! $incluirUsuariosDemo) {
                continue;
            }
            if (! DemoPatternQuery::hasTable($tabla)) {
                continue;
            }

            $claves = $cfg['claves'] ?? [];
            $email = $cfg['email'] ?? false;

            $activo[$tabla] = $this->countActivo($tabla, $claves, $email);
            $soft[$tabla] = $this->purge->countPurgableForTable($tabla, $claves, $email);
            $purgable[$tabla] = $soft[$tabla];
        }

        $catalogosReales = [
            'ciclos_escolares' => $this->countActivosNoDemo('ciclos_escolares'),
            'programas_estudio' => $this->countActivosNoDemo('programas_estudio'),
            'planes_estudio' => $this->countActivosNoDemo('planes_estudio'),
            'ofertas_academicas' => $this->countActivosNoDemo('ofertas_academicas'),
            'instituciones' => DemoPatternQuery::hasTable('instituciones') ? (int) DB::table('instituciones')->when(
                DemoPatternQuery::hasSoftDeletes('instituciones'),
                static fn ($q) => $q->whereNull('deleted_at'),
            )->count() : 0,
            'sedes' => DemoPatternQuery::hasTable('sedes') ? (int) DB::table('sedes')->when(
                DemoPatternQuery::hasSoftDeletes('sedes'),
                static fn ($q) => $q->whereNull('deleted_at'),
            )->count() : 0,
        ];

        return [
            'demo_activo' => $activo,
            'demo_soft_deleted' => $soft,
            'demo_purgable' => $purgable,
            'catalogos_activos_reales' => $catalogosReales,
            'totales' => [
                'activo' => array_sum($activo),
                'soft_deleted' => array_sum($soft),
                'purgable' => array_sum($purgable),
            ],
        ];
    }

    /**
     * @param  list<string>  $clavesExactas
     */
    private function countActivo(string $table, array $clavesExactas, bool $incluirEmail): int
    {
        if (! DemoPatternQuery::hasTable($table)) {
            return 0;
        }

        $q = DB::table($table);
        if (DemoPatternQuery::hasSoftDeletes($table)) {
            $q->whereNull('deleted_at');
        }
        DemoPatternQuery::apply($q, $table, $clavesExactas, $incluirEmail);

        return (int) $q->count();
    }

    private function countActivosNoDemo(string $table): int
    {
        if (! DemoPatternQuery::hasTable($table)) {
            return 0;
        }

        $q = DB::table($table);
        if (DemoPatternQuery::hasSoftDeletes($table)) {
            $q->whereNull('deleted_at');
        }

        if (Schema::hasColumn($table, 'clave')) {
            $q->where(function ($sub): void {
                $sub->whereNull('clave')
                    ->orWhere(function ($inner): void {
                        $inner->where('clave', 'not like', '%DEMO%')
                            ->where('clave', 'not like', 'SXCE-DEMO%');
                    });
            });
        }

        if (Schema::hasColumn($table, 'metadata')) {
            $q->where(function ($sub): void {
                $sub->whereNull('metadata')
                    ->orWhere('metadata->origen', '!=', ResetDemoControlEscolarService::ORIGEN);
            });
        }

        return (int) $q->count();
    }
}
