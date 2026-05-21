<?php

declare(strict_types=1);

namespace App\Contracts\SicesLegacy;

use App\Data\SicesLegacy\SicesLegacyCertificadoData;
use App\Data\SicesLegacy\SicesLegacyMateriaData;
use Illuminate\Support\Collection;

interface SicesLegacyCertificadoRepositoryInterface
{
    /**
     * @return Collection<int, SicesLegacyCertificadoData>
     */
    public function buscarPorCurp(string $curp): Collection;

    /**
     * @return Collection<int, SicesLegacyCertificadoData>
     */
    public function buscarPorMatricula(string $matricula): Collection;

    public function buscarPorUrlShort(string $urlShort): ?SicesLegacyCertificadoData;

    /**
     * @return Collection<int, SicesLegacyMateriaData>
     */
    public function obtenerMateriasPorCertificado(SicesLegacyCertificadoData $certificado): Collection;

    /**
     * @return array{pdf_generado: bool, url_short: string|null}
     */
    public function obtenerEstadoPdf(string $urlShort): array;

    /**
     * @return array<string, mixed>
     */
    public function health(): array;
}
