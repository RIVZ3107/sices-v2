<?php

namespace App\Enums\Certificacion;

enum ProveedorFirma: string
{
    case SEP_SINCE_SERVICE = 'SEP_SINCE_SERVICE';
    case SEP_SINCE_TITULOS = 'SEP_SINCE_TITULOS';
    case UPN_FIRMA_LOCAL = 'UPN_FIRMA_LOCAL';
    case SIMULADO = 'SIMULADO';
    case OTRO = 'OTRO';

    public function label(): string
    {
        return match ($this) {
            self::SEP_SINCE_SERVICE => 'SEP / since-service (certificados normales)',
            self::SEP_SINCE_TITULOS => 'SEP / since-títulos',
            self::UPN_FIRMA_LOCAL => 'UPN — firma local',
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
