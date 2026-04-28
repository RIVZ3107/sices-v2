<?php

namespace Database\Seeders;

use App\Models\CadenaOriginalRegla;
use Illuminate\Database\Seeder;

class CadenaOriginalReglaSeeder extends Seeder
{
    public function run(): void
    {
        $pendienteMeta = [
            'estado_validacion' => 'pendiente_validacion_sep',
            'requiere_revision_senior' => true,
            'advertencia' => 'No validado contra SEP; solo placeholder para desarrollo.',
        ];

        $estructuraPlaceholder = [
            'nota' => 'Pendiente definición formal del orden de campos con validación senior SEP.',
            'orden_campos' => [],
            'version_schema' => '0-placeholder',
        ];

        $normalizacionBase = [
            'trim' => true,
            'uppercase' => true,
            'formato_fecha' => 'ISO_8601_o_dd_mm_yyyy',
            'remover_dobles_espacios' => true,
        ];

        $reglas = [
            [
                'codigo' => 'CERTIFICADO_NORMAL_V1',
                'tipo_documento' => 'certificado',
                'version' => 1,
                'descripcion' => 'Regla placeholder certificado modalidad normal (pendiente SEP).',
            ],
            [
                'codigo' => 'CERTIFICADO_UPN_V1',
                'tipo_documento' => 'certificado',
                'version' => 1,
                'descripcion' => 'Regla placeholder certificado UPN (pendiente SEP).',
            ],
            [
                'codigo' => 'TITULO_NORMAL_V1',
                'tipo_documento' => 'titulo',
                'version' => 1,
                'descripcion' => 'Regla placeholder título (pendiente SEP).',
            ],
            [
                'codigo' => 'GRADO_NORMAL_V1',
                'tipo_documento' => 'grado',
                'version' => 1,
                'descripcion' => 'Regla placeholder grado (pendiente SEP).',
            ],
        ];

        foreach ($reglas as $regla) {
            CadenaOriginalRegla::updateOrCreate(
                ['codigo' => $regla['codigo']],
                [
                    'tipo_documento' => $regla['tipo_documento'],
                    'version' => $regla['version'],
                    'descripcion' => $regla['descripcion'],
                    'estructura_campos' => $estructuraPlaceholder,
                    'normalizacion' => $normalizacionBase,
                    'activo' => true,
                    'metadata' => $pendienteMeta,
                ]
            );
        }
    }
}
