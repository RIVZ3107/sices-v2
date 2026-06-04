<?php

declare(strict_types=1);

namespace App\Support\Importacion;

use Illuminate\Database\Connection;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use RuntimeException;

/**
 * Acceso de solo lectura a mysql_sisees_legacy (dump local). Prohibe escritura y hosts de producción.
 */
final class SiseesLegacyReadGuard
{
    private const CONNECTION = 'mysql_sisees_legacy';

    /**
     * @return Collection<int, object>
     */
    public function selectAll(string $table): Collection
    {
        $this->assertReadOnlyEnvironment();
        $this->assertTableAllowed($table);

        if (! Schema::connection(self::CONNECTION)->hasTable($table)) {
            return collect();
        }

        return $this->connection()->table($table)->get();
    }

    public function hasTable(string $table): bool
    {
        $this->assertReadOnlyEnvironment();

        return Schema::connection(self::CONNECTION)->hasTable($table);
    }

    public function countRows(string $table): int
    {
        if (! $this->hasTable($table)) {
            return 0;
        }

        return (int) $this->connection()->table($table)->count();
    }

    /**
     * @return list<string>
     */
    public function columnListing(string $table): array
    {
        if (! $this->hasTable($table)) {
            return [];
        }

        return Schema::connection(self::CONNECTION)->getColumnListing($table);
    }

    /**
     * @return list<string>
     */
    public function listTables(): array
    {
        $this->assertReadOnlyEnvironment();

        return Schema::connection(self::CONNECTION)->getTableListing();
    }

    public function connectionName(): string
    {
        return self::CONNECTION;
    }

    public function connection(): Connection
    {
        $this->assertReadOnlyEnvironment();

        return DB::connection(self::CONNECTION);
    }

    public function assertDatabaseReachable(): void
    {
        $this->assertReadOnlyEnvironment();

        try {
            $this->connection()->getPdo();
        } catch (\Throwable $e) {
            $db = (string) config('database.connections.'.self::CONNECTION.'.database', 'sisees_legacy');

            throw new RuntimeException(
                "No se pudo conectar a la BD local «{$db}». Restaure el dump de catálogos SISEES en localhost (nunca producción). Detalle: ".$e->getMessage(),
                previous: $e,
            );
        }
    }

    /**
     * Bloquea INSERT/UPDATE/DELETE en la conexión legacy (lógica de aplicación).
     */
    public function assertReadOnlyEnvironment(): void
    {
        $config = config('database.connections.'.self::CONNECTION, []);
        $host = strtolower((string) ($config['host'] ?? ''));
        $database = strtolower((string) ($config['database'] ?? ''));

        if ($database === '') {
            throw new RuntimeException('SICEES_LEGACY_DATABASE no está configurada.');
        }

        foreach (config('sisees_catalogos.blocked_databases', []) as $blockedDb) {
            if ($blockedDb !== '' && $database === strtolower((string) $blockedDb)) {
                throw new RuntimeException(
                    "La base legacy «{$database}» está bloqueada. Restaure el dump en una BD local (p. ej. sisees_legacy) y no use producción.",
                );
            }
        }

        $required = strtolower((string) config('sisees_catalogos.required_local_database', 'sisees_legacy'));
        if ($required !== '' && $database !== $required) {
            throw new RuntimeException(
                "SICEES_LEGACY_DATABASE debe ser «{$required}» (dump local). Valor actual: «{$database}».",
            );
        }

        if (! in_array($host, ['127.0.0.1', 'localhost', '::1'], true)) {
            $allowedRemote = filter_var(env('SICEES_LEGACY_ALLOW_REMOTE_HOST', false), FILTER_VALIDATE_BOOL);
            if (! $allowedRemote) {
                throw new RuntimeException(
                    "SICEES_LEGACY_HOST debe ser localhost (127.0.0.1). Host actual: «{$host}». No conectar a producción.",
                );
            }
        }

        foreach (config('sisees_catalogos.blocked_hosts', []) as $pattern) {
            $pattern = strtolower(trim((string) $pattern));
            if ($pattern !== '' && str_contains($host, $pattern)) {
                throw new RuntimeException("Host legacy bloqueado: {$host}");
            }
        }
    }

    private function assertTableAllowed(string $table): void
    {
        $lower = strtolower($table);
        foreach (config('sisees_catalogos.forbidden_table_patterns', []) as $pattern) {
            if ($pattern !== '' && str_contains($lower, strtolower((string) $pattern))) {
                throw new RuntimeException("Tabla legacy prohibida para importación de catálogos: {$table}");
            }
        }
    }
}
