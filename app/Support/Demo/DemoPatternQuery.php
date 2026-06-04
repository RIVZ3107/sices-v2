<?php

declare(strict_types=1);

namespace App\Support\Demo;

use App\Services\ControlEscolar\ResetDemoControlEscolarService;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\Schema;

/**
 * Patrones demo compartidos (activo, soft-deleted y purgable).
 */
final class DemoPatternQuery
{
    /**
     * @param  list<string>  $clavesExactas
     */
    public static function apply(Builder $query, string $table, array $clavesExactas = [], bool $incluirEmailSicesLocal = false): void
    {
        $query->where(function (Builder $q) use ($table, $clavesExactas, $incluirEmailSicesLocal): void {
            $matched = false;

            if ($clavesExactas !== [] && Schema::hasColumn($table, 'clave')) {
                $q->orWhereIn('clave', $clavesExactas);
                $matched = true;
            }

            if (Schema::hasColumn($table, 'clave')) {
                $q->orWhere('clave', 'like', '%DEMO%');
                $q->orWhere('clave', 'like', 'SXCE-DEMO%');
                $matched = true;
            }

            if (Schema::hasColumn($table, 'nombre')) {
                $q->orWhere('nombre', 'DemoSynthetic');
                $q->orWhere('nombre', 'like', '%(demo)%');
                $q->orWhereRaw('LOWER(nombre) LIKE ?', ['%plan demo%']);
                $q->orWhereRaw('LOWER(nombre) LIKE ?', ['%ciclo demo%']);
                DemoHeuristicCriteria::orWhereNombreDemoTokenOnEloquent($q);
                $matched = true;
            }

            if (Schema::hasColumn($table, 'metadata')) {
                $q->orWhere('metadata->origen', ResetDemoControlEscolarService::ORIGEN);
                $q->orWhere('metadata->demo_dataset', ResetDemoControlEscolarService::DATASET);
                DemoHeuristicCriteria::orWhereMetadataContainsOnEloquent($q, 'synthetic');
                DemoHeuristicCriteria::orWhereMetadataContainsOnEloquent($q, 'demo_control_escolar');
                DemoHeuristicCriteria::orWhereMetadataContainsOnEloquent($q, strtolower(ResetDemoControlEscolarService::DATASET));
                DemoHeuristicCriteria::orWhereMetadataContainsOnEloquent($q, 'control_escolar_v1');
                $matched = true;
            }

            if ($incluirEmailSicesLocal && Schema::hasColumn($table, 'email')) {
                $q->orWhere('email', 'like', '%@sices.local');
                $q->orWhere('email', 'like', '%.dataset@sices.local');
                $matched = true;
            }

            if (! $matched) {
                $q->whereRaw('1 = 0');
            }
        });

        DemoHeuristicCriteria::whereNotRealSiseesImport($query, $table);
    }

    public static function hasTable(string $table): bool
    {
        return Schema::hasTable($table);
    }

    public static function hasSoftDeletes(string $table): bool
    {
        return self::hasTable($table) && Schema::hasColumn($table, 'deleted_at');
    }

    /**
     * Búsqueda LIKE en columna metadata (sintaxis MySQL: CHAR, no TEXT).
     */
    private static function orWhereMetadataContains(Builder $q, string $needle): void
    {
        DemoHeuristicCriteria::orWhereMetadataContainsOnEloquent($q, $needle);
    }
}
