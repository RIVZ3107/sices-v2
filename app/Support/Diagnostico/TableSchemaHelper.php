<?php

declare(strict_types=1);

namespace App\Support\Diagnostico;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

final class TableSchemaHelper
{
    /** @var list<string> */
    public const DEMO_PATTERNS = [
        'demo',
        'synthetic',
        'test',
        'sices.local',
        'DemoSynthetic',
        'SXCE-DEMO',
        'Ciclo demo',
        'Plan demo',
        'dataset@sices.local',
        'demo_control_escolar',
    ];

    public function exists(string $table): bool
    {
        return Schema::hasTable($table);
    }

    /**
     * @return list<string>
     */
    public function columns(string $table): array
    {
        if (! $this->exists($table)) {
            return [];
        }

        return Schema::getColumnListing($table);
    }

    public function hasColumn(string $table, string $column): bool
    {
        return $this->exists($table) && Schema::hasColumn($table, $column);
    }

    public function countAll(string $table): int
    {
        if (! $this->exists($table)) {
            return 0;
        }

        return (int) DB::table($table)->count();
    }

    public function countSoftDeleted(string $table): ?int
    {
        if (! $this->hasColumn($table, 'deleted_at')) {
            return null;
        }

        return (int) DB::table($table)->whereNotNull('deleted_at')->count();
    }

    /**
     * @return list<string>
     */
    public function primaryKeys(string $table): array
    {
        if (! $this->exists($table)) {
            return [];
        }

        try {
            $db = DB::getDatabaseName();
            $rows = DB::select(
                'SELECT COLUMN_NAME AS col FROM information_schema.KEY_COLUMN_USAGE
                 WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND CONSTRAINT_NAME = ?',
                [$db, $table, 'PRIMARY'],
            );

            return array_values(array_map(static fn ($r) => (string) $r->col, $rows));
        } catch (\Throwable) {
            return $this->hasColumn($table, 'id') ? ['id'] : [];
        }
    }

    /**
     * @return list<array{column: string, references_table: string, references_column: string}>
     */
    public function foreignKeys(string $table): array
    {
        if (! $this->exists($table)) {
            return [];
        }

        try {
            $db = DB::getDatabaseName();
            $rows = DB::select(
                'SELECT COLUMN_NAME AS col, REFERENCED_TABLE_NAME AS ref_table, REFERENCED_COLUMN_NAME AS ref_col
                 FROM information_schema.KEY_COLUMN_USAGE
                 WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ? AND REFERENCED_TABLE_NAME IS NOT NULL',
                [$db, $table],
            );

            return array_map(static fn ($r) => [
                'column' => (string) $r->col,
                'references_table' => (string) $r->ref_table,
                'references_column' => (string) $r->ref_col,
            ], $rows);
        } catch (\Throwable) {
            return [];
        }
    }

    public function approximateSizeBytes(string $table): ?int
    {
        if (! $this->exists($table)) {
            return null;
        }

        try {
            $db = DB::getDatabaseName();
            $row = DB::selectOne(
                'SELECT (DATA_LENGTH + INDEX_LENGTH) AS size_bytes
                 FROM information_schema.TABLES
                 WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?',
                [$db, $table],
            );

            return isset($row->size_bytes) ? (int) $row->size_bytes : null;
        } catch (\Throwable) {
            return null;
        }
    }

    /**
     * @param  list<string>  $preferred
     * @return list<string>
     */
    public function resolveSelectColumns(string $table, array $preferred = []): array
    {
        $cols = $this->columns($table);
        if ($cols === []) {
            return [];
        }

        if ($preferred !== []) {
            $picked = array_values(array_intersect($preferred, $cols));
            if ($picked !== []) {
                return $picked;
            }
        }

        return array_slice($cols, 0, min(12, count($cols)));
    }

    /**
     * @return list<object>
     */
    public function lastRows(string $table, int $limit = 5, array $preferred = []): array
    {
        if (! $this->exists($table) || $this->countAll($table) === 0) {
            return [];
        }

        $select = $this->resolveSelectColumns($table, $preferred);
        $query = DB::table($table)->select($select);

        if ($this->hasColumn($table, 'id')) {
            $query->orderByDesc('id');
        } elseif ($this->hasColumn($table, 'created_at')) {
            $query->orderByDesc('created_at');
        }

        return $query->limit($limit)->get()->all();
    }

    /**
     * @return array{column: string, nulls: int}|null
     */
    public function countNullsForColumn(string $table, string $column): ?array
    {
        if (! $this->hasColumn($table, $column)) {
            return null;
        }

        return [
            'column' => $column,
            'nulls' => (int) DB::table($table)->whereNull($column)->count(),
        ];
    }

    public function countDemoLikeRows(string $table): int
    {
        if (! $this->exists($table)) {
            return 0;
        }

        $cols = $this->columns($table);
        $query = DB::table($table)->where(function ($q) use ($table, $cols): void {
            $added = false;
            foreach ($cols as $col) {
                if (in_array($col, ['id', 'created_at', 'updated_at', 'deleted_at', 'password', 'remember_token'], true)) {
                    continue;
                }
                if ($col === 'email') {
                    $q->orWhere($col, 'like', '%@sices.local');
                    $q->orWhere($col, 'like', '%.dataset@sices.local');
                    $added = true;
                }
                if ($col === 'nombre') {
                    $q->orWhere($col, 'DemoSynthetic');
                    $q->orWhere($col, 'like', '%demo%');
                    $added = true;
                }
                if (in_array($col, ['clave', 'matricula', 'route', 'label', 'name'], true)) {
                    $q->orWhere($col, 'like', '%SXCE-DEMO%');
                    $q->orWhere($col, 'like', '%demo%');
                    $q->orWhere($col, 'like', '%synthetic%');
                    $added = true;
                }
                if ($col === 'metadata') {
                    $q->orWhere('metadata->origen', 'demo_control_escolar');
                    $q->orWhere('metadata->demo_dataset', 'control_escolar_v1');
                    $added = true;
                }
            }
            if (! $added) {
                $q->whereRaw('1 = 0');
            }
        });

        return (int) $query->count();
    }

    /**
     * @param  list<object>  $rows
     * @return list<string>
     */
    public function detectDemoFieldsInRows(array $rows): array
    {
        $hits = [];
        foreach ($rows as $row) {
            foreach ((array) $row as $key => $value) {
                if ($value === null) {
                    continue;
                }
                $text = is_array($value) ? json_encode($value) : (string) $value;
                foreach (self::DEMO_PATTERNS as $pattern) {
                    if (stripos($text, $pattern) !== false) {
                        $hits[] = "{$key}:{$pattern}";
                    }
                }
            }
        }

        return array_values(array_unique($hits));
    }
}
