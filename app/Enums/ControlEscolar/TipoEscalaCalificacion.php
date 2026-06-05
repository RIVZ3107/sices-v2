<?php

declare(strict_types=1);

namespace App\Enums\ControlEscolar;

enum TipoEscalaCalificacion: string
{
    case Numerica010 = 'numerica_0_10';
    case Numerica510 = 'numerica_5_10';
    case Acreditado = 'acreditado_no_acreditado';
    case Textual = 'textual';
    case Mixta = 'mixta';

    public function label(): string
    {
        return match ($this) {
            self::Numerica010 => 'Numérica 0–10',
            self::Numerica510 => 'Numérica 5–10',
            self::Acreditado => 'Acreditado / No acreditado',
            self::Textual => 'Textual',
            self::Mixta => 'Mixta',
        };
    }

    /** @return list<string> */
    public static function values(): array
    {
        return array_column(self::cases(), 'value');
    }
}
