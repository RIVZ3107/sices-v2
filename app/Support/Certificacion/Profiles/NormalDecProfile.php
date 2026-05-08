<?php

declare(strict_types=1);

namespace App\Support\Certificacion\Profiles;

use App\Contracts\Certificacion\CertificacionProfileInterface;

class NormalDecProfile implements CertificacionProfileInterface
{
    public function subsistemaClave(): string
    {
        return 'NORMAL';
    }

    public function tipoDocumento(): string
    {
        return 'certificado';
    }

    public function specCode(): string
    {
        return 'normal_dec_2024_2025';
    }

    public function specVersion(): string
    {
        return '1.1';
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
        return true;
    }
}
