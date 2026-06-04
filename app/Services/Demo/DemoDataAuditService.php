<?php

declare(strict_types=1);

namespace App\Services\Demo;

use App\Support\Demo\DemoDataScope;

final class DemoDataAuditService
{
    public function __construct(
        private readonly DemoDataScope $scope = new DemoDataScope,
        private readonly DemoDataCatalogClassifier $classifier = new DemoDataCatalogClassifier,
    ) {}

    /**
     * @return array{
     *     patrones: list<string>,
     *     clasificacion: array{
     *         demo_activo: array<string, int>,
     *         demo_soft_deleted: array<string, int>,
     *         demo_purgable: array<string, int>,
     *         catalogos_activos_reales: array<string, int>,
     *         totales: array{activo: int, soft_deleted: int, purgable: int}
     *     },
     *     conteos: array<string, int>,
     *     total_candidatos: int,
     *     tablas_sospechosas: list<array{tabla: string, activo: int, soft_deleted: int, purgable: int, criterio: string}>
     * }
     */
    public function auditar(bool $incluirUsuariosDemo = false): array
    {
        $clasificacion = $this->classifier->clasificar($incluirUsuariosDemo);
        $conteos = $this->scope->conteos();

        $criterios = [
            'documento_observaciones' => 'documento demo o metadata demo (soft-deleted purgable)',
            'documento_estados_historial' => 'documento demo o metadata demo (soft-deleted purgable)',
            'documento_materias_snapshot' => 'documento demo o metadata demo (soft-deleted purgable)',
            'documentos_academicos' => 'metadata demo o alumno demo',
            'trayectorias_academicas' => 'metadata demo o alumno/matrícula demo',
            'materias_cursadas' => 'metadata demo o alumno demo',
            'cargas_academicas' => 'metadata demo o matrícula demo',
            'inscripciones_periodo' => 'metadata demo o matrícula demo',
            'matriculas' => 'metadata demo o alumno demo',
            'alumnos' => 'metadata.origen=demo_control_escolar o nombre DemoSynthetic',
            'plan_materias' => 'plan demo o metadata demo',
            'materias' => 'plan demo o nombre (demo)/sintético',
            'ofertas_academicas' => 'metadata.origen demo o clave SXCE-DEMO',
            'planes_estudio' => 'clave SXCE-DEMO-* o metadata demo',
            'programas_estudio' => 'clave SXCE-DEMO-* o metadata demo',
            'ciclos_escolares' => 'clave SXCE-DEMO-* o nombre ciclo demo',
            'users' => 'email @sices.local (solo con --usuarios-demo en limpieza)',
        ];

        $tablas = [];
        foreach (DemoDataCatalogClassifier::TABLAS as $cfg) {
            $tabla = $cfg['tabla'];
            if ($tabla === 'users' && ! $incluirUsuariosDemo) {
                continue;
            }

            $activo = $clasificacion['demo_activo'][$tabla] ?? 0;
            $soft = $clasificacion['demo_soft_deleted'][$tabla] ?? 0;
            $purgable = $clasificacion['demo_purgable'][$tabla] ?? 0;

            if ($activo > 0 || $soft > 0 || $purgable > 0) {
                $tablas[] = [
                    'tabla' => $tabla,
                    'activo' => $activo,
                    'soft_deleted' => $soft,
                    'purgable' => $purgable,
                    'criterio' => $criterios[$tabla] ?? 'patrón demo + deleted_at para purga',
                ];
            }
        }

        return [
            'patrones' => [
                'clave contiene DEMO o SXCE-DEMO',
                'nombre contiene demo',
                'metadata: demo_control_escolar, demo_dataset, synthetic, control_escolar_v1',
                'DemoSynthetic / @sices.local (usuarios con --usuarios-demo)',
            ],
            'clasificacion' => $clasificacion,
            'conteos' => $conteos,
            'total_candidatos' => $clasificacion['totales']['activo'] + $clasificacion['totales']['purgable'],
            'tablas_sospechosas' => $tablas,
        ];
    }
}
