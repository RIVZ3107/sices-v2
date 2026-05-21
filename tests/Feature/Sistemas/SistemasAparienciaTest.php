<?php

declare(strict_types=1);

namespace Tests\Feature\Sistemas;

use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SistemasAparienciaTest extends TestCase
{
    use RefreshDatabase;

    public function test_sistemas_puede_consultar_apariencia_actual(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);

        $user = User::factory()->create();
        $user->assignRole('sistemas');
        Sanctum::actingAs($user);

        $this->assertTrue($user->can('apariencia_sistema.editar'));
        $this->getJson('/api/v1/sistema/apariencia/actual')->assertOk();
    }
}
