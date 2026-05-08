<?php

declare(strict_types=1);

namespace Tests\Feature\Catalogos;

use App\Models\EntidadFederativa;
use App\Models\Municipio;
use Database\Seeders\EntidadFederativaSeeder;
use Database\Seeders\MunicipioSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class MunicipioSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_importa_solo_activos_y_es_idempotente(): void
    {
        $this->seed(EntidadFederativaSeeder::class);
        $this->seed(MunicipioSeeder::class);

        $this->assertSame(
            125,
            Municipio::query()->where('entidad_federativa_id', 15)->count(),
            'Deben existir exactamente 125 municipios para entidad 15.'
        );

        $clave001 = Municipio::query()
            ->where('entidad_federativa_id', 15)
            ->where('clave_municipio', '001')
            ->first();
        $this->assertNotNull($clave001);
        $this->assertSame('001', $clave001?->clave_municipio);

        $toluca = Municipio::query()
            ->where('entidad_federativa_id', 15)
            ->where('clave_municipio', '106')
            ->first();
        $this->assertNotNull($toluca);
        $this->assertSame('Toluca', $toluca?->nombre);

        $this->assertSame(
            0,
            Municipio::query()->where('entidad_federativa_id', 15)->where('estatus', '!=', 'activo')->count()
        );

        $this->assertTrue(
            EntidadFederativa::query()->whereKey(15)->exists(),
            'La entidad 15 debe existir para relacionar municipios.'
        );

        $this->assertNotNull($toluca?->entidadFederativa);

        $duplicados = DB::table('municipios')
            ->select('entidad_federativa_id', 'clave_municipio', DB::raw('COUNT(*) as c'))
            ->groupBy('entidad_federativa_id', 'clave_municipio')
            ->having('c', '>', 1)
            ->count();
        $this->assertSame(0, $duplicados);

        $this->assertSame(
            0,
            Municipio::query()
                ->where('entidad_federativa_id', 15)
                ->where('metadata->istatus_original', 'B')
                ->count()
        );

        $this->seed(MunicipioSeeder::class);

        $this->assertSame(
            125,
            Municipio::query()->where('entidad_federativa_id', 15)->count(),
            'No debe duplicar registros en segunda corrida.'
        );
    }
}
