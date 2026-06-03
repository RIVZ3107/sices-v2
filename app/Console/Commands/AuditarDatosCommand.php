<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\Demo\DemoDataAuditService;
use Illuminate\Console\Command;

final class AuditarDatosCommand extends Command
{
    protected $signature = 'sices:auditar-datos';

    protected $description = 'Auditoría de solo lectura: conteos de registros demo/sintéticos candidatos a limpieza.';

    public function handle(DemoDataAuditService $audit): int
    {
        $resultado = $audit->auditar();

        $this->info('Auditoría de datos demo / sintéticos (solo lectura)');
        $this->newLine();
        $this->line('Patrones detectados:');
        foreach ($resultado['patrones'] as $patron) {
            $this->line("  • {$patron}");
        }

        $this->newLine();
        $this->table(
            ['Concepto', 'Registros'],
            collect($resultado['conteos'])->map(static fn (int $n, string $k) => [$k, $n])->values()->all(),
        );

        $this->newLine();
        if ($resultado['tablas_sospechosas'] === []) {
            $this->info('No se detectaron tablas con datos demo.');
        } else {
            $this->warn('Tablas con datos sospechosos (candidatos a limpieza con sices:limpiar-demo):');
            $this->table(
                ['Tabla', 'Registros', 'Criterio'],
                array_map(
                    static fn (array $r) => [$r['tabla'], $r['registros'], $r['criterio']],
                    $resultado['tablas_sospechosas'],
                ),
            );
        }

        $this->newLine();
        $this->line('Total candidatos: '.$resultado['total_candidatos']);
        $this->comment('Use: php artisan sices:limpiar-demo --dry-run');
        $this->comment('Borrado real: php artisan sices:limpiar-demo --confirm [--usuarios-demo]');

        return self::SUCCESS;
    }
}
