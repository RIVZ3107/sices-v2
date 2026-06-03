<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\Demo\DemoDataCleanupService;
use Illuminate\Console\Command;

final class LimpiarDemoCommand extends Command
{
    protected $signature = 'sices:limpiar-demo
                            {--dry-run : Mostrar qué se borraría sin eliminar registros}
                            {--confirm : Ejecutar borrado de registros claramente demo}
                            {--usuarios-demo : Incluir usuarios con email @sices.local}
                            {--force-local : Permitir ejecución en production (no recomendado)}';

    protected $description = 'Limpieza segura de datos demo/sintéticos. Sin --confirm no borra nada.';

    public function handle(DemoDataCleanupService $cleanup): int
    {
        if ($this->laravel->environment('production') && ! $this->option('force-local')) {
            $this->error('En production esta operación está bloqueada. Use --force-local solo si es un entorno controlado.');

            return self::FAILURE;
        }

        $incluirUsuarios = (bool) $this->option('usuarios-demo');
        $plan = $cleanup->plan($incluirUsuarios);

        if ($this->option('dry-run') || ! $this->option('confirm')) {
            $this->warn($this->option('dry-run')
                ? 'Modo dry-run: no se eliminará ningún registro.'
                : 'Modo simulación: no se eliminará ningún registro (falta --confirm).');

            $this->table(
                ['Categoría', 'Registros a eliminar'],
                collect($plan)->map(static fn (int $n, string $k) => [$k, $n])->values()->all(),
            );

            if (! $this->option('confirm') && ! $this->option('dry-run')) {
                $this->comment('Para borrar: php artisan sices:limpiar-demo --confirm [--usuarios-demo]');
            }

            return self::SUCCESS;
        }

        $eliminados = $cleanup->ejecutar($incluirUsuarios);

        $this->info('Limpieza demo completada.');
        $this->table(
            ['Categoría', 'Eliminados'],
            collect($eliminados)->map(static fn (int $n, string $k) => [$k, $n])->values()->all(),
        );

        if (! $incluirUsuarios) {
            $this->comment('Usuarios @sices.local conservados. Use --usuarios-demo para eliminarlos.');
        }

        return self::SUCCESS;
    }
}
