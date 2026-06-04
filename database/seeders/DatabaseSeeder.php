<?php

declare(strict_types=1);

namespace Database\Seeders;

use Database\Seeders\Base\InstitutionalBaseSeeder;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Catálogos institucionales: roles, permisos, menús, geografía, configuración base.
     */
    public function run(): void
    {
        $this->call(InstitutionalBaseSeeder::class);
    }
}
