<?php

declare(strict_types=1);

namespace Tests\Feature\Admision;

use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdmisionPreinscripcionesTest extends TestCase
{
    use RefreshDatabase;

    public function test_responsable_admision_puede_validar_preinscripciones(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);

        $user = User::factory()->create();
        $user->assignRole('responsable_admision');

        $this->assertTrue($user->can('admision.ver'));
        $this->assertTrue($user->can('admision.revisar'));
        $this->assertTrue($user->can('admision.rechazar'));
        $this->assertFalse($user->can('xml.generar'));
        $this->assertFalse($user->can('firma.ejecutar'));
    }
}
