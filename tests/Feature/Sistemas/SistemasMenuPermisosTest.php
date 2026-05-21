<?php

declare(strict_types=1);

namespace Tests\Feature\Sistemas;

use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Database\Seeders\SystemMenusSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SistemasMenuPermisosTest extends TestCase
{
    use RefreshDatabase;

    public function test_sistemas_ve_menu_tecnico_completo_y_no_operacion_academica_principal(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);
        $this->seed(SystemMenusSeeder::class);

        $user = User::factory()->create();
        $user->assignRole('sistemas');
        Sanctum::actingAs($user);

        $res = $this->getJson('/api/v1/me/menus');
        $res->assertOk();

        $routes = [];
        $walk = static function (array $nodes) use (&$routes): void {
            foreach ($nodes as $n) {
                if (! empty($n['route']) && $n['route'] !== '#') {
                    $routes[] = (string) $n['route'];
                }
                if (! empty($n['children']) && is_array($n['children'])) {
                    $walk($n['children']);
                }
            }
        };
        $walk($res->json('data') ?? []);

        $expected = [
            '/app/dashboard',
            '/app/sistemas/usuarios',
            '/app/sistemas/roles-permisos',
            '/app/sistemas/menus',
            '/app/sistemas/catalogos',
            '/app/sistemas/configuracion-global',
            '/app/sistema/apariencia',
            '/app/sistemas/integraciones',
            '/app/sistemas/logs',
            '/app/sistemas/jobs-colas',
            '/app/sistemas/auditoria',
            '/app/sistema/respaldos',
            '/app/sistema/monitoreo',
            '/app/sistemas/notificaciones-tecnicas',
        ];
        foreach ($expected as $route) {
            $this->assertContains($route, $routes, "Falta la ruta de menú técnico: {$route}");
        }

        foreach ($routes as $r) {
            $this->assertStringNotContainsString('/app/control-escolar/inscripciones', $r);
            $this->assertStringNotContainsString('/app/control-escolar/calificaciones', $r);
            $this->assertStringNotContainsString('/app/solicitudes-matricula', $r);
        }
    }
}
