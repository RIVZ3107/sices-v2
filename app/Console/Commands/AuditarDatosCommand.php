<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\Demo\DemoDataAuditService;
use Illuminate\Console\Command;

final class AuditarDatosCommand extends Command
{
    protected $signature = 'sices:auditar-datos
                            {--usuarios-demo : Incluir usuarios @sices.local en la clasificación}';

    protected $description = 'Auditoría de solo lectura: demo activo, soft-deleted y purgable.';

    public function handle(DemoDataAuditService $audit): int
    {
        $incluirUsuarios = (bool) $this->option('usuarios-demo');
        $resultado = $audit->auditar($incluirUsuarios);
        $cl = $resultado['clasificacion'];

        $this->info('Auditoría de datos demo / sintéticos (solo lectura)');
        $this->newLine();
        $this->line('Patrones:');
        foreach ($resultado['patrones'] as $patron) {
            $this->line("  • {$patron}");
        }

        $this->newLine();
        $this->table(
            ['Estado', 'Registros'],
            [
                ['demo_activo (deleted_at NULL)', $cl['totales']['activo']],
                ['demo_soft_deleted (deleted_at NOT NULL)', $cl['totales']['soft_deleted']],
                ['demo_purgable (soft-deleted + patrón demo)', $cl['totales']['purgable']],
            ],
        );

        $this->newLine();
        $this->info('Por tabla (activo / soft-deleted / purgable):');
        $filas = [];
        foreach ($resultado['tablas_sospechosas'] as $row) {
            $filas[] = [
                $row['tabla'],
                $row['activo'],
                $row['soft_deleted'],
                $row['purgable'],
            ];
        }
        if ($filas === []) {
            $this->line('  Sin registros demo detectados.');
        } else {
            $this->table(['Tabla', 'Activo', 'Soft-deleted', 'Purgable'], $filas);
        }

        $this->newLine();
        $this->info('Catálogos activos reales (no demo):');
        $this->table(
            ['Catálogo', 'Activos'],
            collect($cl['catalogos_activos_reales'])->map(static fn (int $n, string $k) => [$k, $n])->values()->all(),
        );

        $this->newLine();
        $this->line('Total candidatos limpieza lógica (activo): '.$cl['totales']['activo']);
        $this->line('Total candidatos purga física: '.$cl['totales']['purgable']);
        $this->comment('Simulación: php artisan sices:limpiar-demo --dry-run [--purge-soft-deleted]');
        $this->comment('Limpieza: php artisan sices:limpiar-demo --confirm [--purge-soft-deleted] [--usuarios-demo]');

        return self::SUCCESS;
    }
}
