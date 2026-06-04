<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\Diagnostico\DiagnosticoBaseReportWriter;
use App\Services\Diagnostico\DiagnosticoBaseService;
use Illuminate\Console\Command;

final class DiagnosticarBaseCommand extends Command
{
    protected $signature = 'sices:diagnosticar-base';

    protected $description = 'Diagnóstico de solo lectura de la base actual (estructura dinámica, catálogos, demo, recomendaciones).';

    public function handle(DiagnosticoBaseService $service, DiagnosticoBaseReportWriter $writer): int
    {
        $this->info('Generando diagnóstico de base (solo lectura)…');

        $reporte = $service->ejecutar();
        $archivos = $writer->escribir($reporte);

        $this->newLine();
        $this->line('Conexión: '.($reporte['conexion']['driver'] ?? '').' / '.($reporte['conexion']['database'] ?? ''));
        $this->line('Tablas revisadas: '.count($reporte['tablas'] ?? []));
        $cl = $reporte['demo_clasificacion'] ?? [];
        $tot = $cl['totales'] ?? [];
        $this->line('Demo activo: '.($tot['activo'] ?? 0));
        $this->line('Demo soft-deleted: '.($tot['soft_deleted'] ?? 0));
        $this->line('Demo purgable: '.($tot['purgable'] ?? 0));

        $this->newLine();
        $this->table(
            ['Tabla', 'Existe', 'Registros', 'Demo heur.'],
            collect($reporte['tablas'] ?? [])->map(static fn (array $t) => [
                $t['tabla'],
                ($t['existe'] ?? false) ? 'sí' : 'no',
                $t['total_registros'] ?? 0,
                $t['registros_demo_heuristica'] ?? 0,
            ])->all(),
        );

        $this->newLine();
        $this->info('Reportes generados:');
        $this->line('  Markdown: '.$archivos['markdown_path']);
        $this->line('  JSON: '.$archivos['json_path']);

        $this->newLine();
        $this->comment('Recomendaciones (resumen):');
        foreach ($reporte['recomendaciones']['riesgos'] ?? [] as $riesgo) {
            $this->warn('  • '.$riesgo);
        }
        if (($reporte['recomendaciones']['riesgos'] ?? []) === []) {
            $this->line('  Sin riesgos críticos detectados en esta corrida.');
        }
        foreach ($reporte['recomendaciones']['carga_real_despues_purga'] ?? [] as $paso) {
            $this->line('  → '.$paso);
        }

        return self::SUCCESS;
    }
}
