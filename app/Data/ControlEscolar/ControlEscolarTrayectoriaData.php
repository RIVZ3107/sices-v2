<?php

declare(strict_types=1);

namespace App\Data\ControlEscolar;

final readonly class ControlEscolarTrayectoriaData
{
    /**
     * @param  array<string, mixed>  $raw
     */
    public function __construct(
        public ?float $promedioGeneral,
        public ?float $creditosAcumulados,
        public ?int $totalMaterias,
        public ?int $materiasAcreditadas,
        public ?string $estatusTrayectoria,
        public array $raw = [],
    ) {}
}
