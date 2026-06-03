<?php

declare(strict_types=1);

namespace Tests\Feature\ControlEscolar;

use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

final class ControlEscolarCalificacionOperativoTest extends TestCase
{
    use RefreshDatabase;

    public function test_usuario_sin_permiso_no_puede_listar_calificaciones(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->getJson('/api/v1/control-escolar/calificaciones')->assertForbidden();
    }

    public function test_control_escolar_puede_listar_calificaciones(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);
        $user = User::factory()->create();
        $user->assignRole('control_escolar_escuela');
        Sanctum::actingAs($user);

        $this->getJson('/api/v1/control-escolar/calificaciones')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['data' => ['data', 'meta', 'ventana']]);
    }

    public function test_resumen_calificaciones(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);
        $user = User::factory()->create();
        $user->assignRole('control_escolar_escuela');
        Sanctum::actingAs($user);

        $this->getJson('/api/v1/control-escolar/calificaciones/resumen')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['data' => ['grupos_en_captura', 'avance_global', 'pendientes_captura']]);
    }

    public function test_exportar_requiere_permiso(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->get('/api/v1/control-escolar/calificaciones/exportar')->assertForbidden();
    }

    public function test_solicitar_correccion_exige_campos(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);
        $user = User::factory()->create();
        $user->assignRole('control_escolar_escuela');
        Sanctum::actingAs($user);

        $this->postJson('/api/v1/control-escolar/calificaciones/1/solicitar-correccion', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['motivo', 'descripcion']);
    }
}
