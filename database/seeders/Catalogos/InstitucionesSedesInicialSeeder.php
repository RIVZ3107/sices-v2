<?php

declare(strict_types=1);

namespace Database\Seeders\Catalogos;

use App\Models\Institucion;
use App\Models\Sede;
use App\Models\Subsistema;
use Illuminate\Database\Seeder;

/**
 * Catálogo inicial UPN: institución nacional + sedes por CCT (unidades).
 */
final class InstitucionesSedesInicialSeeder extends Seeder
{
    public function run(): void
    {
        $upn = Subsistema::query()->where('clave', 'UPN')->firstOrFail();

        $institucion = Institucion::query()->updateOrCreate(
            ['clave' => 'UPN_NACIONAL'],
            [
                'subsistema_id' => $upn->id,
                'region_id' => null,
                'nombre' => 'UNIVERSIDAD PEDAGÓGICA NACIONAL',
                'nombre_corto' => 'UPN',
                'activo' => true,
                'metadata' => ['origen' => 'catalogo_inicial_upn'],
            ],
        );

        $sedes = [
            [
                'clave' => '15DUP0001I',
                'nombre' => 'UNIVERSIDAD PEDAGÓGICA NACIONAL UNIDAD 151 TOLUCA',
                'metadata' => [
                    'origen' => 'catalogo_inicial_upn',
                    'validar_cct_visualmente' => true,
                    'nota_cct' => 'Confundible I vs 1; validar contra catálogo oficial antes de producción.',
                ],
            ],
            [
                'clave' => '15DUP0002K',
                'nombre' => 'UNIVERSIDAD PEDAGÓGICA NACIONAL UNIDAD 152 ATIZAPÁN',
                'metadata' => ['origen' => 'catalogo_inicial_upn'],
            ],
            [
                'clave' => '15DUP0003J',
                'nombre' => 'UNIVERSIDAD PEDAGÓGICA NACIONAL UNIDAD 153 ECATEPEC',
                'metadata' => ['origen' => 'catalogo_inicial_upn'],
            ],
        ];

        foreach ($sedes as $row) {
            Sede::query()->updateOrCreate(
                [
                    'institucion_id' => $institucion->id,
                    'clave' => $row['clave'],
                ],
                [
                    'region_id' => null,
                    'nombre' => $row['nombre'],
                    'nombre_corto' => null,
                    'activo' => true,
                    'metadata' => $row['metadata'],
                ],
            );
        }
    }
}
