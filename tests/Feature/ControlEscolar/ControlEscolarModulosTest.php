<?php

declare(strict_types=1);

namespace Tests\Feature\ControlEscolar;

use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Database\Seeders\SystemMenusSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

final class ControlEscolarModulosTest extends TestCase
{
    use RefreshDatabase;

    public function test_control_escolar_ve_modulos_operativos_y_no_tecnicos(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);
        $this->seed(SystemMenusSeeder::class);

        $user = User::factory()->create();
        $user->assignRole('control_escolar_escuela');
        Sanctum::actingAs($user);

        $res = $this->getJson('/api/v1/me/menus');
        $res->assertOk();
        $flat = $this->aplanarMenus($res->json('data') ?? []);

        $routes = array_values(array_filter(array_column($flat, 'route'), static fn ($r) => is_string($r) && $r !== '' && $r !== '#'));
        $labels = array_values(array_filter(array_column($flat, 'label'), static fn ($l) => is_string($l) && $l !== ''));        $this->assertContains('/app/control-escolar/importaciones', $routes);
        $this->assertContains('/app/control-escolar/observaciones', $routes);
        $this->assertContains('/app/control-escolar/expedientes', $routes);
        $this->assertContains('/app/control-escolar/solicitudes', $routes);
        $this->assertContains('Solicitudes', $labels);
        $ceModulos = array_values(array_filter($routes, static fn ($r) => is_string($r) && str_starts_with($r, '/app/control-escolar/')));
        $this->assertGreaterThanOrEqual(13, count($ceModulos));

        foreach ($routes as $r) {
            $this->assertStringNotContainsString('/app/sistemas', $r);
        }

        $json = strtolower(json_encode($res->json(), JSON_THROW_ON_ERROR));
        $this->assertStringNotContainsString('colegiatura', $json);
        $this->assertStringNotContainsString('adeudo', $json);
    }

    public function test_control_escolar_no_puede_aprobar_ni_asignar_matricula_via_api(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);

        $user = User::factory()->create();
        $user->assignRole('control_escolar_escuela');
        Sanctum::actingAs($user);

        $this->postJson('/api/v1/certificacion/solicitudes-matricula/999999/aprobar')->assertForbidden();
        $this->postJson('/api/v1/certificacion/solicitudes-matricula/999999/asignar-matricula')->assertForbidden();
        $this->postJson('/api/v1/certificacion/matriculas', [])->assertForbidden();
    }

    /**
     * @param  list<array<string, mixed>>  $tree
     * @return list<array<string, mixed>>
     */
    private function aplanarMenus(array $tree): array
    {
        $out = [];
        foreach ($tree as $n) {
            $out[] = $n;
            if (! empty($n['children']) && is_array($n['children'])) {
                $out = array_merge($out, $this->aplanarMenus($n['children']));
            }
        }

        return $out;
    }
}
