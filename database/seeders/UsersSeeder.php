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
                'name'  => 'Super Admin',
                'email' => 'superadmin@sices.gob.mx',
                'role'  => 'superadmin',
            ],
            [
                'name'  => 'Administrador',
                'email' => 'admin@sices.gob.mx',
                'role'  => 'admin',
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
