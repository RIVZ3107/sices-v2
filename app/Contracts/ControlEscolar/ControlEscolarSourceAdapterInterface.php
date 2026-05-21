<?php

declare(strict_types=1);

namespace App\Contracts\ControlEscolar;

use App\Data\ControlEscolar\ControlEscolarAlumnoData;
use App\Data\ControlEscolar\ControlEscolarCertificacionData;
use App\Data\ControlEscolar\ControlEscolarMateriaData;
use App\Data\ControlEscolar\ControlEscolarTrayectoriaData;

interface ControlEscolarSourceAdapterInterface
{
    public function buscarAlumnoPorCurp(string $curp): ?ControlEscolarAlumnoData;

    public function buscarAlumnoPorMatricula(string $matricula): ?ControlEscolarAlumnoData;

    /**
     * @return list<ControlEscolarMateriaData>
     */
    public function obtenerMateriasPorMatricula(string $matricula): array;

    public function obtenerTrayectoriaPorMatricula(string $matricula): ?ControlEscolarTrayectoriaData;

    public function obtenerDatosCertificacion(string $matricula): ?ControlEscolarCertificacionData;

    /**
     * @return array{ok: bool, message: string, driver?: string}
     */
    public function health(): array;
}
