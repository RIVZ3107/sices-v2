<?php

declare(strict_types=1);

namespace Tests\Feature\Admision;

use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Database\Seeders\SystemMenusSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AdmisionMenuPermisosTest extends TestCase
{
    use RefreshDatabase;

    public function test_responsable_admision_ve_solo_menu_de_admision_y_no_tecnico(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);
        $this->seed(SystemMenusSeeder::class);

        $user = User::factory()->create();
        $user->assignRole('responsable_admision');
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

        foreach ([
            '/app/dashboard',
            '/app/admision/convocatorias',
            '/app/admision/aspirantes',
            '/app/admision/preinscripciones',
            '/app/admision/expedientes-ingreso',
            '/app/admision/evaluacion-ingreso',
            '/app/admision/resultados',
            '/app/admision/reportes',
            '/app/admision/notificaciones',
        ] as $r) {
            $this->assertContains($r, $routes);
        }

        foreach ($routes as $route) {
            $this->assertTrue(
                str_starts_with($route, '/app/dashboard') || str_starts_with($route, '/app/admision/'),
                "Ruta inesperada en menú de admisión: {$route}",
            );
            $this->assertStringNotContainsString('/app/sistemas', $route);
            $this->assertStringNotContainsString('/app/sistema/apariencia', $route);
            $this->assertStringNotContainsString('/app/educacion-superior/certificacion', $route);
            $this->assertStringNotContainsString('listos-para-firma', $route);
            $this->assertStringNotContainsString('/app/control-escolar', $route);
            $this->assertStringNotContainsString('/app/solicitudes-matricula', $route);
        }
    }
}
