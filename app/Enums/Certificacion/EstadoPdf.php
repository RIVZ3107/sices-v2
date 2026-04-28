<?php

namespace App\Enums\Certificacion;

enum EstadoPdf: string
{
    case NO_GENERADO = 'no_generado';
    case GENERANDO = 'generando';
    case GENERADO = 'generado';
    case ERROR_PDF = 'error_pdf';

    public function label(): string
    {
        return match ($this) {
            self::NO_GENERADO => 'No generado',
            self::GENERANDO => 'Generando',
            self::GENERADO => 'Generado',
            self::ERROR_PDF => 'Error PDF',
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
