<?php

declare(strict_types=1);

namespace App\Data\ControlEscolar;

final readonly class ControlEscolarAlumnoData
{
    /**
     * @param  array<string, mixed>  $raw
     */
    public function __construct(
        public string $curp,
        public string $nombre,
        public string $primerApellido,
        public ?string $segundoApellido,
        public ?string $matricula,
        public ?string $rfc,
        public ?string $fechaNacimiento,
        public ?string $genero,
        public ?int $institucionClave,
        public ?string $institucionNombre,
        public ?string $sedeCct,
        public ?string $sedeNombre,
        public ?string $programaClave,
        public ?string $programaNombre,
        public ?string $planClave,
        public ?string $planNombre,
        public ?string $cicloClave,
        public ?string $modalidad,
        public array $raw = [],
    ) {}
}
