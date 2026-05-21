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

        $this->assertTrue($user->can('admision.aspirantes.ver'));
        $this->assertTrue($user->can('admision.aspirantes.crear'));
        $this->assertTrue($user->can('admision.aspirantes.exportar'));
        $this->assertTrue($user->can('admision.expedientes.observar'));
        $this->assertTrue($user->can('admision.evaluaciones.registrar_resultado'));
        $this->assertFalse($user->can('matriculas.asignar'));

        $demo = (string) file_get_contents(base_path('resources/js/data/admisionDemoData.js'));
        $this->assertStringContainsString('Licenciatura en Pedagogía', $demo);
        $this->assertStringContainsString('Universidad Pedagógica Nacional Unidad 151 Toluca', $demo);
        $this->assertStringNotContainsString('Ingeniería en Sistemas', $demo);
        $this->assertStringNotContainsString('Universidad Tecnológica Metropolitana', $demo);
    }
}
