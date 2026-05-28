<?php

declare(strict_types=1);

namespace App\Data\Firma;

/**
 * Respuesta normalizada del servicio 34 SINCE/SEP.
 */
final readonly class SinceFirmaResponse
{
    /**
     * @param  array<string, mixed>  $rawSanitized
     */
    public function __construct(
        public bool $success,
        public string $message,
        public ?string $errorCode = null,
        public ?string $xmlFirmado = null,
        public ?string $folioDigital = null,
        public ?string $selloSep = null,
        public ?int $httpStatus = null,
        public bool $simulada = false,
        public array $rawSanitized = [],
    ) {}

    public static function fromLegacyResult(SinceFirmaResult $legacy): self
    {
        return new self(
            success: $legacy->success,
            message: $legacy->success
                ? ($legacy->simulada ? 'Firma simulada (servicio 34).' : 'Firma SEP exitosa.')
                : ($legacy->errorMessage ?? 'Error servicio 34.'),
            errorCode: $legacy->errorCode,
            xmlFirmado: $legacy->xmlFirmado,
            folioDigital: $legacy->folioDigital,
            selloSep: $legacy->selloSep,
            httpStatus: $legacy->httpStatus,
            simulada: $legacy->simulada,
            rawSanitized: $legacy->rawSanitized,
        );
    }

    public function toSinceFirmaResult(): SinceFirmaResult
    {
        return new SinceFirmaResult(
            success: $this->success,
            xmlFirmado: $this->xmlFirmado,
            folioDigital: $this->folioDigital,
            selloSep: $this->selloSep,
            httpStatus: $this->httpStatus,
            errorMessage: $this->success ? null : $this->message,
            errorCode: $this->errorCode,
            simulada: $this->simulada,
            rawResponse: $this->rawSanitized,
            rawSanitized: $this->rawSanitized,
        );
    }
}
