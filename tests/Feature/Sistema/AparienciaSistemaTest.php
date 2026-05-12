<?php

declare(strict_types=1);

namespace Tests\Feature\Sistema;

use App\Models\ConfiguracionVisualAuditoria;
use App\Models\ConfiguracionVisualSistema;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Database\Seeders\Sistema\ConfiguracionVisualSistemaSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AparienciaSistemaTest extends TestCase
{
    use RefreshDatabase;

    private function seedBase(): User
    {
        $this->seed(RolesAndPermissionsSeeder::class);
        $this->seed(ConfiguracionVisualSistemaSeeder::class);

        $user = User::factory()->create();
        $user->assignRole('sistemas');

        return $user;
    }

    public function test_sistemas_puede_ver_configuracion_visual(): void
    {
        $user = $this->seedBase();
        Sanctum::actingAs($user);

        $this->getJson('/api/v1/sistema/apariencia/actual')->assertOk()->assertJsonPath('data.app_name', 'SICES v2');
    }

    public function test_sistemas_puede_editar_colores(): void
    {
        $user = $this->seedBase();
        $c = ConfiguracionVisualSistema::query()->firstOrFail();
        Sanctum::actingAs($user);

        $this->putJson('/api/v1/sistema/apariencia/'.$c->id, [
            'primary_color' => '#112233',
        ])->assertOk();

        $this->assertSame('#112233', $c->fresh()->primary_color);
    }

    public function test_sistemas_puede_subir_logo(): void
    {
        Storage::fake('public');
        $user = $this->seedBase();
        $c = ConfiguracionVisualSistema::query()->firstOrFail();
        Sanctum::actingAs($user);

        $file = UploadedFile::fake()->image('logo.png', 10, 10);

        $this->postJson('/api/v1/sistema/apariencia/upload', [
            'campo' => 'logo_path',
            'file' => $file,
        ])->assertOk()->assertJsonStructure(['data' => ['path', 'url']]);
    }

    public function test_sistemas_puede_activar_configuracion(): void
    {
        $user = $this->seedBase();
        Sanctum::actingAs($user);

        $borrador = ConfiguracionVisualSistema::query()->create([
            'nombre_configuracion' => 'Otra',
            'activo' => false,
            'app_name' => 'SICES Test',
            'app_subtitle' => 'Sub',
            'primary_color' => '#0B5ED7',
            'secondary_color' => '#003B73',
            'accent_color' => '#00A3FF',
            'success_color' => '#198754',
            'warning_color' => '#FFC107',
            'danger_color' => '#DC3545',
            'info_color' => '#0DCAF0',
            'sidebar_bg_color' => '#001F3F',
            'sidebar_text_color' => '#FFFFFF',
            'topbar_bg_color' => '#FFFFFF',
            'content_bg_color' => '#F5F7FB',
            'card_radius' => '18px',
            'card_shadow' => 'soft',
            'font_family' => 'Inter, system-ui, sans-serif',
            'theme_mode' => 'institucional',
        ]);

        $this->postJson('/api/v1/sistema/apariencia/'.$borrador->id.'/activar')->assertOk();

        $this->assertTrue($borrador->fresh()->activo);
        $this->assertSame(1, ConfiguracionVisualSistema::query()->where('activo', true)->count());
    }

    public function test_control_escolar_no_puede_acceder_a_apariencia(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);
        $this->seed(ConfiguracionVisualSistemaSeeder::class);
        $u = User::factory()->create();
        $u->assignRole('control_escolar_escuela');
        Sanctum::actingAs($u);

        $this->getJson('/api/v1/sistema/apariencia')->assertForbidden();
    }

    public function test_auditor_no_puede_editar_apariencia(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);
        $this->seed(ConfiguracionVisualSistemaSeeder::class);
        $c = ConfiguracionVisualSistema::query()->firstOrFail();
        $u = User::factory()->create();
        $u->assignRole('auditor');
        Sanctum::actingAs($u);

        $this->putJson('/api/v1/sistema/apariencia/'.$c->id, [
            'primary_color' => '#000000',
        ])->assertForbidden();
    }

    public function test_alumno_no_puede_acceder_a_apariencia(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);
        $this->seed(ConfiguracionVisualSistemaSeeder::class);
        $u = User::factory()->create();
        $u->assignRole('alumno_egresado');
        Sanctum::actingAs($u);

        $this->getJson('/api/v1/sistema/apariencia/actual')->assertForbidden();
    }

    public function test_me_apariencia_devuelve_configuracion_activa(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);
        $this->seed(ConfiguracionVisualSistemaSeeder::class);
        $u = User::factory()->create();
        $u->assignRole('control_escolar_escuela');
        Sanctum::actingAs($u);

        $this->getJson('/api/v1/me/apariencia')
            ->assertOk()
            ->assertJsonPath('data.app_name', 'SICES v2')
            ->assertJsonPath('data.colors.primary', '#0B5ED7');
    }

    public function test_solo_hay_una_configuracion_activa(): void
    {
        $user = $this->seedBase();
        Sanctum::actingAs($user);

        $primera = ConfiguracionVisualSistema::query()->where('activo', true)->firstOrFail();
        $segunda = ConfiguracionVisualSistema::query()->create([
            'nombre_configuracion' => 'Segunda',
            'activo' => false,
            'app_name' => 'Otro nombre',
            'app_subtitle' => null,
            'primary_color' => '#0B5ED7',
            'secondary_color' => '#003B73',
            'accent_color' => '#00A3FF',
            'success_color' => '#198754',
            'warning_color' => '#FFC107',
            'danger_color' => '#DC3545',
            'info_color' => '#0DCAF0',
            'sidebar_bg_color' => '#001F3F',
            'sidebar_text_color' => '#FFFFFF',
            'topbar_bg_color' => '#FFFFFF',
            'content_bg_color' => '#F5F7FB',
            'card_radius' => '18px',
            'card_shadow' => 'soft',
            'font_family' => 'Inter, system-ui, sans-serif',
            'theme_mode' => 'institucional',
        ]);

        $this->postJson('/api/v1/sistema/apariencia/'.$segunda->id.'/activar')->assertOk();

        $this->assertFalse($primera->fresh()->activo);
        $this->assertTrue($segunda->fresh()->activo);
        $this->assertSame(1, ConfiguracionVisualSistema::query()->where('activo', true)->count());
    }

    public function test_cambios_se_auditan(): void
    {
        $user = $this->seedBase();
        $c = ConfiguracionVisualSistema::query()->firstOrFail();
        Sanctum::actingAs($user);

        $antes = ConfiguracionVisualAuditoria::query()->count();

        $this->putJson('/api/v1/sistema/apariencia/'.$c->id, [
            'app_subtitle' => 'Nuevo subtítulo',
        ])->assertOk();

        $this->assertGreaterThan($antes, ConfiguracionVisualAuditoria::query()->count());
        $this->assertTrue(
            ConfiguracionVisualAuditoria::query()->where('evento', 'apariencia_sistema.actualizada')->exists(),
        );
    }

    public function test_colores_en_formato_hex_valido(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);
        $this->seed(ConfiguracionVisualSistemaSeeder::class);
        $u = User::factory()->create();
        $u->assignRole('control_escolar_escuela');
        Sanctum::actingAs($u);

        $hex = '/^#[0-9A-Fa-f]{6}$/';
        $res = $this->getJson('/api/v1/me/apariencia')->assertOk();
        $primary = $res->json('data.colors.primary');
        $this->assertIsString($primary);
        $this->assertMatchesRegularExpression($hex, $primary);
    }
}
