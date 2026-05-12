<?php

declare(strict_types=1);

namespace Database\Seeders;

use Database\Seeders\Support\SicesPermissionsCatalog;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        $registrar = app(PermissionRegistrar::class);
        $registrar->forgetCachedPermissions();

        $guard = 'web';

        foreach (SicesPermissionsCatalog::allRegisterablePermissionNames() as $name) {
            Permission::firstOrCreate(
                ['name' => $name, 'guard_name' => $guard],
            );
        }

        $registrar->forgetCachedPermissions();

        $todos = Permission::query()
            ->where('guard_name', $guard)
            ->orderBy('name')
            ->pluck('name')
            ->all();

        $rolesConLista = [
            'superadmin',
            'admin',
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
            'coordinador_academico',
            'consulta',
        ];

        foreach ($rolesConLista as $nombre) {
            $role = Role::firstOrCreate(
                ['name' => $nombre, 'guard_name' => $guard],
            );

            if ($nombre === 'superadmin' || $nombre === 'admin') {
                $role->syncPermissions($todos);

                continue;
            }

            $role->syncPermissions(SicesPermissionsCatalog::mergeRolePermissions($nombre));
        }

        $registrar->forgetCachedPermissions();
    }
}
