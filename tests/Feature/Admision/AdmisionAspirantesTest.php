<?php

declare(strict_types=1);

namespace Tests\Feature\Admision;

use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdmisionAspirantesTest extends TestCase
{
    use RefreshDatabase;

    public function test_responsable_admision_puede_crear_y_exportar_aspirantes_sin_matricula(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);

        $user = User::factory()->create();
        $user->assignRole('responsable_admision');

        // Permisos reales del rol en SicesPermissionsCatalog (no admision.* granular aún).
        $this->assertTrue($user->can('aspirantes.ver'));
        $this->assertTrue($user->can('aspirantes.crear'));
        $this->assertTrue($user->can('admision.ver'));
        $this->assertTrue($user->can('expedientes.ver'));
        $this->assertTrue($user->can('observaciones.crear'));
        $this->assertFalse($user->can('matriculas.asignar'));
        $this->assertFalse($user->can('firma.ejecutar'));

        $demo = (string) file_get_contents(base_path('resources/js/data/admisionDemoData.js'));
        $this->assertStringContainsString('Licenciatura en Pedagogía', $demo);
        $this->assertStringContainsString('Universidad Pedagógica Nacional Unidad 151 Toluca', $demo);
        $this->assertStringNotContainsString('Ingeniería en Sistemas', $demo);
        $this->assertStringNotContainsString('Universidad Tecnológica Metropolitana', $demo);
    }
}
