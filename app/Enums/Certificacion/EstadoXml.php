<?php

namespace App\Enums\Certificacion;

enum EstadoXml: string
{
    case NO_GENERADO = 'no_generado';
    case GENERADO = 'generado';
    case SELLADO = 'sellado';
    case TIMBRADO = 'timbrado';
    case ERROR_XML = 'error_xml';

    public function label(): string
    {
        return match ($this) {
            self::NO_GENERADO => 'No generado',
            self::GENERADO => 'Generado',
            self::SELLADO => 'Sellado',
            self::TIMBRADO => 'Timbrado',
            self::ERROR_XML => 'Error XML',
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
