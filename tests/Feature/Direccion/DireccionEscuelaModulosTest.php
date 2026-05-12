<?php

declare(strict_types=1);

namespace Tests\Feature\Direccion;

use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Database\Seeders\SystemMenusSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DireccionEscuelaModulosTest extends TestCase
{
    use RefreshDatabase;

    private function flattenMenu(array $tree, array &$routes, array &$labels): void
    {
        foreach ($tree as $n) {
            if (! empty($n['route']) && $n['route'] !== '#') {
                $routes[] = (string) $n['route'];
            }
            if (! empty($n['label'])) {
                $labels[] = (string) $n['label'];
            }
            if (! empty($n['children']) && is_array($n['children'])) {
                $this->flattenMenu($n['children'], $routes, $labels);
            }
        }
    }

    public function test_director_escuela_menus_permisos_y_dashboard(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);
        $this->seed(SystemMenusSeeder::class);

        $user = User::factory()->create();
        $user->assignRole('director_escuela');
        Sanctum::actingAs($user);

        $tree = $this->getJson('/api/v1/me/menus')->assertOk()->json('data') ?? [];
        $routes = [];
        $labels = [];
        $this->flattenMenu($tree, $routes, $labels);

        $this->assertContains('/app/dashboard', $routes);
        $this->assertContains('/app/direccion/indicadores', $routes);
        $this->assertContains('/app/direccion/alumnos', $routes);
        $this->assertContains('/app/expedientes', $routes);
        $this->assertContains('/app/direccion/inscripciones', $routes);
        $this->assertContains('/app/direccion/reinscripciones', $routes);
        $this->assertContains('/app/direccion/calificaciones', $routes);
        $this->assertContains('/app/direccion/egreso-titulacion', $routes);
        $this->assertContains('/app/direccion/documentos', $routes);
        $this->assertContains('/app/direccion/autorizaciones-observaciones', $routes);
        $this->assertContains('/app/direccion/reportes', $routes);
        $this->assertContains('/app/direccion/notificaciones', $routes);
        $this->assertContains('Autorizaciones / Observaciones', $labels);

        foreach ($routes as $r) {
            $this->assertStringNotContainsString('/app/sistemas', $r);
            $this->assertStringNotContainsString('/app/sistema/apariencia', $r);
            $this->assertStringNotContainsString('/app/admin/menus', $r);
        }

        $this->assertTrue($user->can('dashboard.ver'));
        $this->assertTrue($user->can('indicadores.ver'));
        $this->assertTrue($user->can('inscripciones.autorizar_excepcion'));
        $this->assertTrue($user->can('reinscripciones.autorizar_excepcion'));
        $this->assertTrue($user->can('egreso.aprobar_institucionalmente'));
        $this->assertFalse($user->can('matriculas.asignar'));
        $this->assertFalse($user->can('asignar_matricula'));
        $this->assertFalse($user->can('calificaciones.capturar'));
        $this->assertFalse($user->can('documentos.validar_normativamente'));
        $this->assertFalse($user->can('xml.generar'));
        $this->assertFalse($user->can('firma.ejecutar'));
        $this->assertFalse($user->can('logs.ver'));
        $this->assertFalse($user->can('jobs.ver'));

        $dash = $this->getJson('/api/v1/dashboard')->assertOk()->json('data') ?? [];
        $this->assertSame('director_escuela', $dash['role'] ?? null);
        $payload = $dash['payload'] ?? [];
        $this->assertArrayHasKey('contexto', $payload);
        $this->assertArrayHasKey('metricas', $payload);
        $this->assertArrayHasKey('matricula_por_programa', $payload);
        $this->assertArrayHasKey('pendientes_criticos_sugeridos', $payload);
        $this->assertArrayHasKey('decisiones_recientes_direccion', $payload);

        $json = strtolower(json_encode($payload, JSON_THROW_ON_ERROR));
        $this->assertStringNotContainsString('colegiatura', $json);
        $this->assertStringNotContainsString('ingeniería', $json);
        $this->assertStringNotContainsString('contaduría', $json);
    }
}
