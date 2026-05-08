<?php

declare(strict_types=1);

namespace App\Support\Certificacion\Profiles;

use App\Contracts\Certificacion\CertificacionProfileInterface;

class UpnDecProfile implements CertificacionProfileInterface
{
    public function subsistemaClave(): string
    {
        return 'UPN';
    }

    public function tipoDocumento(): string
    {
        return 'certificado';
    }

    public function specCode(): string
    {
        return 'upn_dec_v1';
    }

    public function specVersion(): string
    {
        return 'pendiente_confirmacion';
    }

    public function xmlVersion(): string
    {
        return '1.0';
    }

    public function tipoCertificado(): string
    {
        return '9';
    }

    public function servicioFirmante(): string
    {
        return 'educacionNormal';
    }

    public function oficialDisponible(): bool
    {
        return false;
    }
}
