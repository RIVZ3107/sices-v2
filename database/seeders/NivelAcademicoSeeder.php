<?php

namespace Database\Seeders;

use App\Models\NivelAcademico;
use Illuminate\Database\Seeder;

class NivelAcademicoSeeder extends Seeder
{
    /**
     * Catálogo base de niveles educativos (referencia inicial, extensible por metadata).
     */
    public function run(): void
    {
        $filas = [
            ['clave' => 'LIC', 'nombre' => 'Licenciatura', 'orden' => 1],
            ['clave' => 'ESP', 'nombre' => 'Especialidad', 'orden' => 2],
            ['clave' => 'MAE', 'nombre' => 'Maestría', 'orden' => 3],
            ['clave' => 'DOC', 'nombre' => 'Doctorado', 'orden' => 4],
            ['clave' => 'TEC', 'nombre' => 'Técnico', 'orden' => 5],
        ];

        foreach ($filas as $fila) {
            NivelAcademico::updateOrCreate(
                ['clave' => $fila['clave']],
                [
                    'nombre' => $fila['nombre'],
                    'tipo' => 'superior',
                    'orden' => $fila['orden'],
                    'activo' => true,
                    'metadata' => [
                        'catalogo_base' => true,
                        'estatus_referencia' => 'activo',
                    ],
                ]
            );
        }
    }
}
