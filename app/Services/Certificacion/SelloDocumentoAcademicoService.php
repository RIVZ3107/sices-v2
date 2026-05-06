<?php

declare(strict_types=1);

namespace App\Services\Certificacion;

/**
 * Facade operativo sobre {@see OpenSslSelloService} para integración documental sin duplicar lógica.
 */
class SelloDocumentoAcademicoService
{
    public function __construct(
        protected OpenSslSelloService $openssl,
    ) {}

    public function sellarCadenaSimulada(string $cadena): string
    {
        return $this->openssl->sellarCadenaSimulada($cadena);
    }

    public function calcularDigest(string $contenido): string
    {
        return $this->openssl->calcularDigest($contenido);
    }

    /**
     * @return array<string, mixed>
     */
    public function metadataSelloSimulado(): array
    {
        return $this->openssl->metadataSelloSimulado();
    }
}
