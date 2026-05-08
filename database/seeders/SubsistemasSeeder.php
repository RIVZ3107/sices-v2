<?php

namespace Database\Seeders;

use App\Models\Subsistema;
use Illuminate\Database\Seeder;

class SubsistemasSeeder extends Seeder
{
    public function run(): void
    {
        Subsistema::query()->updateOrCreate(
            ['clave' => 'NORMAL'],
            [
                'nombre' => 'Educación Normal',
                'nombre_corto' => 'Normal',
                'activo' => true,
            ],
        );

        Subsistema::query()->updateOrCreate(
            ['clave' => 'UPN'],
            [
                'nombre' => 'Universidad Pedagógica Nacional',
                'nombre_corto' => 'UPN',
                'activo' => true,
            ],
        );
    }
}
