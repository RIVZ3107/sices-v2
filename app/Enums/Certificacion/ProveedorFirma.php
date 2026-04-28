<?php

namespace App\Enums\Certificacion;

enum ProveedorFirma: string
{
    case SEP_SINCE_SERVICE = 'SEP_SINCE_SERVICE';
    case SIMULADO = 'SIMULADO';
    case OTRO = 'OTRO';

    public function label(): string
    {
        return match ($this) {
            self::SEP_SINCE_SERVICE => 'SEP / since-service',
            self::SIMULADO => 'Simulado',
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
