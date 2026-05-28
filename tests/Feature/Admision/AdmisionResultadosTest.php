<?php

declare(strict_types=1);

namespace Tests\Feature\Admision;

use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdmisionResultadosTest extends TestCase
{
    use RefreshDatabase;

    public function test_responsable_admision_puede_publicar_resultados_sin_crear_matricula_ni_firma(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);

        $user = User::factory()->create();
        $user->assignRole('responsable_admision');

        $this->assertTrue($user->can('admision.ver'));
        $this->assertTrue($user->can('admision.aprobar'));
        $this->assertFalse($user->can('matriculas.asignar'));
        $this->assertFalse($user->can('asignar_matricula'));
        $this->assertFalse($user->can('firma.ejecutar'));
        $this->assertFalse($user->can('xml.generar'));
        $this->assertFalse($user->can('folios.asignar'));
        $this->assertFalse($user->can('roles.administrar'));
        $this->assertFalse($user->can('menus.administrar'));
    }
}
