<?php

namespace App\Enums\Certificacion;

enum TipoDocumentoAcademico: string
{
    case CERTIFICADO = 'certificado';
    case TITULO = 'titulo';
    case GRADO = 'grado';

    public function label(): string
    {
        return match ($this) {
            self::CERTIFICADO => 'Certificado',
            self::TITULO => 'Título',
            self::GRADO => 'Grado',
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
