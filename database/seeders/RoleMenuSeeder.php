<?php

declare(strict_types=1);

namespace Database\Seeders;

use Illuminate\Database\Seeder;

/**
 * Los vínculos menú–rol se cargan en {@see SystemMenusSeeder}.
 * Este seeder existe solo para compatibilidad con comandos que lo referencian.
 */
class RoleMenuSeeder extends Seeder
{
    public function run(): void
    {
        // Sin acción: ejecutar `MenuSeeder` o `SystemMenusSeeder` para menús y pivotes.
    }
}
