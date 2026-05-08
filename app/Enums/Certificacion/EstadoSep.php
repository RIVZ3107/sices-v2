<?php

namespace App\Enums\Certificacion;

enum EstadoSep: string
{
    case NO_ENVIADO = 'no_enviado';
    case PENDIENTE_ENVIO = 'pendiente_envio';
    case ENVIADO = 'enviado';
    case TIMBRADO = 'timbrado';
    case RECHAZADO = 'rechazado';
    case ERROR_SEP = 'error_sep';

    public function label(): string
    {
        return match ($this) {
            self::NO_ENVIADO => 'No enviado',
            self::PENDIENTE_ENVIO => 'Pendiente de envio',
            self::ENVIADO => 'Enviado',
            self::TIMBRADO => 'Timbrado',
            self::RECHAZADO => 'Rechazado',
            self::ERROR_SEP => 'Error SEP',
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
