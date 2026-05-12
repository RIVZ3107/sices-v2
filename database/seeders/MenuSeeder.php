<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;

/**
 * Alias de {@see SystemMenusSeeder} para scripts/documentación que invocan `MenuSeeder`.
 */
class MenuSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(SystemMenusSeeder::class);
    }
}
