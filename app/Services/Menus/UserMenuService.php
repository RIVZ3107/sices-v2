<?php

declare(strict_types=1);

namespace App\Services\Menus;

use App\Models\Menu;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

/**
 * Menús filtrados en backend por rol, permisos y reglas de negocio (p. ej. Control Escolar sin técnico).
 */
final class UserMenuService
{
    /**
     * Rutas o fragmentos prohibidos para Control Escolar (sin XML/firma/logs/claves legacy).
     *
     * @var list<string>
     */
    private const CONTROL_ESCOLAR_ROUTE_DENY = [
        '/app/sistemas',
        'legacy-normativa',
        'claves-legacy',
        'ver_claves',
    ];

    /**
     * Rutas prohibidas para Dirección (sin administración técnica ni legacy operativo).
     *
     * @var list<string>
     */
    private const DIRECTOR_ESCUELA_ROUTE_DENY = [
        '/app/sistemas',
        '/app/admin/menus',
        '/app/sistema/apariencia',
        'legacy-normativa',
        'claves-legacy',
    ];

    /**
     * Educación Superior: sin Sistemas, sin administración de plataforma ni auditoría técnica.
     *
     * @var list<string>
     */
    private const EDUCACION_SUPERIOR_ROUTE_DENY = [
        '/app/sistemas',
        '/app/admin/menus',
        '/app/sistema/apariencia',
        '/app/admin/usuarios-roles',
        '/app/auditoria',
        'legacy-normativa',
        'claves-legacy',
        'ver_claves',
    ];

    /**
     * @return list<array<string, mixed>>
     */
    public function menusTreeFor(User $user): array
    {
        $menus = Menu::query()
            ->where('is_active', true)
            ->with(['roles:id,name', 'extraPermissions:id,name'])
            ->orderBy('order')
            ->get();

        $visible = $menus->filter(fn (Menu $m) => $this->isVisibleToUser($user, $m));

        return $this->buildTree($visible);
    }

    /**
     * @return list<int>
     */
    public function visibleMenuIdsFor(User $user): array
    {
        $menus = Menu::query()
            ->where('is_active', true)
            ->with(['roles:id,name', 'extraPermissions:id,name'])
            ->get();

        return $menus
            ->filter(fn (Menu $m) => $this->isVisibleToUser($user, $m))
            ->pluck('id')
            ->values()
            ->all();
    }

    private function isVisibleToUser(User $user, Menu $menu): bool
    {
        if (! $menu->is_active) {
            return false;
        }

        if ($menu->permission_name !== null && $menu->permission_name !== '' && ! $user->can($menu->permission_name)) {
            return false;
        }

        $roleNamesOnMenu = $menu->roles->pluck('name')->all();
        if ($roleNamesOnMenu !== []) {
            $match = false;
            foreach ($roleNamesOnMenu as $rn) {
                if ($user->hasRole($rn)) {
                    $match = true;
                    break;
                }
            }
            if (! $match) {
                return false;
            }
        }

        $extra = $menu->extraPermissions;
        if ($extra->isNotEmpty()) {
            $ok = false;
            foreach ($extra as $perm) {
                if ($user->can($perm->name)) {
                    $ok = true;
                    break;
                }
            }
            if (! $ok) {
                return false;
            }
        }

        if ($this->mustHideTechnicalFromControlEscolar($user, $menu)) {
            return false;
        }

        if ($this->mustHideTechnicalFromDirectorEscuela($user, $menu)) {
            return false;
        }

        if ($this->mustHideTechnicalFromEducacionSuperior($user, $menu)) {
            return false;
        }

        if ($this->mustHideFromMetadata($user, $menu)) {
            return false;
        }

        return true;
    }

    private function mustHideTechnicalFromControlEscolar(User $user, Menu $menu): bool
    {
        if (! $user->hasRole('control_escolar_escuela')) {
            return false;
        }

        if ($user->hasAnyRole(['superadmin', 'admin'])) {
            return false;
        }

        $meta = $menu->metadata ?? [];
        if (! empty($meta['technical_only'])) {
            return true;
        }

        $route = (string) $menu->route;
        foreach (self::CONTROL_ESCOLAR_ROUTE_DENY as $fragment) {
            if (Str::contains($route, $fragment)) {
                return true;
            }
        }

        $perm = (string) ($menu->permission_name ?? '');
        foreach (['xml.', 'firma.', 'logs.', 'jobs.', 'integraciones.', 'cadena_original.', 'menus.administrar'] as $prefix) {
            if ($perm !== '' && Str::startsWith($perm, $prefix)) {
                return true;
            }
        }

        return false;
    }

    private function mustHideTechnicalFromDirectorEscuela(User $user, Menu $menu): bool
    {
        if (! $user->hasRole('director_escuela')) {
            return false;
        }

        if ($user->hasAnyRole(['superadmin', 'admin'])) {
            return false;
        }

        $meta = $menu->metadata ?? [];
        if (! empty($meta['technical_only'])) {
            return true;
        }

        $route = (string) $menu->route;
        foreach (self::DIRECTOR_ESCUELA_ROUTE_DENY as $fragment) {
            if (Str::contains($route, $fragment)) {
                return true;
            }
        }

        $perm = (string) ($menu->permission_name ?? '');
        foreach (['xml.', 'firma.', 'logs.', 'jobs.', 'integraciones.', 'cadena_original.', 'menus.administrar', 'apariencia_sistema.', 'roles.', 'permisos.'] as $prefix) {
            if ($perm !== '' && Str::startsWith($perm, $prefix)) {
                return true;
            }
        }

        return false;
    }

    private function mustHideTechnicalFromEducacionSuperior(User $user, Menu $menu): bool
    {
        if (! $user->hasRole('educacion_superior')) {
            return false;
        }

        if ($user->hasAnyRole(['superadmin', 'admin'])) {
            return false;
        }

        $meta = $menu->metadata ?? [];
        if (! empty($meta['technical_only'])) {
            return true;
        }

        $route = (string) $menu->route;
        foreach (self::EDUCACION_SUPERIOR_ROUTE_DENY as $fragment) {
            if (Str::contains($route, $fragment)) {
                return true;
            }
        }

        $perm = (string) ($menu->permission_name ?? '');
        foreach ([
            'xml.',
            'firma.',
            'logs.',
            'jobs.',
            'integraciones.',
            'cadena_original.',
            'menus.administrar',
            'apariencia_sistema.',
            'roles.',
            'permisos.',
            'auditoria.',
        ] as $prefix) {
            if ($perm !== '' && Str::startsWith($perm, $prefix)) {
                return true;
            }
        }

        return false;
    }

    private function mustHideFromMetadata(User $user, Menu $menu): bool
    {
        $meta = $menu->metadata ?? [];
        $deny = $meta['deny_roles'] ?? null;
        if (! is_array($deny)) {
            return false;
        }

        foreach ($deny as $roleName) {
            if (is_string($roleName) && $user->hasRole($roleName)) {
                return true;
            }
        }

        return false;
    }

    /**
     * @param  Collection<int, Menu>  $menus
     * @return list<array<string, mixed>>
     */
    private function buildTree(Collection $menus): array
    {
        $byParent = $menus->groupBy(fn (Menu $m) => $m->parent_id ?? 0);

        $build = function (?int $parentId) use (&$build, $byParent): array {
            $key = $parentId ?? 0;
            /** @var Collection<int, Menu> $rows */
            $rows = $byParent->get($key, collect());
            $out = [];
            foreach ($rows->sortBy('order') as $menu) {
                $out[] = [
                    'id' => $menu->id,
                    'parent_id' => $menu->parent_id,
                    'label' => $menu->label,
                    'route' => $menu->route,
                    'icon' => $menu->icon,
                    'order' => $menu->order,
                    'section' => $menu->section,
                    'permission_name' => $menu->permission_name,
                    'metadata' => $menu->metadata,
                    'children' => $build((int) $menu->id),
                ];
            }

            return $out;
        };

        return $build(null);
    }
}
