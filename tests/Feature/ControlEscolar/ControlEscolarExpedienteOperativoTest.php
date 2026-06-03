<?php

declare(strict_types=1);

namespace Tests\Feature\ControlEscolar;

use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

final class ControlEscolarExpedienteOperativoTest extends TestCase
{
    use RefreshDatabase;

    public function test_usuario_sin_permiso_no_puede_listar_expedientes(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->getJson('/api/v1/control-escolar/expedientes')->assertForbidden();
    }

    public function test_control_escolar_puede_listar_expedientes_y_resumen(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);
        $user = User::factory()->create();
        $user->assignRole('control_escolar_escuela');
        Sanctum::actingAs($user);

        $list = $this->getJson('/api/v1/control-escolar/expedientes');
        $list->assertOk();
        $list->assertJsonPath('success', true);
        $list->assertJsonStructure([
            'data' => [
                'metricas',
                'listado' => ['data', 'meta'],
                'documentos_requeridos',
                'actividad_reciente',
            ],
        ]);

        $resumen = $this->getJson('/api/v1/control-escolar/expedientes/resumen');
        $resumen->assertOk();
        $resumen->assertJsonStructure([
            'data' => [
                'expedientes_pendientes',
                'completos',
                'con_observaciones',
                'documentos_faltantes',
                'total_en_alcance',
            ],
        ]);
    }

    public function test_observar_expediente_exige_motivo(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);
        $user = User::factory()->create();
        $user->assignRole('control_escolar_escuela');
        Sanctum::actingAs($user);

        $this->postJson('/api/v1/control-escolar/expedientes/1/observar', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['motivo']);
    }

    public function test_observar_masivo_exige_motivo(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);
        $user = User::factory()->create();
        $user->assignRole('control_escolar_escuela');
        Sanctum::actingAs($user);

        $this->postJson('/api/v1/control-escolar/expedientes/observar-masivo', ['ids' => [1]])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['motivo']);
    }

    public function test_exportar_requiere_permiso(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->get('/api/v1/control-escolar/expedientes/exportar')->assertForbidden();
    }

    public function test_control_escolar_puede_exportar(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);
        $user = User::factory()->create();
        $user->assignRole('control_escolar_escuela');
        Sanctum::actingAs($user);

        $this->get('/api/v1/control-escolar/expedientes/exportar')
            ->assertOk()
            ->assertHeader('content-type', 'text/csv; charset=UTF-8');
    }
}
