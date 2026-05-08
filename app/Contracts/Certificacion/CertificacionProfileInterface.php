<?php

declare(strict_types=1);

namespace App\Contracts\Certificacion;

interface CertificacionProfileInterface
{
    public function subsistemaClave(): string;

    public function tipoDocumento(): string;

    public function specCode(): string;

    public function specVersion(): string;

    public function xmlVersion(): string;

    public function tipoCertificado(): string;

    public function servicioFirmante(): string;

    public function oficialDisponible(): bool;
}
