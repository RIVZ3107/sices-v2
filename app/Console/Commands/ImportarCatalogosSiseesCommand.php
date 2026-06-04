<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Services\Importacion\SiseesCatalogosImportService;
use Illuminate\Console\Command;
use Throwable;

final class ImportarCatalogosSiseesCommand extends Command
{
    protected $signature = 'sices:importar-catalogos-sisees
                            {--dry-run : Simular importación sin insertar en SICES v2 (por defecto)}
                            {--confirm : Insertar/actualizar catálogos en SICES v2 desde sisees_legacy local}
                            {--rollback-importacion : Eliminar solo registros creados por import_sisees_legacy (requiere --confirm para borrar)}';

    protected $description = 'Importa catálogos desde dump MySQL local sisees_legacy (solo lectura legacy). Sin --confirm no inserta.';

    public function handle(SiseesCatalogosImportService $import): int
    {
        $rollback = (bool) $this->option('rollback-importacion');
        $confirm = (bool) $this->option('confirm');
        $dryRun = $rollback ? ! $confirm : (! $confirm || (bool) $this->option('dry-run'));

        if ($rollback) {
            if ($dryRun) {
                $this->warn('Rollback dry-run: muestra conteos; use --rollback-importacion --confirm para eliminar.');
            } else {
                $this->warn('Rollback confirm: eliminará registros con metadata.import_creado_en_import=true.');
            }

            try {
                $reporte = $import->ejecutar($confirm, true);
            } catch (Throwable $e) {
                $this->error($e->getMessage());

                return self::FAILURE;
            }

            $this->mostrarConteosRollback($reporte);

            return self::SUCCESS;
        }

        if ($dryRun) {
            $this->warn('Modo dry-run: no se insertará ni actualizará nada en SICES v2.');
        } else {
            $this->info('Modo confirm: importación en transacción única (rollback automático si falla).');
        }

        $this->line('Origen legacy: mysql_sisees_legacy (dump local, solo lectura).');
        $this->line('Alcance: instituciones, sedes, niveles, programas, planes, materias, plan_materias, ofertas.');
        $this->line('Excluido: alumnos, CURP, calificaciones, documentos.');

        try {
            $reporte = $import->ejecutar(! $dryRun, false);
        } catch (Throwable $e) {
            $this->error($e->getMessage());

            return self::FAILURE;
        }

        $this->mostrarResumenImport($reporte);
        $this->mostrarPreflightImport($reporte);
        $this->mostrarErroresReporte($reporte);

        $paths = $reporte['reportes'] ?? [];
        if ($paths !== []) {
            $this->newLine();
            $this->line('Reportes:');
            $this->line('  MD:   '.($paths['markdown_path'] ?? ''));
            $this->line('  JSON: '.($paths['json_path'] ?? ''));
        }

        $trans = $reporte['transaccion']['estado'] ?? '';
        $this->newLine();
        $this->line('Transacción: '.$trans);

        if (($reporte['errores_bloqueantes'] ?? []) !== []) {
            return self::FAILURE;
        }

        if ($dryRun) {
            $this->comment('Para importar: php artisan sices:importar-catalogos-sisees --confirm');
        }

        return self::SUCCESS;
    }

    /**
     * @param  array<string, mixed>  $reporte
     */
    private function mostrarResumenImport(array $reporte): void
    {
        $this->newLine();
        $this->info('Resumen:');
        $filas = [];
        foreach ($reporte['resumen'] ?? [] as $entidad => $r) {
            if (! is_array($r)) {
                continue;
            }
            $leidos = (int) ($r['leidos'] ?? 0);
            if (isset($r['candidatos_generados'])) {
                $leidos = (int) ($r['registros_legacy_leidos'] ?? $leidos);
            }
            $filas[] = [$entidad, $leidos, $r['insertar'] ?? 0, $r['actualizar'] ?? 0, $r['omitidos'] ?? 0];
        }
        if ($filas !== []) {
            $this->table(['Entidad', 'Leídos', 'Insertar', 'Actualizar', 'Omitidos'], $filas);
        }
    }

    /**
     * @param  array<string, mixed>  $reporte
     */
    private function mostrarPreflightImport(array $reporte): void
    {
        $pf = $reporte['preflight'] ?? [];
        if ($pf === []) {
            return;
        }

        $this->newLine();
        $this->info('Preflight importación:');
        $this->line('  plan_materias con clave vacía en legacy: '.(int) ($pf['plan_materias_con_clave_vacia'] ?? 0));
        $this->line('  claves técnicas estimadas (SINCLAVE-*): '.(int) ($pf['plan_materias_claves_tecnicas_estimadas'] ?? 0));
        $this->line('  plan_materias duplicadas llave natural: '.(int) ($pf['plan_materias_duplicadas_por_llave_natural'] ?? 0));
        $this->line('  ofertas sin sede (omitidas): '.(int) ($pf['ofertas_academicas_omitidas_sede_no_resuelta'] ?? 0));
        $this->line('  ofertas con sede resuelta: '.(int) ($pf['ofertas_academicas_con_sede_resuelta'] ?? 0));
    }

    /**
     * @param  array<string, mixed>  $reporte
     */
    private function mostrarErroresReporte(array $reporte): void
    {
        $totales = $reporte['totales'] ?? [];
        $this->newLine();
        $this->line('Advertencias: '.(int) ($totales['advertencias'] ?? count($reporte['advertencias'] ?? [])));
        $this->line('Errores bloqueantes: '.(int) ($totales['errores_bloqueantes'] ?? count($reporte['errores_bloqueantes'] ?? [])));

        foreach ($reporte['errores_bloqueantes'] ?? [] as $err) {
            $this->error('[BLOQUEANTE] '.$err);
        }
        foreach ($reporte['errores_criticos'] ?? [] as $err) {
            $this->error('[CRÍTICO] '.$err);
        }
    }

    /**
     * @param  array<string, mixed>  $reporte
     */
    private function mostrarConteosRollback(array $reporte): void
    {
        $this->newLine();
        $this->info('Rollback importación SISEES');
        $conteos = $reporte['conteos_a_eliminar'] ?? [];
        $filas = [];
        foreach ($conteos as $entidad => $n) {
            $filas[] = [$entidad, $n];
        }
        $this->table(['Entidad', 'A eliminar (creados por import)'], $filas);
        $this->line((string) ($reporte['mensaje'] ?? ''));
        $actualizados = $reporte['conteos_actualizados_sin_borrar'] ?? [];
        if ($actualizados !== []) {
            $this->line('Registros solo actualizados (no se borran): '.array_sum($actualizados));
        }
    }
}
