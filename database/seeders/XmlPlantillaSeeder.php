<?php

namespace Database\Seeders;

use App\Models\XmlPlantilla;
use Illuminate\Database\Seeder;

class XmlPlantillaSeeder extends Seeder
{
    public function run(): void
    {
        $meta = [
            'estado_validacion' => 'pendiente_validacion_sep',
            'requiere_revision_senior' => true,
            'advertencia' => 'Estructura XML no validada ante SEP; uso solo desarrollo.',
        ];

        $plantillas = [
            [
                'codigo' => 'XML_CERTIFICADO_NORMAL_V1',
                'tipo_documento' => 'certificado',
                'version' => 1,
                'namespace' => null,
                'schema_location' => null,
                'descripcion_interna' => 'Placeholder XML certificado normal.',
            ],
            [
                'codigo' => 'XML_CERTIFICADO_UPN_V1',
                'tipo_documento' => 'certificado',
                'version' => 1,
                'namespace' => null,
                'schema_location' => null,
                'descripcion_interna' => 'Placeholder XML certificado UPN.',
            ],
            [
                'codigo' => 'XML_TITULO_NORMAL_V1',
                'tipo_documento' => 'titulo',
                'version' => 1,
                'namespace' => null,
                'schema_location' => null,
                'descripcion_interna' => 'Placeholder XML título.',
            ],
            [
                'codigo' => 'XML_GRADO_NORMAL_V1',
                'tipo_documento' => 'grado',
                'version' => 1,
                'namespace' => null,
                'schema_location' => null,
                'descripcion_interna' => 'Placeholder XML grado.',
            ],
        ];

        foreach ($plantillas as $row) {
            XmlPlantilla::updateOrCreate(
                ['codigo' => $row['codigo']],
                [
                    'tipo_documento' => $row['tipo_documento'],
                    'version' => $row['version'],
                    'namespace' => $row['namespace'],
                    'schema_location' => $row['schema_location'],
                    'estructura' => [
                        'nodos' => [],
                        'nota' => $row['descripcion_interna'],
                    ],
                    'validaciones' => [
                        'pre_generacion' => [],
                        'pendiente_revision_senior' => true,
                    ],
                    'activo' => true,
                    'metadata' => $meta,
                ]
            );
        }
    }
}
