<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Models\EstatusMatricula;
use Illuminate\Database\Seeder;

final class EstatusMatriculaSeeder extends Seeder
{
    public function run(): void
    {
        $registros = [
            ['clave' => 'vigente', 'nombre' => 'Vigente', 'descripcion' => 'Matrícula activa en el periodo escolar.', 'color' => '#0F6E56', 'bloquea_operacion' => false, 'orden' => 1],
            ['clave' => 'inscrita', 'nombre' => 'Inscrita', 'descripcion' => 'Alumno inscrito con carga académica asignada.', 'color' => '#185FA5', 'bloquea_operacion' => false, 'orden' => 2],
            ['clave' => 'reinscrita', 'nombre' => 'Reinscrita', 'descripcion' => 'Continuidad de estudios en nuevo periodo.', 'color' => '#534AB7', 'bloquea_operacion' => false, 'orden' => 3],
            ['clave' => 'suspendida', 'nombre' => 'Suspendida', 'descripcion' => 'Operaciones restringidas por suspensión.', 'color' => '#BA7517', 'bloquea_operacion' => true, 'orden' => 4],
            ['clave' => 'baja', 'nombre' => 'Baja', 'descripcion' => 'Matrícula dada de baja.', 'color' => '#C44536', 'bloquea_operacion' => true, 'orden' => 5],
            ['clave' => 'concluida', 'nombre' => 'Concluida', 'descripcion' => 'Matrícula cerrada por conclusión de estudios.', 'color' => '#64748b', 'bloquea_operacion' => false, 'orden' => 6],
            ['clave' => 'pendiente_validacion', 'nombre' => 'Pendiente de validación', 'descripcion' => 'En espera de validación documental o académica.', 'color' => '#D97706', 'bloquea_operacion' => false, 'orden' => 7],
        ];

        foreach ($registros as $row) {
            EstatusMatricula::query()->updateOrCreate(
                ['clave' => $row['clave']],
                array_merge($row, ['activo' => true]),
            );
        }
    }
}
