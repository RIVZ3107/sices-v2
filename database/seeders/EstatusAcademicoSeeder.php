<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\EstatusAcademico;
use Illuminate\Database\Seeder;

final class EstatusAcademicoSeeder extends Seeder
{
    public function run(): void
    {
        $registros = [
            ['clave' => 'activo', 'nombre' => 'Activo', 'descripcion' => 'Alumno en curso regular de estudios.', 'color' => '#0F6E56', 'orden' => 1],
            ['clave' => 'egresado', 'nombre' => 'Egresado', 'descripcion' => 'Concluyó el plan de estudios y cumple requisitos de egreso.', 'color' => '#185FA5', 'orden' => 2],
            ['clave' => 'baja_temporal', 'nombre' => 'Baja temporal', 'descripcion' => 'Interrupción temporal de la trayectoria escolar.', 'color' => '#BA7517', 'orden' => 3],
            ['clave' => 'baja_definitiva', 'nombre' => 'Baja definitiva', 'descripcion' => 'Separación permanente de la institución.', 'color' => '#C44536', 'orden' => 4],
            ['clave' => 'titulado', 'nombre' => 'Titulado', 'descripcion' => 'Cuenta con título o grado académico concluido.', 'color' => '#534AB7', 'orden' => 5],
            ['clave' => 'irregular', 'nombre' => 'Irregular', 'descripcion' => 'Trayectoria con materias pendientes o condiciones especiales.', 'color' => '#D97706', 'orden' => 6],
            ['clave' => 'suspendido', 'nombre' => 'Suspendido', 'descripcion' => 'Situación académica suspendida por resolución institucional.', 'color' => '#64748b', 'orden' => 7],
        ];

        foreach ($registros as $row) {
            EstatusAcademico::query()->updateOrCreate(
                ['clave' => $row['clave']],
                array_merge($row, ['activo' => true]),
            );
        }
    }
}
