<?php

declare(strict_types=1);

namespace Tests\Feature\Sistemas;

use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SistemasJobsLogsAuditoriaTest extends TestCase
{
    use RefreshDatabase;

    public function test_sistemas_puede_jobs_logs_auditoria_e_incidencias_sin_restaurar_respaldos(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);

        $user = User::factory()->create();
        $user->assignRole('sistemas');

        $this->assertTrue($user->can('jobs.ver'));
        $this->assertTrue($user->can('jobs.ejecutar'));
        $this->assertTrue($user->can('jobs.reintentar'));
        $this->assertTrue($user->can('jobs.pausar'));
        $this->assertTrue($user->can('logs.ver'));
        $this->assertTrue($user->can('logs.descargar'));
        $this->assertTrue($user->can('auditoria.ver'));
        $this->assertTrue($user->can('auditoria.exportar'));
        $this->assertTrue($user->can('incidencias.ver'));
        $this->assertTrue($user->can('incidencias.resolver'));
        $this->assertFalse($user->can('respaldos.restaurar'));

        Sanctum::actingAs($user);
        $this->getJson('/api/v1/admin/menus')->assertOk();
    }
}
