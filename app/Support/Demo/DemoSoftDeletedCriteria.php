<?php

declare(strict_types=1);

namespace App\Support\Demo;

use Illuminate\Database\Query\Builder;

/**
 * Criterios estrictos para purga física: deleted_at NOT NULL + patrón demo.
 */
final class DemoSoftDeletedCriteria
{
    /**
     * @param  list<string>  $clavesExactas
     */
    public static function apply(Builder $query, string $table, array $clavesExactas = [], bool $incluirEmailSicesLocal = false): void
    {
        $query->whereNotNull('deleted_at');
        DemoPatternQuery::apply($query, $table, $clavesExactas, $incluirEmailSicesLocal);
    }

    public static function hasSoftDeletes(string $table): bool
    {
        return DemoPatternQuery::hasSoftDeletes($table);
    }
}
