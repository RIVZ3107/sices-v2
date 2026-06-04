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
                $q->orWhereRaw('LOWER(nombre) LIKE ?', ['%demo%']);
                if ($table === 'alumnos') {
                    $q->orWhere('nombre', 'DemoSynthetic');
                }
                $matched = true;
            }

            if (Schema::hasColumn($table, 'metadata')) {
                $q->orWhere('metadata->origen', ResetDemoControlEscolarService::ORIGEN);
                $q->orWhere('metadata->demo_dataset', ResetDemoControlEscolarService::DATASET);
                $meta = strtolower(ResetDemoControlEscolarService::DATASET);
                self::orWhereMetadataContains($q, 'synthetic');
                self::orWhereMetadataContains($q, 'demo_control_escolar');
                self::orWhereMetadataContains($q, $meta);
                self::orWhereMetadataContains($q, 'control_escolar_v1');
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
        $q->orWhereRaw('LOWER(COALESCE(CAST(metadata AS CHAR), \'\')) LIKE ?', ['%'.$needle.'%']);
    }
}
