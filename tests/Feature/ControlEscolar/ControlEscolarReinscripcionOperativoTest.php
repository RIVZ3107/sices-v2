<?php

declare(strict_types=1);

namespace Tests\Feature\ControlEscolar;

use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

final class ControlEscolarReinscripcionOperativoTest extends TestCase
{
    use RefreshDatabase;

    public function test_usuario_sin_permiso_no_puede_listar_reinscripciones(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->getJson('/api/v1/control-escolar/reinscripciones')->assertForbidden();
    }

    public function test_control_escolar_puede_listar_reinscripciones(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);
        $user = User::factory()->create();
        $user->assignRole('control_escolar_escuela');
        Sanctum::actingAs($user);

        $this->getJson('/api/v1/control-escolar/reinscripciones')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'data' => ['metricas', 'listado' => ['data', 'meta'], 'motivos_bloqueo', 'flujo'],
            ]);
    }

    public function test_desbloquear_exige_motivo_y_comentario(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);
        $user = User::factory()->create();
        $user->assignRole('control_escolar_escuela');
        Sanctum::actingAs($user);

        $this->postJson('/api/v1/control-escolar/reinscripciones/1/desbloquear', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['motivo', 'comentario']);
    }

    public function test_exportar_requiere_permiso(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $this->get('/api/v1/control-escolar/reinscripciones/exportar')->assertForbidden();
    }
}
