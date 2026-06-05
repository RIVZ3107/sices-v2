<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\ControlEscolar\TipoEscalaCalificacion;
use App\Models\EscalaCalificacion;
use Illuminate\Database\Seeder;

final class EscalaCalificacionSeeder extends Seeder
{
    public function run(): void
    {
        $registros = [
            [
                'clave' => 'numerica_0_10',
                'nombre' => 'Escala numérica 0–10',
                'tipo' => TipoEscalaCalificacion::Numerica010->value,
                'calificacion_minima' => 0,
                'calificacion_maxima' => 10,
                'calificacion_aprobatoria' => 6,
                'permite_decimales' => true,
                'decimales' => 1,
                'permite_acreditado' => false,
            ],
            [
                'clave' => 'numerica_5_10',
                'nombre' => 'Escala numérica 5–10',
                'tipo' => TipoEscalaCalificacion::Numerica510->value,
                'calificacion_minima' => 5,
                'calificacion_maxima' => 10,
                'calificacion_aprobatoria' => 6,
                'permite_decimales' => true,
                'decimales' => 1,
                'permite_acreditado' => false,
            ],
            [
                'clave' => 'acreditado_no_acreditado',
                'nombre' => 'Acreditado / No acreditado',
                'tipo' => TipoEscalaCalificacion::Acreditado->value,
                'calificacion_minima' => 0,
                'calificacion_maxima' => 1,
                'calificacion_aprobatoria' => 1,
                'permite_decimales' => false,
                'decimales' => 0,
                'permite_acreditado' => true,
            ],
            [
                'clave' => 'textual',
                'nombre' => 'Calificación textual',
                'tipo' => TipoEscalaCalificacion::Textual->value,
                'calificacion_minima' => 0,
                'calificacion_maxima' => 0,
                'calificacion_aprobatoria' => 0,
                'permite_decimales' => false,
                'decimales' => 0,
                'permite_acreditado' => false,
            ],
            [
                'clave' => 'mixta',
                'nombre' => 'Escala mixta',
                'tipo' => TipoEscalaCalificacion::Mixta->value,
                'calificacion_minima' => 0,
                'calificacion_maxima' => 10,
                'calificacion_aprobatoria' => 6,
                'permite_decimales' => true,
                'decimales' => 1,
                'permite_acreditado' => true,
            ],
        ];

        foreach ($registros as $row) {
            EscalaCalificacion::query()->updateOrCreate(
                ['clave' => $row['clave']],
                array_merge($row, ['activo' => true]),
            );
        }
    }
}
