<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;

/**
 * @deprecated Alias de compatibilidad. Usar {@see SystemMenusSeeder}.
 */
class MenuSeeder extends Seeder
{
    public function run(): void
    {
        $this->call(SystemMenusSeeder::class);
    }
}
