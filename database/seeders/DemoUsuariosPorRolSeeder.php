<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class DemoUsuariosPorRolSeeder extends Seeder
{
    public function run(): void
    {
        $password = 'Sices2026*';

        $usuarios = [
            ['name' => 'Superadmin SICES', 'email' => 'superadmin@sices.local', 'role' => 'superadmin'],
            ['name' => 'Admin SICES', 'email' => 'admin@sices.local', 'role' => 'admin'],
            ['name' => 'Control Escolar Escuela', 'email' => 'control.escolar@sices.local', 'role' => 'control_escolar_escuela'],
            ['name' => 'Director Escuela', 'email' => 'director.escuela@sices.local', 'role' => 'director_escuela'],
            ['name' => 'Educacion Superior', 'email' => 'educacion.superior@sices.local', 'role' => 'educacion_superior'],
            ['name' => 'Sistemas SICES', 'email' => 'sistemas@sices.local', 'role' => 'sistemas'],
        ];

        foreach ($usuarios as $data) {
            $rol = Role::query()->where('name', $data['role'])->first();
            if ($rol === null) {
                continue;
            }

            $user = User::query()->updateOrCreate(
                ['email' => $data['email']],
                [
                    'name' => $data['name'],
                    'password' => $password,
                ],
            );

            $user->syncRoles([$rol->name]);
        }
    }
}
