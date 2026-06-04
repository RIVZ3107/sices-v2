<?php

declare(strict_types=1);

namespace App\Services\Diagnostico;

use Illuminate\Support\Facades\File;

final class DiagnosticoBaseReportWriter
{
    /**
     * @param  array<string, mixed>  $reporte
     * @return array{markdown: string, json: string, markdown_path: string, json_path: string}
     */
    public function escribir(array $reporte): array
    {
        $stamp = now()->format('Ymd_His');
        $dir = storage_path('app/reportes/diagnostico-base');
        File::ensureDirectoryExists($dir);

        $mdPath = "{$dir}/diagnostico_base_{$stamp}.md";
        $jsonPath = "{$dir}/diagnostico_base_{$stamp}.json";

        $md = $this->toMarkdown($reporte);
        $json = json_encode($reporte, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR);

        File::put($mdPath, $md);
        File::put($jsonPath, $json);

        return [
            'markdown' => $md,
            'json' => $json,
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
        $lines[] = '# Diagnóstico de base — SICES v2';
        $lines[] = '';
        $lines[] = '**Generado:** '.($reporte['generado_en'] ?? '');
        $lines[] = '**Conexión:** '.($reporte['conexion']['driver'] ?? '').' / '.($reporte['conexion']['database'] ?? '');
        $lines[] = '';
        $lines[] = '> Solo lectura. No modifica datos.';
        $lines[] = '';

        $lines[] = '## Tablas prioritarias';
        foreach ($reporte['tablas'] ?? [] as $t) {
            $lines[] = '### `'.$t['tabla'].'`';
            $lines[] = '- Existe: '.($t['existe'] ? 'sí' : 'no');
            $lines[] = '- Registros: '.($t['total_registros'] ?? 0);
            if ($t['soft_deleted'] !== null) {
                $lines[] = '- Soft deleted: '.$t['soft_deleted'];
            }
            if (($t['tamano_bytes'] ?? null) !== null) {
                $lines[] = '- Tamaño aprox.: '.$this->formatBytes((int) $t['tamano_bytes']);
            }
            $lines[] = '- Columnas: `'.implode('`, `', $t['columnas'] ?? []).'`';
            $lines[] = '- PK: `'.implode('`, `', $t['primary_keys'] ?? []).'`';
            if (($t['foreign_keys'] ?? []) !== []) {
                foreach ($t['foreign_keys'] as $fk) {
                    $lines[] = '  - FK `'.$fk['column'].'` → `'.$fk['references_table'].'.'.$fk['references_column'].'`';
                }
            }
            $lines[] = '- Heurística demo: '.($t['registros_demo_heuristica'] ?? 0);
            if (($t['campos_demo_detectados'] ?? []) !== []) {
                $lines[] = '- Campos demo en muestra: '.implode(', ', $t['campos_demo_detectados']);
            }
            if (($t['nulls_importantes'] ?? []) !== []) {
                foreach ($t['nulls_importantes'] as $n) {
                    $lines[] = '  - NULL en `'.$n['column'].'`: '.$n['nulls'];
                }
            }
            $lines[] = '';
        }

        $lines[] = '## Catálogos';
        $lines[] = $this->sectionJson($reporte['catalogos'] ?? []);

        $lines[] = '## Operación académica';
        $lines[] = $this->sectionJson($reporte['operacion_academica'] ?? []);

        $lines[] = '## Usuarios';
        $lines[] = $this->sectionJson($reporte['usuarios'] ?? []);

        $lines[] = '## Permisos y menús';
        $lines[] = $this->sectionJson($reporte['permisos_menus'] ?? []);

        $lines[] = '## Limpieza demo';
        $cl = $reporte['demo_clasificacion'] ?? $reporte['limpieza_demo']['clasificacion'] ?? [];
        $tot = $cl['totales'] ?? [];
        $lines[] = '- Demo activo (deleted_at NULL): '.($tot['activo'] ?? 0);
        $lines[] = '- Demo soft-deleted: '.($tot['soft_deleted'] ?? 0);
        $lines[] = '- Demo purgable: '.($tot['purgable'] ?? 0);
        $lines[] = '';
        $lines[] = '### Por tabla';
        $lines[] = $this->sectionJson([
            'demo_activo' => $cl['demo_activo'] ?? [],
            'demo_soft_deleted' => $cl['demo_soft_deleted'] ?? [],
            'demo_purgable' => $cl['demo_purgable'] ?? [],
        ]);
        $lines[] = '### Catálogos activos reales';
        $lines[] = $this->sectionJson($cl['catalogos_activos_reales'] ?? []);
        $lines[] = '### Conteos legacy (DemoDataScope)';
        $lines[] = $this->sectionJson($reporte['limpieza_demo']['conteos'] ?? []);

        $lines[] = '## Recomendaciones';
        $rec = $reporte['recomendaciones'] ?? [];
        $demoResumen = $rec['demo_resumen'] ?? [];
        if ($demoResumen !== []) {
            $lines[] = '### Resumen demo';
            $lines[] = '- Activo: '.($demoResumen['activo'] ?? 0);
            $lines[] = '- Soft-deleted: '.($demoResumen['soft_deleted'] ?? 0);
            $lines[] = '- Purgable: '.($demoResumen['purgable'] ?? 0);
            $lines[] = '';
        }

        foreach ([
            'datos_conservar' => '1. Datos que se pueden conservar',
            'datos_parecen_demo' => '2. Datos que parecen demo',
            'catalogos_incompletos' => '3. Catálogos incompletos',
            'tablas_listas_datos_reales' => '4. Tablas listas para datos reales',
            'tablas_poblar_primero' => '5. Tablas que deben poblarse primero',
            'carga_real_despues_purga' => '6. Carga real recomendada (post-purga)',
            'riesgos' => '7. Riesgos antes de cargar datos reales',
            'orden_carga_recomendado' => '8. Orden recomendado de carga real',
        ] as $key => $title) {
            $lines[] = '### '.$title;
            foreach ($rec[$key] ?? [] as $item) {
                $lines[] = '- '.$item;
            }
            $lines[] = '';
        }

        return implode("\n", $lines);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function sectionJson(array $data): string
    {
        return "```json\n".json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)."\n```\n";
    }

    private function formatBytes(int $bytes): string
    {
        if ($bytes < 1024) {
            return $bytes.' B';
        }
        if ($bytes < 1048576) {
            return round($bytes / 1024, 1).' KB';
        }

        return round($bytes / 1048576, 2).' MB';
    }
}
