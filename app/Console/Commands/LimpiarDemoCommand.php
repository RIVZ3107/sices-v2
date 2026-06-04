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
                            {--purge-soft-deleted : Purga física de registros demo ya soft-deleted (requiere --confirm)}
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
        $purgeSoft = (bool) $this->option('purge-soft-deleted');
        $dryRun = (bool) $this->option('dry-run');
        $confirm = (bool) $this->option('confirm');

        if ($dryRun || ! $confirm) {
            $this->warn($dryRun
                ? 'Modo dry-run: no se eliminará ningún registro.'
                : 'Modo simulación: no se eliminará ningún registro (falta --confirm).');

            if ($purgeSoft) {
                $plan = $cleanup->planPurgeSoftDeleted($incluirUsuarios);
                $this->mostrarTablaPurge('Registros demo soft-deleted purgables (simulación)', $plan);
                $this->line('Total candidatos a purga física: '.array_sum($plan));
            } else {
                $this->mostrarPlanLogico($cleanup->plan($incluirUsuarios));
            }

            if (! $confirm && ! $dryRun) {
                $this->comment('Borrado lógico: php artisan sices:limpiar-demo --confirm [--usuarios-demo]');
                $this->comment('Purga física soft-deleted: php artisan sices:limpiar-demo --confirm --purge-soft-deleted [--usuarios-demo]');
            }

            return self::SUCCESS;
        }

        if ($purgeSoft) {
            $resultado = $cleanup->ejecutarPurgeSoftDeleted($incluirUsuarios);

            $this->info('Purga física de registros demo soft-deleted.');
            $this->mostrarTablaPurge('Antes de purgar', $resultado['antes']);
            $this->mostrarTablaPurge('Eliminados físicamente', $resultado['eliminados']);
            $this->mostrarTablaPurge('Después de purgar', $resultado['despues']);

            $total = array_sum($resultado['eliminados']);
            $this->line("Total purgado: {$total}");

            if (! $incluirUsuarios) {
                $this->comment('Usuarios @sices.local no incluidos. Use --usuarios-demo si aplica.');
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

        $this->comment('Si quedan filas demo con deleted_at, ejecute: php artisan sices:limpiar-demo --confirm --purge-soft-deleted');

        return self::SUCCESS;
    }

    /**
     * @param  array<string, int>  $plan
     */
    private function mostrarPlanLogico(array $plan): void
    {
        $this->info('Borrado lógico (registros demo activos):');
        $this->table(
            ['Categoría', 'Registros a eliminar'],
            collect($plan)->map(static fn (int $n, string $k) => [$k, $n])->values()->all(),
        );
    }

    /**
     * @param  array<string, int>  $plan
     */
    private function mostrarTablaPurge(string $titulo, array $plan): void
    {
        $this->newLine();
        $this->info($titulo.' (solo demo con deleted_at NOT NULL):');
        $filas = collect($plan)
            ->filter(static fn (int $n) => $n > 0)
            ->map(static fn (int $n, string $k) => [$k, $n])
            ->values()
            ->all();

        if ($filas === []) {
            $this->line('  (ningún registro)');
        } else {
            $this->table(['Tabla', 'Registros'], $filas);
        }
        $this->line('  Subtotal: '.array_sum($plan));
    }
}
