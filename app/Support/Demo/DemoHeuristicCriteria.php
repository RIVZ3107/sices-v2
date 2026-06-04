<?php

declare(strict_types=1);

namespace App\Support\Demo;

use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\Schema;

/**
 * Heurística demo para diagnóstico: evita falsos positivos (democracia, import SISEES).
 */
final class DemoHeuristicCriteria
{
    public const ORIGEN_IMPORT_SISEES = 'import_sisees_legacy';

    /** @var list<string> */
    private const EXCLUDED_NOMBRE_FRAGMENTS = [
        'democracia',
        'democratico',
        'democrático',
        'democratica',
        'democrática',
    ];

    /**
     * Excluye filas importadas desde SISEES legacy (metadata.origen u origin).
     */
    public static function whereNotRealSiseesImport(Builder $query, string $table): void
    {
        if (! Schema::hasColumn($table, 'metadata')) {
            return;
        }

        $query->where(function (Builder $q): void {
            $q->whereNull('metadata')
                ->orWhere(function (Builder $m): void {
                    $m->where(function (Builder $o): void {
                        $o->whereNull('metadata->origen')
                            ->orWhere('metadata->origen', '!=', self::ORIGEN_IMPORT_SISEES);
                    })->where(function (Builder $o): void {
                        $o->whereNull('metadata->origin')
                            ->orWhere('metadata->origin', '!=', self::ORIGEN_IMPORT_SISEES);
                    });
                });
        });
    }

    /**
     * Patrones demo reales (sin substring "demo" en democracia).
     */
    public static function applyDemoPatterns(Builder $query, string $table): void
    {
        $query->where(function (Builder $q) use ($table): void {
            $added = false;

            if (Schema::hasColumn($table, 'email')) {
                $q->orWhere('email', 'like', '%@sices.local');
                $q->orWhere('email', 'like', '%.dataset@sices.local');
                $added = true;
            }

            if (Schema::hasColumn($table, 'nombre')) {
                $q->orWhere('nombre', 'DemoSynthetic');
                $q->orWhere('nombre', 'like', '%(demo)%');
                $q->orWhereRaw('LOWER(nombre) LIKE ?', ['%plan demo%']);
                $q->orWhereRaw('LOWER(nombre) LIKE ?', ['%ciclo demo%']);
                self::orWhereNombreContainsDemoToken($q);
                $added = true;
            }

            foreach (['clave', 'matricula', 'route', 'label', 'name'] as $col) {
                if (! Schema::hasColumn($table, $col)) {
                    continue;
                }
                $q->orWhere($col, 'like', 'SXCE-DEMO%');
                $q->orWhere($col, 'like', '%DEMO%');
                $q->orWhereRaw('LOWER(`'.$col.'`) LIKE ?', ['%synthetic%']);
                $added = true;
            }

            if (Schema::hasColumn($table, 'metadata')) {
                $q->orWhere('metadata->origen', 'demo_control_escolar');
                $q->orWhere('metadata->demo_dataset', 'control_escolar_v1');
                $q->orWhere('metadata->demo_dataset', 'demo_dataset');
                self::orWhereMetadataContains($q, 'demo_control_escolar');
                self::orWhereMetadataContains($q, 'synthetic');
                self::orWhereMetadataContains($q, 'demo_dataset');
                $added = true;
            }

            if (! $added) {
                $q->whereRaw('1 = 0');
            }
        });
    }

    /**
     * "demo" como token; excluye democracia/democrático/democrática.
     */
    private static function orWhereNombreContainsDemoToken(Builder $q): void
    {
        $sql = '(LOWER(nombre) LIKE ?';
        $bindings = ['%demo%'];
        foreach (self::EXCLUDED_NOMBRE_FRAGMENTS as $frag) {
            $sql .= ' AND LOWER(nombre) NOT LIKE ?';
            $bindings[] = '%'.strtolower($frag).'%';
        }
        $sql .= ')';
        $q->orWhereRaw($sql, $bindings);
    }

    private static function orWhereMetadataContains(Builder $q, string $needle): void
    {
        $q->orWhereRaw('LOWER(COALESCE(CAST(metadata AS CHAR), \'\')) LIKE ?', ['%'.strtolower($needle).'%']);
    }

    public static function orWhereNombreDemoTokenOnEloquent(Builder $q): void
    {
        self::orWhereNombreContainsDemoToken($q);
    }

    public static function orWhereMetadataContainsOnEloquent(Builder $q, string $needle): void
    {
        self::orWhereMetadataContains($q, $needle);
    }
}
