<?php

declare(strict_types=1);

namespace App\Services\Importacion;

use Illuminate\Support\Facades\File;

final class SiseesCatalogosImportReportWriter
{
    /**
     * @param  array<string, mixed>  $reporte
     * @return array{markdown_path: string, json_path: string}
     */
    public function escribir(array $reporte): array
    {
        $stamp = now()->format('Ymd_His');
        $dir = storage_path('app/reportes/importacion-sisees');
        File::ensureDirectoryExists($dir);

        $mdPath = "{$dir}/importacion_catalogos_sisees_{$stamp}.md";
        $jsonPath = "{$dir}/importacion_catalogos_sisees_{$stamp}.json";

        File::put($mdPath, $this->toMarkdown($reporte));
        File::put($jsonPath, json_encode($reporte, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR));

        return [
            'markdown_path' => $mdPath,
            'json_path' => $jsonPath,
        ];
    }

    /**
     * @param  array<string, mixed>  $reporte
     */
    public function toMarkdown(array $reporte): string
    {
        $lines = [];
        $lines[] = '# Importación catálogos SISEES → SICES v2';
        $lines[] = '';
        $lines[] = '**Modo:** '.($reporte['modo'] ?? '');
        $lines[] = '**Generado:** '.($reporte['generado_en'] ?? '');
        $origen = $reporte['origen'] ?? [];
        $lines[] = '**Origen legacy:** '.($origen['connection'] ?? '').' @ '.($origen['host'] ?? '').' / '.($origen['database'] ?? '');
        $lines[] = '';
        $lines[] = '> Solo lectura en legacy. Inserciones únicamente en SICES v2 con `--confirm`.';
        $lines[] = '';

        $pf = $reporte['preflight'] ?? [];
        if ($pf !== []) {
            $lines[] = '## Preflight';
            $status = $pf['conteos_por_status'] ?? [];
            if ($status !== []) {
                $lines[] = '| Tabla | Total | Activos | Inactivos |';
                $lines[] = '|-------|-------|---------|-----------|';
                foreach ($status as $tabla => $c) {
                    if (! is_array($c)) {
                        continue;
                    }
                    $lines[] = sprintf(
                        '| %s | %d | %d | %d |',
                        $tabla,
                        (int) ($c['total'] ?? 0),
                        (int) ($c['activos'] ?? 0),
                        (int) ($c['inactivos'] ?? 0),
                    );
                }
                $lines[] = '';
            }
            $huerfanos = $pf['planes_huérfanos_legacy'] ?? [];
            if ($huerfanos !== []) {
                $lines[] = '### Planes huérfanos (legacy real)';
                $lines[] = '';
                $lines[] = (string) ($huerfanos['descripcion'] ?? '');
                $cat = $huerfanos['programa_estudios_catalogo'] ?? [];
                $lines[] = sprintf(
                    '- programa_estudios: %d registros (IDs %s–%s, %d activos, %d inactivos)',
                    (int) ($cat['total_registros'] ?? 0),
                    (string) ($cat['id_min'] ?? '?'),
                    (string) ($cat['id_max'] ?? '?'),
                    (int) ($cat['activos'] ?? 0),
                    (int) ($cat['inactivos'] ?? 0),
                );
                $lines[] = sprintf(
                    '- plan_estudios activos: %d | huérfanos: %d | programa inactivo: %d | importables estimados: %d',
                    (int) ($huerfanos['plan_estudios_activos_total'] ?? 0),
                    (int) ($huerfanos['planes_huérfanos_activos'] ?? 0),
                    (int) ($huerfanos['planes_programa_inactivo'] ?? 0),
                    (int) ($huerfanos['planes_importables_estimados'] ?? 0),
                );
                $rango = $huerfanos['programa_estudios_id_huérfanos_rango'] ?? [];
                if (! empty($rango['desde'])) {
                    $lines[] = sprintf(
                        '- Rango programa_estudios_id huérfanos: %s–%s',
                        (string) $rango['desde'],
                        (string) ($rango['hasta'] ?? $rango['desde']),
                    );
                }
                $lines[] = '- Motivo omisión: `'.(string) ($huerfanos['motivo_omision_importador'] ?? '').'` (no bloquea importación parcial)';
                $lines[] = '';
            }

            $this->lineasPreflightPlanMateriasOfertas($lines, $pf);

            $ir = $pf['integridad_referencial'] ?? [];
            if ($ir !== []) {
                $lines[] = '### Integridad referencial legacy';
                $lines[] = '';
                $lines[] = '```json';
                $lines[] = json_encode($ir, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
                $lines[] = '```';
                $lines[] = '';
            }
        }

        $lines[] = '## Tablas legacy (conteo y columnas)';
        $lines[] = '| Clave config | Tabla | Existe | Registros |';
        $lines[] = '|--------------|-------|--------|-----------|';
        foreach ($reporte['tablas_legacy'] ?? [] as $clave => $info) {
            if (! is_array($info)) {
                continue;
            }
            $lines[] = sprintf(
                '| %s | `%s` | %s | %d |',
                $clave,
                $info['tabla'] ?? '',
                ! empty($info['existe']) ? 'sí' : 'no',
                (int) ($info['registros'] ?? 0),
            );
        }
        $lines[] = '';

        $lines[] = '## Resumen por entidad SICES v2';
        $lines[] = '| Entidad | Leídos | Insertar | Actualizar | Omitidos | Fuente legacy |';
        $lines[] = '|---------|--------|----------|------------|----------|---------------|';
        foreach ($reporte['resumen'] ?? [] as $entidad => $r) {
            if (! is_array($r)) {
                continue;
            }
            $extra = '';
            if (isset($r['candidatos_generados'])) {
                $extra = sprintf(' (legacy %d → candidatos %d)', (int) ($r['registros_legacy_leidos'] ?? 0), (int) $r['candidatos_generados']);
            }
            $lines[] = sprintf(
                '| %s | %d | %d | %d | %d | %s%s |',
                $entidad,
                (int) ($r['leidos'] ?? 0),
                (int) ($r['insertar'] ?? 0),
                (int) ($r['actualizar'] ?? 0),
                (int) ($r['omitidos'] ?? 0),
                (string) ($r['tabla_legacy'] ?? '—'),
                $extra,
            );
        }
        $lines[] = '';

        foreach ($reporte['resumen'] ?? [] as $entidad => $r) {
            if (! is_array($r)) {
                continue;
            }
            $motivos = $r['omitidos_por_motivo'] ?? [];
            if ($motivos === [] && ($r['muestras_omitidos'] ?? []) === []) {
                continue;
            }
            $lines[] = '### Omisiones: '.$entidad;
            if ($motivos !== []) {
                $lines[] = '';
                $lines[] = '**Por motivo:**';
                foreach ($motivos as $motivo => $cnt) {
                    $lines[] = '- '.$motivo.': '.$cnt;
                }
            }
            $insertar = $r['muestras_insertar'] ?? [];
            if ($insertar !== []) {
                $lines[] = '';
                $lines[] = '**Muestras insertar:**';
                foreach ($insertar as $m) {
                    if (! is_array($m)) {
                        continue;
                    }
                    $lines[] = '- '.json_encode($m, JSON_UNESCAPED_UNICODE);
                }
            }
            $muestras = $r['muestras_omitidos'] ?? [];
            if ($muestras !== []) {
                $lines[] = '';
                $lines[] = '**Muestras:**';
                foreach ($muestras as $m) {
                    if (! is_array($m)) {
                        continue;
                    }
                    $lines[] = sprintf(
                        '- legacy %s — %s: %s',
                        (string) ($m['legacy_id'] ?? '—'),
                        (string) ($m['motivo'] ?? ''),
                        (string) ($m['detalle'] ?? ''),
                    );
                }
            }
            $lines[] = '';
        }

        if (($reporte['errores_bloqueantes'] ?? []) !== []) {
            $lines[] = '## Errores bloqueantes';
            foreach ($reporte['errores_bloqueantes'] as $e) {
                $lines[] = '- '.$e;
            }
            $lines[] = '';
        }

        $trans = $reporte['transaccion'] ?? [];
        if ($trans !== []) {
            $lines[] = '## Transacción';
            $lines[] = '- **Estado:** '.($trans['estado'] ?? '');
            if (! empty($trans['error'])) {
                $lines[] = '- **Error:** '.$trans['error'];
            }
            if (! empty($trans['mensaje'])) {
                $lines[] = '- '.$trans['mensaje'];
            }
            $lines[] = '';
        }

        $claves = $reporte['claves_materia_generadas'] ?? [];
        if ($claves !== []) {
            $lines[] = '## Claves técnicas generadas (plan_materias)';
            foreach (array_slice($claves, 0, 20) as $c) {
                if (! is_array($c)) {
                    continue;
                }
                $lines[] = sprintf(
                    '- MP %s → `%s` (original: %s)',
                    (string) ($c['materia_periodo_id'] ?? ''),
                    (string) ($c['clave_generada'] ?? ''),
                    (string) ($c['legacy_clave_materia_original'] ?? 'null'),
                );
            }
            $lines[] = '';
        }

        if (($reporte['advertencias'] ?? []) !== []) {
            $lines[] = '## Advertencias';
            foreach ($reporte['advertencias'] as $w) {
                $lines[] = '- '.$w;
            }
            $lines[] = '';
        }

        if (($reporte['errores_criticos'] ?? []) !== []) {
            $lines[] = '## Errores críticos (bloquean --confirm)';
            foreach ($reporte['errores_criticos'] as $e) {
                $lines[] = '- '.$e;
            }
            $lines[] = '';
        }

        if (($reporte['errores'] ?? []) !== []) {
            $lines[] = '## Errores';
            foreach ($reporte['errores'] as $e) {
                $lines[] = '- '.$e;
            }
            $lines[] = '';
        }

        return implode("\n", $lines)."\n";
    }

    /**
     * @param  list<string>  $lines
     * @param  array<string, mixed>  $pf
     */
    private function lineasPreflightPlanMateriasOfertas(array &$lines, array $pf): void
    {
        if (! isset($pf['plan_materias_con_clave_vacia'])) {
            return;
        }
        $lines[] = '### Preflight plan_materias / ofertas';
        $lines[] = sprintf('- plan_materias_con_clave_vacia: %d', (int) ($pf['plan_materias_con_clave_vacia'] ?? 0));
        $lines[] = sprintf('- plan_materias_claves_tecnicas_estimadas: %d', (int) ($pf['plan_materias_claves_tecnicas_estimadas'] ?? 0));
        $lines[] = sprintf('- plan_materias_duplicadas_por_llave_natural: %d', (int) ($pf['plan_materias_duplicadas_por_llave_natural'] ?? 0));
        $lines[] = sprintf('- ofertas_academicas_omitidas_sede_no_resuelta: %d', (int) ($pf['ofertas_academicas_omitidas_sede_no_resuelta'] ?? 0));
        $lines[] = sprintf('- ofertas_academicas_con_sede_resuelta: %d', (int) ($pf['ofertas_academicas_con_sede_resuelta'] ?? 0));
        $lines[] = '';
    }
}
