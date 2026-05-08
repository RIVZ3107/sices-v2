<?php

declare(strict_types=1);

namespace App\Support\Certificacion\Profiles;

use App\Contracts\Certificacion\CertificacionProfileInterface;
use App\Models\DocumentoAcademico;
use InvalidArgumentException;

class CertificacionProfileResolver
{
    public function resolveForDocumento(DocumentoAcademico $documento): CertificacionProfileInterface
    {
        $documento->loadMissing('subsistema');
        $claveSubsistema = strtoupper((string) ($documento->subsistema?->clave ?? ''));

        return match ($claveSubsistema) {
            'NORMAL' => new NormalDecProfile(),
            'UPN' => new UpnDecProfile(),
            default => throw new InvalidArgumentException('No existe profile documental para el subsistema del documento.'),
        };
    }
}
