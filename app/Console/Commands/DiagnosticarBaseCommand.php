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

        $cp = $reporte['ciclos_periodos'] ?? [];
        if (($cp['existe'] ?? false) === true) {
            $this->newLine();
            $this->line('Ciclos escolares: '.($cp['ciclos_escolares']['total'] ?? 0).' (activos: '.($cp['ciclos_escolares']['activos'] ?? 0).')');
            $this->line('Ciclo actual: '.($cp['ciclo_actual']['clave'] ?? '— ninguno —'));
            $this->line('Periodos escolares: '.($cp['periodos_escolares']['total'] ?? 0).' (activos: '.($cp['periodos_escolares']['activos'] ?? 0).')');
            if ($cp['sin_ciclo_actual'] ?? false) {
                $this->warn('Advertencia: no hay ciclo escolar marcado como actual.');
            }
        }

        $cce = $reporte['catalogos_control_escolar'] ?? [];
        if (($cce['estatus_academicos']['existe'] ?? false) || ($cce['estatus_matricula']['existe'] ?? false) || ($cce['escalas_calificacion']['existe'] ?? false)) {
            $this->newLine();
            $this->line('Estatus académicos: '.($cce['estatus_academicos']['total'] ?? 0));
            $this->line('Estatus de matrícula: '.($cce['estatus_matricula']['total'] ?? 0));
            $this->line('Escalas de calificación: '.($cce['escalas_calificacion']['total'] ?? 0).' (activas: '.($cce['escalas_calificacion']['activos'] ?? 0).')');
            if ($cce['escalas_calificacion']['sin_escala_activa'] ?? false) {
                $this->warn('Advertencia: no hay escalas de calificación activas.');
            }
        }

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
