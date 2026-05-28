<?php

declare(strict_types=1);

namespace Tests\Support\SicesLegacy;

use App\Models\User;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

/**
 * Permisos mínimos para tests SICES Legacy (sin sembrar el catálogo completo).
 */
final class SicesLegacyRbacTestHelper
{
    public static function grant(User $user, string ...$permissions): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        foreach ($permissions as $name) {
            Permission::findOrCreate($name, 'web');
            if (! $user->hasPermissionTo($name)) {
                $user->givePermissionTo($name);
            }
        }

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
