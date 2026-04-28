<?php

namespace Database\Seeders;

use App\Enums\Certificacion\MotorDocumento;
use App\Models\PlantillaDocumento;
use Illuminate\Database\Seeder;

class PlantillaDocumentoSeeder extends Seeder
{
    public function run(): void
    {
        $meta = [
            'estado_validacion' => 'pendiente_template_final',
            'requiere_revision_senior' => true,
            'advertencia' => 'Rutas relativas placeholder; sin archivos Jasper reales en repo.',
        ];

        $filas = [
            [
                'codigo' => 'PDF_CERTIFICADO_NORMAL_JASPER_V1',
                'tipo_documento' => 'certificado',
                'nombre' => 'Certificado normal Jasper v1 (placeholder)',
                'descripcion' => 'Plantilla base Jasper para certificado modalidad normal.',
                'ruta_template' => 'templates/jasper/certificado_normal_v1.jasper',
                'metadata_extra' => ['variante' => 'normal'],
            ],
            [
                'codigo' => 'PDF_CERTIFICADO_UPN_JASPER_V1',
                'tipo_documento' => 'certificado',
                'nombre' => 'Certificado UPN Jasper v1 (placeholder)',
                'descripcion' => 'Plantilla base Jasper para certificado UPN.',
                'ruta_template' => 'templates/jasper/certificado_upn_v1.jasper',
                'metadata_extra' => ['variante' => 'upn'],
            ],
            [
                'codigo' => 'PDF_TITULO_JASPER_V1',
                'tipo_documento' => 'titulo',
                'nombre' => 'Título Jasper v1 (placeholder)',
                'descripcion' => 'Plantilla base Jasper para título.',
                'ruta_template' => 'templates/jasper/titulo_normal_v1.jasper',
                'metadata_extra' => [],
            ],
            [
                'codigo' => 'PDF_GRADO_JASPER_V1',
                'tipo_documento' => 'grado',
                'nombre' => 'Grado Jasper v1 (placeholder)',
                'descripcion' => 'Plantilla base Jasper para grado.',
                'ruta_template' => 'templates/jasper/grado_normal_v1.jasper',
                'metadata_extra' => [],
            ],
        ];

        foreach ($filas as $fila) {
            PlantillaDocumento::updateOrCreate(
                ['codigo' => $fila['codigo']],
                [
                    'tipo_documento' => $fila['tipo_documento'],
                    'motor' => MotorDocumento::JASPER->value,
                    'version' => 1,
                    'nombre' => $fila['nombre'],
                    'descripcion' => $fila['descripcion'],
                    'ruta_template' => $fila['ruta_template'],
                    'parametros' => [
                        'motor_base' => MotorDocumento::JASPER->value,
                        'placeholder' => true,
                    ],
                    'metadata' => array_merge($meta, $fila['metadata_extra']),
                    'activo' => true,
                ]
            );
        }
    }
}
