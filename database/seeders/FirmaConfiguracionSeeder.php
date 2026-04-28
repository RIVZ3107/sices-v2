<?php

namespace Database\Seeders;

use App\Enums\Certificacion\ProveedorFirma;
use App\Models\FirmaConfiguracion;
use Illuminate\Database\Seeder;

class FirmaConfiguracionSeeder extends Seeder
{
    public function run(): void
    {
        $metaBase = [
            'modo' => 'simulado',
            'estado_validacion' => 'pendiente_contrato_since_service',
            'requiere_revision_senior' => true,
            'advertencia' => 'Sin integración real; no usar en producción sin configuración oficial.',
        ];

        $filas = [
            [
                'tipo_documento' => 'certificado',
                'version_firma' => 'SIM_V1_CERT_NORMAL',
                'metadata_extra' => ['variante' => 'normal'],
            ],
            [
                'tipo_documento' => 'certificado',
                'version_firma' => 'SIM_V1_CERT_UPN',
                'metadata_extra' => ['variante' => 'upn'],
            ],
            [
                'tipo_documento' => 'titulo',
                'version_firma' => 'SIM_V1_TITULO',
                'metadata_extra' => [],
            ],
            [
                'tipo_documento' => 'grado',
                'version_firma' => 'SIM_V1_GRADO',
                'metadata_extra' => [],
            ],
        ];

        foreach ($filas as $fila) {
            FirmaConfiguracion::updateOrCreate(
                [
                    'tipo_documento' => $fila['tipo_documento'],
                    'proveedor' => ProveedorFirma::SIMULADO->value,
                    'version_firma' => $fila['version_firma'],
                ],
                [
                    'endpoint' => null,
                    'metodo' => 'POST',
                    'timeout' => 30,
                    'requiere_xml_previo' => true,
                    'requiere_cadena_original' => true,
                    'requiere_sello_local' => false,
                    'requiere_firmante' => true,
                    'headers' => null,
                    'parametros' => [
                        'ambiente' => 'simulado',
                        'sin_endpoint_real' => true,
                    ],
                    'metadata' => array_merge($metaBase, $fila['metadata_extra']),
                    'estatus' => 'pruebas',
                ]
            );
        }
    }
}
