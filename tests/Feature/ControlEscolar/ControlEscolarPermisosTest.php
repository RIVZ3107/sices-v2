<?php

declare(strict_types=1);

namespace Tests\Feature\ControlEscolar;

use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

final class ControlEscolarPermisosTest extends TestCase
{
    use RefreshDatabase;

    public function test_control_escolar_no_tiene_permisos_tecnicos_ni_matricula_directa(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);

        $user = User::factory()->create();
        $user->assignRole('control_escolar_escuela');
        Sanctum::actingAs($user);

        foreach ([
            'matriculas.asignar',
            'solicitudes_matricula.aprobar',
            'solicitudes_matricula.rechazar',
            'validaciones_normativas.aprobar',
            'xml.generar',
            'firma.ejecutar',
            'jobs.ver',
            'logs.ver',
            'menus.administrar',
            'apariencia_sistema.administrar',
            'roles.administrar',
            'permisos.administrar',
        ] as $perm) {
            $this->assertFalse($user->can($perm), "No debe poder: {$perm}");
        }
    }

    public function test_control_escolar_tiene_permisos_operativos_clave(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);

        $user = User::factory()->create();
        $user->assignRole('control_escolar_escuela');

        $this->assertTrue($user->can('alumnos.ver'));
        $this->assertTrue($user->can('expedientes.ver'));
        $this->assertTrue($user->can('inscripciones.ver'));
        $this->assertTrue($user->can('reinscripciones.ver'));
        $this->assertTrue($user->can('trayectoria.ver'));
        $this->assertTrue($user->can('calificaciones.ver'));
        $this->assertTrue($user->can('documentos.ver'));
        $this->assertTrue($user->can('importaciones_academicas.ver'));
        $this->assertTrue($user->can('observaciones.ver'));
        $this->assertTrue($user->can('reportes.ver'));
        $this->assertTrue($user->can('notificaciones.ver'));
    }
}
