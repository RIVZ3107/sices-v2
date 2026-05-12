<?php

declare(strict_types=1);

namespace Tests\Feature\Auth;

use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class RolesPermisosSicesTest extends TestCase
{
    use RefreshDatabase;

    private const ROLES_BASE = [
        'superadmin',
        'sistemas',
        'educacion_superior',
        'director_escuela',
        'control_escolar_escuela',
        'responsable_admision',
        'responsable_evaluacion',
        'responsable_certificacion_titulacion',
        'docente',
        'auditor',
        'alumno_egresado',
        'aspirante_preinscrito',
    ];

    public function test_existen_los_doce_roles_base(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);

        foreach (self::ROLES_BASE as $nombre) {
            $this->assertTrue(
                Role::query()->where('name', $nombre)->where('guard_name', 'web')->exists(),
                "Falta el rol: {$nombre}",
            );
        }
    }

    public function test_superadmin_tiene_todos_los_permisos(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);

        $total = Permission::query()->where('guard_name', 'web')->count();
        $user = User::factory()->create();
        $user->assignRole('superadmin');

        $this->assertSame($total, $user->getAllPermissions()->count());
    }

    public function test_sistemas_administra_menus_y_ve_logs_sin_asignar_matricula(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);

        $user = User::factory()->create();
        $user->assignRole('sistemas');

        $this->assertTrue($user->can('menus.administrar'));
        $this->assertTrue($user->can('logs.ver'));
        $this->assertTrue($user->can('apariencia_sistema.administrar'));
        $this->assertFalse($user->can('matriculas.asignar'));
        $this->assertFalse($user->can('asignar_matricula'));
    }

    public function test_control_escolar_puede_solicitar_matricula_y_no_asignarla(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);

        $user = User::factory()->create();
        $user->assignRole('control_escolar_escuela');

        $this->assertTrue(
            $user->can('crear_solicitud_matricula') || $user->can('solicitudes_matricula.crear'),
        );
        $this->assertTrue(
            $user->can('enviar_solicitud_matricula') || $user->can('solicitudes_matricula.enviar'),
        );
        $this->assertFalse($user->can('matriculas.asignar'));
        $this->assertFalse($user->can('asignar_matricula'));
        $this->assertFalse($user->can('aprobar_solicitud_matricula'));
        $this->assertFalse($user->can('solicitudes_matricula.aprobar'));
        $this->assertFalse($user->can('rechazar_solicitud_matricula'));
        $this->assertFalse($user->can('solicitudes_matricula.rechazar'));
        $this->assertFalse($user->can('documentos.validar_normativamente'));
        $this->assertFalse($user->can('logs.ver'));
        $this->assertFalse($user->can('xml.generar'));
        $this->assertTrue($user->can('notificaciones.ver'));
        $this->assertTrue($user->can('reinscripciones.ver'));
        $this->assertFalse($user->can('menus.administrar'));
    }

    public function test_director_escuela_supervision_sin_matricula_ni_tecnica(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);

        $user = User::factory()->create();
        $user->assignRole('director_escuela');

        $this->assertTrue($user->can('expedientes.revisar'));
        $this->assertTrue($user->can('inscripciones.revisar'));
        $this->assertTrue($user->can('notificaciones.ver'));
        $this->assertTrue($user->can('autorizaciones.ver'));
        $this->assertFalse($user->can('matriculas.asignar'));
        $this->assertFalse($user->can('calificaciones.capturar'));
        $this->assertFalse($user->can('integraciones.configurar'));
        $this->assertFalse($user->can('menus.administrar'));
        $this->assertFalse($user->can('apariencia_sistema.administrar'));
        $this->assertFalse($user->can('documentos.validar_normativamente'));
        $this->assertTrue($user->can('inscripciones.autorizar_excepcion'));
        $this->assertTrue($user->can('reinscripciones.autorizar_excepcion'));
    }

    public function test_educacion_superior_puede_asignar_matricula(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);

        $user = User::factory()->create();
        $user->assignRole('educacion_superior');

        $this->assertTrue($user->can('matriculas.asignar') || $user->can('asignar_matricula'));
        $this->assertTrue($user->can('validaciones_normativas.ver'));
        $this->assertTrue($user->can('reportes_oficiales.ver'));
        $this->assertFalse($user->can('xml.generar'));
        $this->assertFalse($user->can('firma.ejecutar'));
        $this->assertFalse($user->can('jobs.ver'));
        $this->assertFalse($user->can('logs.ver'));
        $this->assertFalse($user->can('menus.administrar'));
        $this->assertFalse($user->can('apariencia_sistema.administrar'));
        $this->assertFalse($user->can('roles.administrar'));
        $this->assertFalse($user->can('permisos.administrar'));
        $this->assertFalse($user->can('integraciones.configurar'));
        $this->assertFalse($user->can('ver_claves_legacy_catalogos'));
    }

    public function test_auditor_no_puede_modificar_datos_operativos(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);

        $user = User::factory()->create();
        $user->assignRole('auditor');

        $this->assertFalse($user->can('gestionar_alumnos'));
        $this->assertFalse($user->can('alumnos.crear'));
        $this->assertFalse($user->can('alumnos.editar'));
        $this->assertFalse($user->can('crear_documentos'));
        $this->assertFalse($user->can('editar_documentos'));
        $this->assertFalse($user->can('aprobar_documentos'));
        $this->assertFalse($user->can('asignar_matricula'));
        $this->assertFalse($user->can('firma.ejecutar'));
    }

    public function test_docente_no_ve_expediente_institucional_completo(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);

        $user = User::factory()->create();
        $user->assignRole('docente');

        $this->assertFalse($user->can('ver_alumnos'));
        $this->assertFalse($user->can('expedientes.ver'));
        $this->assertTrue($user->can('calificaciones.capturar_propias'));
    }

    public function test_alumno_egresado_solo_portal_y_expediente_propio(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);

        $user = User::factory()->create();
        $user->assignRole('alumno_egresado');

        $this->assertTrue($user->can('portal.ver'));
        $this->assertTrue($user->can('expediente.ver_propio'));
        $this->assertFalse($user->can('expedientes.ver'));
    }

    public function test_aspirante_solo_admision_propia(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);

        $user = User::factory()->create();
        $user->assignRole('aspirante_preinscrito');

        $this->assertTrue($user->can('admision.portal'));
        $this->assertTrue($user->can('aspirantes.registro_propio'));
        $this->assertFalse($user->can('aspirantes.crear'));
        $this->assertFalse($user->can('expedientes.ver'));
    }

    public function test_responsable_certificacion_sin_firma_ejecutar_por_defecto(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);

        $user = User::factory()->create();
        $user->assignRole('responsable_certificacion_titulacion');

        $this->assertTrue($user->can('certificacion.ver'));
        $this->assertFalse($user->can('firma.ejecutar'));
    }

    public function test_seeder_es_idempotente_sin_duplicar_permisos(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);
        $primero = Permission::query()->where('guard_name', 'web')->count();

        $this->seed(RolesAndPermissionsSeeder::class);
        $segundo = Permission::query()->where('guard_name', 'web')->count();

        $this->assertSame($primero, $segundo);
    }
}
