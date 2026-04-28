<?php

namespace App\Enums\Certificacion;

enum TipoCertificacion: string
{
    case TERMINO = 'termino';
    case PARCIAL = 'parcial';
    case DUPLICADO = 'duplicado';
    case REPOSICION = 'reposicion';

    public function label(): string
    {
        return match ($this) {
            self::TERMINO => 'Término',
            self::PARCIAL => 'Parcial',
            self::DUPLICADO => 'Duplicado',
            self::REPOSICION => 'Reposición',
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
