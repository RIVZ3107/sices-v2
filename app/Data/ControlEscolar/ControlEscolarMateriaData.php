<?php

declare(strict_types=1);

namespace App\Data\ControlEscolar;

final readonly class ControlEscolarMateriaData
{
    /**
     * @param  array<string, mixed>  $raw
     */
    public function __construct(
        public string $clave,
        public string $nombre,
        public ?string $calificacion,
        public ?string $periodo,
        public ?int $semestre,
        public ?string $tipoPeriodoCurricular,
        public ?int $numeroPeriodoCurricular,
        public ?float $creditos,
        public ?string $estatusAcreditacion,
        public array $raw = [],
    ) {}
}
