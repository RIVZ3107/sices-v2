<?php

declare(strict_types=1);

namespace App\Services\Demo;

use App\Support\Demo\DemoDataScope;

final class DemoDataAuditService
{
    public function __construct(
        private readonly DemoDataScope $scope = new DemoDataScope,
    ) {}

    /**
     * @return array{
     *     patrones: list<string>,
     *     conteos: array<string, int>,
     *     total_candidatos: int,
     *     tablas_sospechosas: list<array{tabla: string, registros: int, criterio: string}>
     * }
     */
    public function auditar(): array
    {
        $conteos = $this->scope->conteos();
        $tablas = [
            ['tabla' => 'users', 'registros' => $conteos['usuarios_demo'], 'criterio' => 'email @sices.local o *.dataset@sices.local'],
            ['tabla' => 'alumnos', 'registros' => $conteos['alumnos_demo'], 'criterio' => 'metadata.origen=demo_control_escolar o nombre DemoSynthetic'],
            ['tabla' => 'matriculas', 'registros' => $conteos['matriculas_demo'], 'criterio' => 'metadata demo o alumno demo'],
            ['tabla' => 'materias', 'registros' => $conteos['materias_demo'], 'criterio' => 'plan demo o nombre (demo)/sintético'],
            ['tabla' => 'plan_materias', 'registros' => $conteos['plan_materias_demo'], 'criterio' => 'planes demo'],
            ['tabla' => 'materias_cursadas', 'registros' => $conteos['materias_cursadas_demo'], 'criterio' => 'metadata demo o alumno demo'],
            ['tabla' => 'cargas_academicas', 'registros' => $conteos['cargas_academicas_demo'], 'criterio' => 'metadata demo o matrícula demo'],
            ['tabla' => 'inscripciones_periodo', 'registros' => $conteos['inscripciones_demo'], 'criterio' => 'metadata demo o matrícula demo'],
            ['tabla' => 'trayectorias_academicas', 'registros' => $conteos['trayectorias_demo'], 'criterio' => 'metadata demo o alumno/matrícula demo'],
            ['tabla' => 'documentos_academicos', 'registros' => $conteos['documentos_academicos_demo'], 'criterio' => 'metadata demo o alumno demo'],
            ['tabla' => 'documento_observaciones', 'registros' => $conteos['observaciones_demo'], 'criterio' => 'metadata demo o documento demo'],
            ['tabla' => 'ciclos_escolares', 'registros' => $conteos['ciclos_demo'], 'criterio' => 'clave SXCE-DEMO-* o nombre ciclo demo'],
            ['tabla' => 'programas_estudio', 'registros' => $conteos['programas_demo'], 'criterio' => 'clave SXCE-DEMO-* o metadata demo'],
            ['tabla' => 'planes_estudio', 'registros' => $conteos['planes_demo'], 'criterio' => 'clave SXCE-DEMO-* o metadata demo'],
            ['tabla' => 'ofertas_academicas', 'registros' => $conteos['ofertas_demo'], 'criterio' => 'metadata.origen demo o clave SXCE-DEMO'],
        ];

        $sospechosas = array_values(array_filter(
            $tablas,
            static fn (array $row): bool => $row['registros'] > 0,
        ));

        return [
            'patrones' => [
                'DemoSynthetic',
                'demo_control_escolar',
                'demo_dataset',
                'SXCE-DEMO-*',
                '@sices.local',
                'synthetic / sintético en nombres de materias',
            ],
            'conteos' => $conteos,
            'total_candidatos' => array_sum($conteos),
            'tablas_sospechosas' => $sospechosas,
        ];
    }
}
