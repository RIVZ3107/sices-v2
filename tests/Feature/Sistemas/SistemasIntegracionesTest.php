<?php

declare(strict_types=1);

namespace Tests\Feature\Sistemas;

use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SistemasIntegracionesTest extends TestCase
{
    use RefreshDatabase;

    public function test_sistemas_puede_configurar_y_probar_integraciones(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);

        $user = User::factory()->create();
        $user->assignRole('sistemas');

        $this->assertTrue($user->can('integraciones.ver'));
        $this->assertTrue($user->can('integraciones.configurar'));
        $this->assertTrue($user->can('integraciones.probar'));
    }
}
