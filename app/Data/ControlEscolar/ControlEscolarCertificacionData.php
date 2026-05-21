<?php

declare(strict_types=1);

namespace App\Data\ControlEscolar;

final readonly class ControlEscolarCertificacionData
{
    /**
     * @param  array<string, mixed>  $raw
     */
    public function __construct(
        public string $matricula,
        public ?string $tipoCertificado,
        public ?string $tipoCertificacion,
        public ?string $fechaEgreso,
        public ?float $promedio,
        public ?float $creditos,
        public ?int $totalAsignaturas,
        public ?string $modalidad,
        public ?string $sedeCct,
        public array $raw = [],
    ) {}
}
