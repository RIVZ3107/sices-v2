<?php

namespace App\Enums\Certificacion;

enum EstadoFirma: string
{
    case NO_FIRMADO = 'no_firmado';
    case FIRMANDO = 'firmando';
    case FIRMADO = 'firmado';
    case ERROR_FIRMA = 'error_firma';

    public function label(): string
    {
        return match ($this) {
            self::NO_FIRMADO => 'No firmado',
            self::FIRMANDO => 'Firmando',
            self::FIRMADO => 'Firmado',
            self::ERROR_FIRMA => 'Error en firma',
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
