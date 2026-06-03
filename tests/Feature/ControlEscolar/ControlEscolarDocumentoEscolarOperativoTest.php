<?php

declare(strict_types=1);

namespace Tests\Feature\ControlEscolar;

use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ControlEscolarDocumentoEscolarOperativoTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_usuario_sin_permiso_no_puede_listar_documentos(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user, 'sanctum');

        $this->getJson('/api/v1/control-escolar/documentos')->assertForbidden();
    }

    public function test_control_escolar_puede_consultar_resumen_e_index(): void
    {
        $user = $this->usuarioControlEscolar();

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/control-escolar/documentos')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['data' => ['data', 'meta', 'actualizado_en']]);

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/control-escolar/documentos/resumen')
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'data' => [
                    'solicitudes_en_captura',
                    'enviadas_validacion',
                    'observadas',
                    'autorizadas_generadas',
                    'rechazadas_canceladas',
                ],
            ]);
    }

    public function test_tipos_autorizados_filtra_por_rol(): void
    {
        $user = $this->usuarioControlEscolar();

        $res = $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/control-escolar/documentos/tipos-autorizados')
            ->assertOk();

        $tipos = collect($res->json('data'))->pluck('codigo')->all();
        $this->assertContains('constancia', $tipos);
        $this->assertNotContains('titulo', $tipos);
    }

    public function test_crear_solicitud_exige_alumno_valido(): void
    {
        $user = $this->usuarioControlEscolar();

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/control-escolar/documentos', [])
            ->assertStatus(422);
    }

    public function test_exportar_respeta_permiso(): void
    {
        $user = $this->usuarioControlEscolar();
        $user->revokePermissionTo('documentos.exportar');

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/control-escolar/documentos/exportar')
            ->assertForbidden();
    }

    protected function usuarioControlEscolar(): User
    {
        $user = User::factory()->create();
        $user->assignRole('control_escolar_escuela');

        return $user;
    }
}
