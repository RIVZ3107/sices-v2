<?php

namespace App\Enums\Certificacion;

enum EstadoCadena: string
{
    case NO_GENERADA = 'no_generada';
    case GENERADA = 'generada';
    case ERROR_CADENA = 'error_cadena';

    public function label(): string
    {
        return match ($this) {
            self::NO_GENERADA => 'No generada',
            self::GENERADA => 'Generada',
            self::ERROR_CADENA => 'Error en cadena',
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
