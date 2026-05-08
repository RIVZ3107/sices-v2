<?php

declare(strict_types=1);

namespace Database\Seeders\Catalogos;

use App\Models\Institucion;
use App\Models\Region;
use App\Models\Subsistema;
use Illuminate\Database\Seeder;
use RuntimeException;

final class InstitucionesLegacyBaseSeeder extends Seeder
{
    public function run(): void
    {
        $upn = Subsistema::query()->where('clave', 'UPN')->first();
        $normal = Subsistema::query()->where('clave', 'NORMAL')->first();
        if ($upn === null || $normal === null) {
            throw new RuntimeException('Subsistemas UPN/NORMAL no disponibles para cargar instituciones legacy base.');
        }

        $regionUpn = Region::query()->firstOrCreate(
            ['subsistema_id' => $upn->id, 'clave' => 'REG-UPN-LEGACY'],
            ['nombre' => 'REGIÓN UPN LEGACY', 'activo' => true]
        );
        $regionNormal = Region::query()->firstOrCreate(
            ['subsistema_id' => $normal->id, 'clave' => 'REG-NORMAL-LEGACY'],
            ['nombre' => 'REGIÓN NORMAL LEGACY', 'activo' => true]
        );

        $rows = [
            ['clave' => '150005', 'nombre' => 'UNIVERSIDAD PEDAGÓGICA NACIONAL UNIDAD 151 TOLUCA', 'subsistema_id' => $upn->id, 'region_id' => $regionUpn->id],
            ['clave' => '150474', 'nombre' => 'UNIVERSIDAD PEDAGÓGICA NACIONAL UNIDAD 152 ATIZAPÁN', 'subsistema_id' => $upn->id, 'region_id' => $regionUpn->id],
            ['clave' => '150475', 'nombre' => 'UNIVERSIDAD PEDAGÓGICA NACIONAL UNIDAD 153 ECATEPEC', 'subsistema_id' => $upn->id, 'region_id' => $regionUpn->id],
            ['clave' => '150162', 'nombre' => 'ESCUELA NORMAL SUPERIOR DEL VALLE DE TOLUCA', 'subsistema_id' => $normal->id, 'region_id' => $regionNormal->id],
            ['clave' => '150340', 'nombre' => 'ESCUELA NORMAL SUPERIOR DEL VALLE DE MÉXICO', 'subsistema_id' => $normal->id, 'region_id' => $regionNormal->id],
            ['clave' => '150012', 'nombre' => 'ESCUELA NORMAL RURAL "LÁZARO CÁRDENAS DEL RÍO"', 'subsistema_id' => $normal->id, 'region_id' => $regionNormal->id],
        ];

        foreach ($rows as $row) {
            Institucion::query()->updateOrCreate(
                ['clave' => $row['clave']],
                [
                    'subsistema_id' => $row['subsistema_id'],
                    'region_id' => $row['region_id'],
                    'nombre' => $row['nombre'],
                    'nombre_corto' => null,
                    'activo' => true,
                    'metadata' => [
                        'origen' => 'catalogo_legacy_e11instituciones',
                        'legacy' => [
                            'rcve_institucion' => (int) $row['clave'],
                        ],
                    ],
                ]
            );
        }
    }
}
