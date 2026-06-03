<?php

declare(strict_types=1);

namespace Tests\Feature\ControlEscolar;

use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ControlEscolarBajaCambioOperativoTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_usuario_sin_permiso_no_puede_listar(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/control-escolar/bajas-cambios')
            ->assertForbidden();
    }

    public function test_control_escolar_puede_consultar_index_y_resumen(): void
    {
        $user = User::factory()->create();
        $user->assignRole('control_escolar_escuela');

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/control-escolar/bajas-cambios')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['data' => ['data', 'meta']]);

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/control-escolar/bajas-cambios/resumen')
            ->assertOk()
            ->assertJsonStructure(['data' => ['bajas_temporales', 'cambios_pendientes']]);
    }

    public function test_flujo_y_riesgo_responden(): void
    {
        $user = User::factory()->create();
        $user->assignRole('control_escolar_escuela');

        $this->actingAs($user, 'sanctum')->getJson('/api/v1/control-escolar/bajas-cambios/flujo')->assertOk();
        $this->actingAs($user, 'sanctum')->getJson('/api/v1/control-escolar/bajas-cambios/riesgo-operativo')->assertOk();
    }

    public function test_crear_requiere_campos(): void
    {
        $user = User::factory()->create();
        $user->assignRole('control_escolar_escuela');

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/control-escolar/bajas-cambios', [])
            ->assertStatus(422);
    }
}
