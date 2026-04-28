<?php

namespace App\Enums\Certificacion;

enum EstadoGeneral: string
{
    case ACTIVO = 'activo';
    case INACTIVO = 'inactivo';

    public function label(): string
    {
        return match ($this) {
            self::ACTIVO => 'Activo',
            self::INACTIVO => 'Inactivo',
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
