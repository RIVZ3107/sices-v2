<?php

declare(strict_types=1);

namespace App\Enums\Academico;

enum TipoPeriodoEscolar: string
{
    case SEMESTRE = 'semestre';
    case CUATRIMESTRE = 'cuatrimestre';
    case TRIMESTRE = 'trimestre';
    case ANUAL = 'anual';
    case OTRO = 'otro';

    public function label(): string
    {
        return match ($this) {
            self::SEMESTRE => 'Semestre',
            self::CUATRIMESTRE => 'Cuatrimestre',
            self::TRIMESTRE => 'Trimestre',
            self::ANUAL => 'Anual',
            self::OTRO => 'Otro',
        };
    }

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
