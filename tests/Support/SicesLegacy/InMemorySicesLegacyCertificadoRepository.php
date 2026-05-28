<?php

declare(strict_types=1);

namespace Tests\Support\SicesLegacy;

use App\Contracts\SicesLegacy\SicesLegacyCertificadoRepositoryInterface;
use App\Data\SicesLegacy\SicesLegacyCertificadoData;
use App\Data\SicesLegacy\SicesLegacyMateriaData;
use App\Exceptions\Legacy\SicesLegacyConnectionException;
use App\Exceptions\Legacy\SicesLegacyDisabledException;
use Illuminate\Support\Collection;

/**
 * Repositorio en memoria para tests automatizados (nunca toca Informix).
 */
final class InMemorySicesLegacyCertificadoRepository implements SicesLegacyCertificadoRepositoryInterface
{
    /** @var array<string, mixed> */
    public array $healthResponse;

    /** @var array<string, Collection<int, SicesLegacyCertificadoData>> */
    public array $porCurp = [];

    /** @var array<string, Collection<int, SicesLegacyCertificadoData>> */
    public array $porMatricula = [];

    /** @var array<string, SicesLegacyCertificadoData|null> */
    public array $porUrlShort = [];

    /** @var array<int, Collection<int, SicesLegacyMateriaData>> */
    public array $materiasPorCertificado = [];

    /** @var array<string, string> */
    public array $xmlSepPorUrlShort = [];

    public ?SicesLegacyConnectionException $excepcionEnCurp = null;

    public function __construct()
    {
        $this->healthResponse = SicesLegacyTestDoubles::healthDisabled();
    }

    public function buscarPorCurp(string $curp): Collection
    {
        $this->assertConsultaPermitida();

        if ($this->excepcionEnCurp !== null) {
            throw $this->excepcionEnCurp;
        }

        $key = strtoupper(trim($curp));

        return $this->porCurp[$key] ?? collect();
    }

    public function buscarPorMatricula(string $matricula): Collection
    {
        $this->assertConsultaPermitida();

        $key = trim($matricula);

        return $this->porMatricula[$key] ?? collect();
    }

    public function buscarPorUrlShort(string $urlShort): ?SicesLegacyCertificadoData
    {
        $this->assertConsultaPermitida();

        return $this->porUrlShort[trim($urlShort)] ?? null;
    }

    public function obtenerMateriasPorCertificado(SicesLegacyCertificadoData $certificado): Collection
    {
        $this->assertConsultaPermitida();

        $id = $certificado->idSices ?? 0;

        return $this->materiasPorCertificado[$id] ?? collect();
    }

    public function obtenerEstadoPdf(string $urlShort): array
    {
        $cert = $this->buscarPorUrlShort($urlShort);

        return [
            'pdf_generado' => $cert?->pdfGenerado() ?? false,
            'url_short' => $cert?->urlShort,
        ];
    }

    public function obtenerXmlSepPorUrlShort(string $urlShort): ?string
    {
        $this->assertConsultaPermitida();

        return $this->xmlSepPorUrlShort[trim($urlShort)] ?? null;
    }

    public function health(): array
    {
        return $this->healthResponse;
    }

    protected function assertConsultaPermitida(): void
    {
        if (! config('sices_legacy.enabled')) {
            throw new SicesLegacyDisabledException;
        }
    }
}
