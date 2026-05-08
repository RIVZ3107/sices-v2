<?php

declare(strict_types=1);

namespace App\Exceptions\Certificacion;

use InvalidArgumentException;

final class AcademicRulesNotConfiguredException extends InvalidArgumentException
{
    public static function subsistema(string $clave): self
    {
        return new self(sprintf(
            'No hay motor de reglas académicas configurado para el subsistema "%s". Configure el subsistema o verifique la clave.',
            $clave,
        ));
    }

    public static function sinSubsistemaEnEntidad(string $entidad): self
    {
        return new self(sprintf(
            'No se puede resolver reglas académicas: la entidad "%s" no tiene subsistema asociado reconocible.',
            $entidad,
        ));
    }
}
