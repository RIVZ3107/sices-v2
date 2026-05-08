<?php

declare(strict_types=1);

namespace Tests\Feature\Catalogos;

use App\Models\EntidadFederativa;
use Database\Seeders\EntidadFederativaSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class EntidadFederativaSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_importa_32_entidades_y_es_idempotente(): void
    {
        $this->seed(EntidadFederativaSeeder::class);

        $this->assertSame(32, EntidadFederativa::query()->activos()->count());

        $edomex = EntidadFederativa::query()->find(15);
        $this->assertNotNull($edomex);
        $this->assertSame('MEX', strtoupper(trim((string) $edomex?->abreviatura)));

        $cdmx = EntidadFederativa::query()->find(9);
        $this->assertNotNull($cdmx);

        $this->assertSame(
            0,
            EntidadFederativa::query()
                ->whereRaw('abreviatura != TRIM(abreviatura)')
                ->count(),
            'Las abreviaturas no deben tener espacios sobrantes.'
        );

        $this->seed(EntidadFederativaSeeder::class);

        $this->assertSame(32, EntidadFederativa::query()->count());

        $duplicadosClave = DB::table('entidades_federativas')
            ->select('clave_entidad', DB::raw('COUNT(*) as c'))
            ->groupBy('clave_entidad')
            ->having('c', '>', 1)
            ->count();
        $this->assertSame(0, $duplicadosClave);
    }
}
