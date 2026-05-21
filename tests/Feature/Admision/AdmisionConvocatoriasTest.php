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

        $this->assertTrue($user->can('admision.convocatorias.ver'));
        $this->assertTrue($user->can('admision.convocatorias.crear'));
        $this->assertTrue($user->can('admision.convocatorias.publicar'));
        $this->assertFalse($user->can('matriculas.asignar'));
    }
}
