<?php

declare(strict_types=1);

namespace Tests\Feature\Catalogos;

use App\Models\Institucion;
use App\Models\Sede;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SedesCatalogoApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    public function test_control_escolar_no_recibe_campos_legacy(): void
    {
        $user = User::factory()->create();
        $user->assignRole('control_escolar_escuela');
        Sanctum::actingAs($user);

        $res = $this->getJson('/api/v1/catalogos/sedes?search=U.P.N.')
            ->assertOk();

        $row = collect($res->json('data'))->first();
        $this->assertNotNull($row);
        $this->assertArrayNotHasKey('legacy_kcve_subsede', $row);
        $this->assertArrayNotHasKey('legacy_rcve_institucion', $row);
        $this->assertArrayNotHasKey('legacy_rcvect', $row);
        $this->assertArrayNotHasKey('metadata', $row);
    }

    public function test_superadmin_recibe_campos_legacy_con_permiso_tecnico(): void
    {
        $user = User::factory()->create();
        $user->assignRole('superadmin');
        Sanctum::actingAs($user);

        $res = $this->getJson('/api/v1/catalogos/sedes?search=U.P.N.')
            ->assertOk();
        $row = collect($res->json('data'))->firstWhere('legacy_kcve_subsede', 1);
        $this->assertNotNull($row);
        $this->assertSame(1, (int) $row['legacy_kcve_subsede']);
        $this->assertSame(150005, (int) $row['legacy_rcve_institucion']);
        $this->assertSame(7979, (int) $row['legacy_rcvect']);
    }

    public function test_rcvect_no_se_expone_como_cct_y_filtros_siguen_operando(): void
    {
        $user = User::factory()->create();
        $user->assignRole('superadmin');
        Sanctum::actingAs($user);

        $inst = Institucion::query()->where('clave', '150474')->firstOrFail();

        $res = $this->getJson('/api/v1/catalogos/sedes?institucion_id='.$inst->id.'&search=NICOLÁS')
            ->assertOk();
        $row = collect($res->json('data'))->first();
        $this->assertNotNull($row);
        $this->assertSame('REGIONAL NICOLÁS ROMERO', $row['nombre']);
        $this->assertNull($row['cct']);
        $this->assertSame(7980, (int) $row['legacy_rcvect']);

        $this->assertTrue(
            Sede::query()->where('nombre', 'REGIONAL NICOLÁS ROMERO')->exists()
        );
    }
}
