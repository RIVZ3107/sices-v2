<?php

declare(strict_types=1);

namespace Tests\Feature\Menus;

use App\Models\Menu;
use Database\Seeders\RolesAndPermissionsSeeder;
use Database\Seeders\Support\SicesPermissionsCatalog;
use Database\Seeders\SystemMenusSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\Support\SpaRouteRegistry;
use Tests\TestCase;

/**
 * Una sola prueba = una migración + un seed (evita ~8 min repetidos por método).
 *
 * @group menu
 */
class SystemMenusIntegrityTest extends TestCase
{
    use RefreshDatabase;

    public function test_integridad_menus_tras_seed(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);
        $this->seed(SystemMenusSeeder::class);

        $catalog = array_flip(SicesPermissionsCatalog::allRegisterablePermissionNames());
        $invalidPerms = [];
        Menu::query()
            ->whereNotNull('permission_name')
            ->where('permission_name', '!=', '')
            ->orderBy('id')
            ->each(function (Menu $menu) use ($catalog, &$invalidPerms): void {
                $perm = (string) $menu->permission_name;
                if (! isset($catalog[$perm])) {
                    $invalidPerms[] = "{$menu->label} ({$perm})";
                }
            });
        $this->assertSame([], $invalidPerms, 'Permisos inválidos: '.implode(', ', $invalidPerms));

        $registry = SpaRouteRegistry::staticAppPaths();
        $missingRoutes = [];
        Menu::query()->orderBy('id')->each(function (Menu $menu) use ($registry, &$missingRoutes): void {
            $route = (string) $menu->route;
            if ($route === '#' || $route === '') {
                return;
            }
            if (! SpaRouteRegistry::pathMatchesRegistry($route, $registry)) {
                $missingRoutes[] = "{$menu->label} → {$route}";
            }
        });
        $this->assertSame([], $missingRoutes, 'Rutas SPA faltantes: '.implode('; ', $missingRoutes));

        $sinRol = Menu::query()->whereDoesntHave('roles')->pluck('label')->all();
        $this->assertSame([], $sinRol, 'Menús sin menu_role: '.implode(', ', $sinRol));

        $orphanRoles = (int) DB::table('menu_role')
            ->leftJoin('roles', 'roles.id', '=', 'menu_role.role_id')
            ->whereNull('roles.id')
            ->count();
        $this->assertSame(0, $orphanRoles, 'Hay menu_role con role_id huérfano');

        $rcLabels = Menu::query()
            ->whereHas('roles', fn ($q) => $q->where('name', 'responsable_certificacion_titulacion'))
            ->pluck('label')
            ->all();
        $this->assertSame(1, array_count_values($rcLabels)['Inicio'] ?? 0);
        $this->assertSame(0, array_count_values($rcLabels)['Dashboard'] ?? 0);
        $parent = Menu::query()
            ->where('label', 'Certificación')
            ->where('route', '#')
            ->whereHas('roles', fn ($q) => $q->where('name', 'responsable_certificacion_titulacion'))
            ->first();
        $this->assertNotNull($parent);
        $this->assertSame('#', $parent->route);

        $esRoutes = Menu::query()
            ->whereHas('roles', fn ($q) => $q->where('name', 'educacion_superior'))
            ->where('route', '!=', '#')
            ->pluck('route')
            ->all();
        $this->assertContains('/app/educacion-superior/normales/certificacion', $esRoutes);
        $this->assertContains('/app/educacion-superior/upn/certificacion', $esRoutes);
        $this->assertSame(
            1,
            Menu::query()
                ->whereHas('roles', fn ($q) => $q->where('name', 'educacion_superior'))
                ->where('route', '/app/educacion-superior/normales/certificacion')
                ->count(),
        );

        $sysInicio = Menu::query()
            ->whereHas('roles', fn ($q) => $q->where('name', 'sistemas'))
            ->where('label', 'Inicio técnico')
            ->value('route');
        $this->assertSame('/app/sistemas/proceso-tecnico-certificacion', $sysInicio);
        $sysPte = Menu::query()
            ->whereHas('roles', fn ($q) => $q->where('name', 'sistemas'))
            ->where('label', 'Incidencias técnicas de certificación')
            ->value('route');
        $this->assertSame('/app/sistemas/proceso-tecnico-certificacion', $sysPte);

        $ceRoutes = Menu::query()
            ->whereHas('roles', fn ($q) => $q->where('name', 'control_escolar_escuela'))
            ->pluck('route')
            ->all();
        foreach ($ceRoutes as $route) {
            $this->assertStringNotContainsString('alumno=', (string) $route);
            $this->assertDoesNotMatchRegularExpression('#/documentos/\d+#', (string) $route);
            $this->assertStringNotContainsString('/captura', (string) $route);
            $this->assertStringNotContainsString('materias-cursadas', (string) $route);
            $this->assertStringNotContainsString('/expedientes/', (string) $route);
        }
        $this->assertContains('/app/certificacion/solicitud', $ceRoutes);
    }
}
