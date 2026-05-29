<?php

declare(strict_types=1);

namespace Tests\Feature\Menus;

use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Database\Seeders\SystemMenusSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MenuPorRolTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Una sola prueba para ejecutar los seeders pesados una sola vez por caso de migración.
     */
    public function test_menus_filtrados_por_rol_y_permisos(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);
        $this->seed(SystemMenusSeeder::class);

        $flatten = null;
        $flatten = static function (array $tree, array &$routes, array &$perms, array &$labels) use (&$flatten): void {
            foreach ($tree as $n) {
                if (! empty($n['route']) && $n['route'] !== '#') {
                    $routes[] = (string) $n['route'];
                }
                if (! empty($n['label'])) {
                    $labels[] = (string) $n['label'];
                }
                if (! empty($n['permission_name'])) {
                    $perms[] = (string) $n['permission_name'];
                }
                if (! empty($n['children']) && is_array($n['children'])) {
                    $flatten($n['children'], $routes, $perms, $labels);
                }
            }
        };

        $treeFor = function (string $role) use ($flatten): array {
            $user = User::factory()->create();
            $user->assignRole($role);
            Sanctum::actingAs($user);
            $res = $this->getJson('/api/v1/me/menus');
            $res->assertOk();
            $tree = $res->json('data') ?? [];
            $routes = [];
            $perms = [];
            $labels = [];
            $flatten($tree, $routes, $perms, $labels);

            return [$routes, $perms, $labels];
        };

        // 1–2 Control Escolar: operativo, sin técnico
        [$ceRoutes, $cePerms, $ceLabels] = $treeFor('control_escolar_escuela');
        $this->assertNotEmpty($ceRoutes);
        $this->assertContains('/app/control-escolar/solicitudes', $ceRoutes);
        $this->assertContains('/app/control-escolar/importaciones', $ceRoutes);
        $this->assertContains('/app/control-escolar/observaciones', $ceRoutes);
        $this->assertContains('Solicitudes', $ceLabels);
        $this->assertContains('/app/certificacion/solicitud', $ceRoutes);
        foreach ($ceRoutes as $r) {
            $this->assertStringNotContainsString('/app/sistemas', $r);
            $this->assertStringNotContainsString('legacy-normativa', $r);
            $this->assertStringNotContainsString('/app/sistema/apariencia', $r);
            $this->assertStringNotContainsString('alumno=', $r);
            $this->assertStringNotContainsString('materias-cursadas', $r);
        }
        foreach ($cePerms as $p) {
            $this->assertFalse(str_starts_with($p, 'xml.'));
            $this->assertFalse(str_starts_with($p, 'firma.'));
            $this->assertFalse(str_starts_with($p, 'logs.'));
        }

        // 2b Dirección de escuela: menú de supervisión sin técnica
        [$dirRoutes, $dirPerms, $dirLabels] = $treeFor('director_escuela');
        $this->assertContains('/app/direccion/indicadores', $dirRoutes);
        $this->assertContains('/app/direccion/autorizaciones-observaciones', $dirRoutes);
        $this->assertContains('Egreso y titulación', $dirLabels);
        foreach ($dirRoutes as $r) {
            $this->assertStringNotContainsString('/app/sistemas', $r);
            $this->assertStringNotContainsString('/app/admin/menus', $r);
        }
        foreach ($dirPerms as $p) {
            $this->assertFalse(str_starts_with($p, 'xml.'));
            $this->assertFalse(str_starts_with($p, 'jobs.'));
        }

        // 3–5 Sistemas: menús por rol + técnico, sin matrícula académica en ítems
        [$sysRoutes, $sysPerms, $sysLabels] = $treeFor('sistemas');
        $this->assertContains('/app/admin/menus', $sysRoutes);
        $this->assertContains('Menús por rol', $sysLabels);
        $this->assertTrue(
            in_array('/app/sistemas/logs', $sysRoutes, true) || in_array('/app/sistemas/dashboard', $sysRoutes, true),
        );
        $this->assertContains('/app/sistemas/configuracion', $sysRoutes);
        $this->assertNotContains('matriculas.asignar', $sysPerms);
        $this->assertNotContains('/app/solicitudes-matricula', $sysRoutes);
        $this->assertContains('/app/sistema/apariencia', $sysRoutes);
        $this->assertContains('Apariencia del sistema', $sysLabels);

        // 5b Certificación: módulo visual, sin cola técnica de firma en menú
        [$certRoutes, , $certLabels] = $treeFor('responsable_certificacion_titulacion');
        $this->assertContains('/app/certificacion/dashboard', $certRoutes);
        $this->assertContains('/app/certificacion/firma-electronica', $certRoutes);
        $this->assertNotContains('Dashboard', $certLabels);
        foreach ($certRoutes as $r) {
            $this->assertStringNotContainsString('listos-para-firma', $r);
            $this->assertStringNotContainsString('/app/sistemas', $r);
        }

        // 6 Educación Superior: menú académico central sin técnica ni legacy en rutas
        [$esRoutes, $esPerms, $esLabels] = $treeFor('educacion_superior');
        $this->assertContains('/app/solicitudes-matricula', $esRoutes);
        $this->assertContains('/app/educacion-superior/instituciones', $esRoutes);
        $this->assertContains('/app/educacion-superior/sedes', $esRoutes);
        $this->assertContains('/app/educacion-superior/programas', $esRoutes);
        $this->assertContains('/app/educacion-superior/planes', $esRoutes);
        $this->assertContains('/app/educacion-superior/validaciones-normativas', $esRoutes);
        $this->assertContains('/app/educacion-superior/normales/certificacion', $esRoutes);
        $this->assertContains('/app/educacion-superior/upn/certificacion', $esRoutes);
        $this->assertContains('/app/educacion-superior/reportes-oficiales', $esRoutes);
        $this->assertContains('Validaciones normativas', $esLabels);
        $this->assertContains('Sedes / Subsedes', $esLabels);
        $this->assertNotContains('/app/sistemas/configuracion', $esRoutes);
        foreach ($esRoutes as $r) {
            $this->assertStringNotContainsString('/app/sistemas', $r);
            $this->assertStringNotContainsString('legacy-normativa', $r);
        }
        foreach ($esPerms as $p) {
            $this->assertFalse(str_starts_with($p, 'xml.'));
            $this->assertFalse(str_starts_with($p, 'firma.'));
            $this->assertFalse(str_starts_with($p, 'jobs.'));
            $this->assertFalse(str_starts_with($p, 'logs.'));
        }

        // 7 Docente
        [$docRoutes] = $treeFor('docente');
        foreach ($docRoutes as $r) {
            $this->assertStringContainsString('docente', $r);
        }

        // 8 Auditor
        [$auRoutes, $auPerms] = $treeFor('auditor');
        $this->assertNotContains('/app/alumnos/crear', $auRoutes);
        foreach ($auPerms as $p) {
            $this->assertStringNotContainsString('gestionar_alumnos', $p);
        }

        // 9 Alumno
        [$alRoutes, $alPerms] = $treeFor('alumno_egresado');
        foreach ($alRoutes as $r) {
            $this->assertSame('/app/dashboard', $r);
        }
        $this->assertContains('portal.ver', $alPerms);

        // 10 Aspirante
        [$asRoutes, $asPerms] = $treeFor('aspirante_preinscrito');
        $this->assertContains('admision.portal', $asPerms);
        foreach ($asRoutes as $r) {
            $this->assertSame('/app/dashboard', $r);
        }

        // 11 Admin menús
        $ce = User::factory()->create();
        $ce->assignRole('control_escolar_escuela');
        Sanctum::actingAs($ce);
        $this->getJson('/api/v1/admin/menus')->assertForbidden();

        $sys = User::factory()->create();
        $sys->assignRole('sistemas');
        Sanctum::actingAs($sys);
        $this->getJson('/api/v1/admin/menus')->assertOk();
    }
}
