<?php

declare(strict_types=1);

namespace App\Data\SicesLegacy;

final readonly class SicesLegacyMateriaData
{
    /**
     * @param  array<string, mixed>  $raw
     */
    public function __construct(
        public ?string $clave,
        public ?string $nombre,
        public ?string $calificacion,
        public ?string $semestre,
        public ?string $periodo,
        public ?string $ciclo,
        public ?string $tipoCertificado,
        public ?string $urlShortMateria,
        public array $raw = [],
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'clave' => $this->clave,
            'nombre' => $this->nombre,
            'calificacion' => $this->calificacion,
            'semestre' => $this->semestre,
            'periodo' => $this->periodo,
            'ciclo' => $this->ciclo,
            'tipo_certificado' => $this->tipoCertificado,
            'url_short_materia' => $this->urlShortMateria,
        ];
    }
}
