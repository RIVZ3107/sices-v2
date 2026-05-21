<?php

declare(strict_types=1);

namespace Tests\Feature\Sistemas;

use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SistemasConfiguracionGlobalTest extends TestCase
{
    use RefreshDatabase;

    public function test_sistemas_puede_ver_y_editar_configuracion_global_modular(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);

        $user = User::factory()->create();
        $user->assignRole('sistemas');

        $this->assertTrue($user->can('configuracion_global.ver'));
        $this->assertTrue($user->can('configuracion_global.editar'));
        $this->assertTrue($user->can('configuracion.ver'));
    }
}
