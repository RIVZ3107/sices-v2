<?php

namespace App\Enums\Certificacion;

enum EstadoWorkflow: string
{
    case BORRADOR = 'borrador';
    case PENDIENTE = 'pendiente';
    case EN_REVISION = 'en_revision';
    case APROBADO = 'aprobado';
    case RECHAZADO = 'rechazado';
    case CANCELADO = 'cancelado';

    public function label(): string
    {
        return match ($this) {
            self::BORRADOR => 'Borrador',
            self::PENDIENTE => 'Pendiente',
            self::EN_REVISION => 'En revisión',
            self::APROBADO => 'Aprobado',
            self::RECHAZADO => 'Rechazado',
            self::CANCELADO => 'Cancelado',
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
