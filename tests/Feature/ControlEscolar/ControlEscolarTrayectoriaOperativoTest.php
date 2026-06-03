<?php

declare(strict_types=1);

namespace Tests\Feature\ControlEscolar;

use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

final class ControlEscolarTrayectoriaOperativoTest extends TestCase
{
    use RefreshDatabase;

    public function test_usuario_sin_permiso_no_puede_buscar_trayectoria(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->getJson('/api/v1/control-escolar/trayectoria/alumnos/buscar?search=test')
            ->assertForbidden();
    }

    public function test_control_escolar_puede_buscar_alumnos_trayectoria(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);
        $user = User::factory()->create();
        $user->assignRole('control_escolar_escuela');
        Sanctum::actingAs($user);

        $this->getJson('/api/v1/control-escolar/trayectoria/alumnos/buscar?search=xyz')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['data' => ['data', 'meta']]);
    }

    public function test_resumen_alumno_inexistente_devuelve_404(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);
        $user = User::factory()->create();
        $user->assignRole('control_escolar_escuela');
        Sanctum::actingAs($user);

        $this->getJson('/api/v1/control-escolar/trayectoria/alumnos/99999/resumen')
            ->assertNotFound()
            ->assertJsonPath('code', 'TRAYECTORIA_ALUMNO_NO_ENCONTRADO');
    }

    public function test_exportar_requiere_permiso(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->get('/api/v1/control-escolar/trayectoria/alumnos/1/exportar')->assertForbidden();
    }

    public function test_legacy_trayectoria_sigue_disponible(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);
        $user = User::factory()->create();
        $user->assignRole('control_escolar_escuela');
        Sanctum::actingAs($user);

        $this->getJson('/api/v1/control-escolar/trayectoria')
            ->assertOk()
            ->assertJsonPath('ok', true);
    }
}
