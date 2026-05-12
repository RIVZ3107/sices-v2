<?php

declare(strict_types=1);

namespace Tests\Feature\Direccion;

use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

final class DireccionEscuelaPermisosTest extends TestCase
{
    use RefreshDatabase;

    public function test_director_no_tiene_permisos_tecnicos_ni_matricula_ni_captura(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);

        $user = User::factory()->create();
        $user->assignRole('director_escuela');
        Sanctum::actingAs($user);

        foreach ([
            'matriculas.asignar',
            'solicitudes_matricula.aprobar',
            'calificaciones.capturar',
            'xml.generar',
            'firma.ejecutar',
            'jobs.ver',
            'logs.ver',
            'menus.administrar',
            'apariencia_sistema.administrar',
            'roles.administrar',
            'permisos.administrar',
            'documentos.validar_normativamente',
        ] as $perm) {
            $this->assertFalse($user->can($perm), "No debe poder: {$perm}");
        }
    }

    public function test_director_tiene_permisos_supervision_y_autorizacion(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);

        $user = User::factory()->create();
        $user->assignRole('director_escuela');

        $this->assertTrue($user->can('dashboard.ver'));
        $this->assertTrue($user->can('indicadores.ver'));
        $this->assertTrue($user->can('inscripciones.autorizar_excepcion'));
        $this->assertTrue($user->can('reinscripciones.autorizar_excepcion'));
        $this->assertTrue($user->can('correcciones_calificacion.autorizar'));
        $this->assertTrue($user->can('egreso.aprobar_institucionalmente'));
        $this->assertTrue($user->can('notificaciones.ver'));
    }
}
