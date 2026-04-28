<?php

namespace App\Enums\Certificacion;

enum MotorDocumento: string
{
    case JASPER = 'jasper';
    case DOMPDF = 'dompdf';
    case BROWSERSHOT = 'browsershot';

    public function label(): string
    {
        return match ($this) {
            self::JASPER => 'Jasper',
            self::DOMPDF => 'DomPDF',
            self::BROWSERSHOT => 'Browsershot',
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
