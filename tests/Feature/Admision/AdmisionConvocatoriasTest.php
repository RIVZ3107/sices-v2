<?php

declare(strict_types=1);

namespace Tests\Feature\Admision;

use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdmisionConvocatoriasTest extends TestCase
{
    use RefreshDatabase;

    public function test_responsable_admision_puede_gestionar_convocatorias(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);

        $user = User::factory()->create();
        $user->assignRole('responsable_admision');

        $this->assertTrue($user->can('admision.ver'));
        $this->assertTrue($user->can('admision.revisar'));
        $this->assertTrue($user->can('admision.aprobar'));
        $this->assertFalse($user->can('matriculas.asignar'));
        $this->assertFalse($user->can('firma.ejecutar'));
    }
}
