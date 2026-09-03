<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UsersSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            [
                'name'  => 'Superadmin SICES',
                'email' => 'superadmin@sices.local',
                'role'  => 'superadmin',
            ],
            [
                'name'  => 'Admin SICES',
                'email' => 'admin@sices.local',
                'role'  => 'admin',
            ],
            [
                'name'  => 'Control Escolar Escuela',
                'email' => 'control.escolar@sices.local',
                'role'  => 'control_escolar_escuela',
            ],
            [
                'name'  => 'Director Escuela',
                'email' => 'director.escuela@sices.local',
                'role'  => 'director_escuela',
            ],
            [
                'name'  => 'Educacion Superior',
                'email' => 'educacion.superior@sices.local',
                'role'  => 'educacion_superior',
            ],
            [
                'name'  => 'Sistemas SICES',
                'email' => 'sistemas@sices.local',
                'role'  => 'sistemas',
            ],
        ];

        foreach ($users as $data) {
            $user = User::firstOrCreate(
                ['email' => $data['email']],
                [
                    'name'              => $data['name'],
                    'password'          => bcrypt('password'),
                    'email_verified_at' => now(),
                ],
            );

            $user->assignRole($data['role']);
        }
    }
}
