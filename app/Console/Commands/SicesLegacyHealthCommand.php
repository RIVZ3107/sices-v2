<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Contracts\SicesLegacy\SicesLegacyCertificadoRepositoryInterface;
use Illuminate\Console\Command;

/**
 * Prueba real de conexión Informix (solo uso manual / CI con credenciales).
 * No ejecutar en phpunit.
 */
class SicesLegacyHealthCommand extends Command
{
    protected $signature = 'sices-legacy:health
                            {--json : Salida JSON en lugar de texto}';

    protected $description = 'Verifica configuración y conectividad read-only contra Informix (SICES legacy).';

    public function handle(SicesLegacyCertificadoRepositoryInterface $repository): int
    {
        if (app()->environment('testing')) {
            $this->error('Este comando no debe ejecutarse en entorno testing. Use la API o tests con repositorio en memoria.');

            return self::FAILURE;
        }

        $health = $repository->health();

        if ($this->option('json')) {
            $this->line(json_encode($health, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

            return ($health['reachable'] ?? false) ? self::SUCCESS : self::FAILURE;
        }

        $this->info('SICES Legacy — health check');
        $this->table(
            ['Clave', 'Valor'],
            collect($health)->map(fn ($v, $k) => [$k, is_scalar($v) ? (string) $v : json_encode($v)])->values()->all(),
        );

        if (! ($health['enabled'] ?? false)) {
            $this->warn('Módulo deshabilitado (SICES_LEGACY_ENABLED=false).');

            return self::SUCCESS;
        }

        if ($health['reachable'] ?? false) {
            $this->info('Conexión Informix alcanzable (solo lectura).');

            return self::SUCCESS;
        }

        $this->error($health['message'] ?? 'No se pudo validar la conexión Informix.');

        return self::FAILURE;
    }
}
