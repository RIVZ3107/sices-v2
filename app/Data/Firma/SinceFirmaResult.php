<?php

declare(strict_types=1);

namespace App\Data\Firma;

final readonly class SinceFirmaResult
{
    /**
     * @param  array<string, mixed>  $rawResponse
     */
    public function __construct(
        public bool $success,
        public ?string $xmlFirmado = null,
        public ?string $folioDigital = null,
        public ?string $selloSep = null,
        public ?int $httpStatus = null,
        public ?string $errorMessage = null,
        public ?string $errorCode = null,
        public bool $simulada = false,
        public array $rawResponse = [],
        public array $rawSanitized = [],
    ) {}
}
