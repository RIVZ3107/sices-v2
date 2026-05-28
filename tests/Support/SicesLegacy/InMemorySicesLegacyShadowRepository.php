<?php

declare(strict_types=1);

namespace Tests\Support\SicesLegacy;

use App\Contracts\SicesLegacy\SicesLegacyShadowRepositoryInterface;
use Illuminate\Validation\ValidationException;

/**
 * Repositorio fake para tests (sin Informix).
 */
final class InMemorySicesLegacyShadowRepository implements SicesLegacyShadowRepositoryInterface
{
    /** @var array<string, array<string, mixed>> */
    private array $certificados = [];

    /** @var list<array<string, mixed>> */
    private array $materias = [];

    public function reset(): void
    {
        $this->certificados = [];
        $this->materias = [];
    }

    public function findCertificadoByUrlShort(string $urlShort): ?array
    {
        return $this->certificados[trim($urlShort)] ?? null;
    }

    public function isCertificadoTimbrado(array $row): bool
    {
        $situac = strtoupper(trim((string) ($row['osituac'] ?? $row['situacion'] ?? '')));
        if ($situac === 'F') {
            return true;
        }

        if (! empty($row['ofoliodigitalsep']) || ! empty($row['folio_digital_sep'])) {
            return true;
        }

        if (! empty($row['oxml_sep']) || ! empty($row['xml_sep'])) {
            return true;
        }

        return false;
    }

    public function upsertCertificado(array $data): string|int
    {
        $urlShort = trim((string) ($data['ourl_short'] ?? ''));
        if ($urlShort === '') {
            throw ValidationException::withMessages(['url_short' => ['url_short requerido para upsert legacy.']]);
        }

        $existente = $this->certificados[$urlShort] ?? null;
        if ($existente !== null && $this->isCertificadoTimbrado($existente)) {
            throw ValidationException::withMessages([
                'legacy' => ['No se puede sobrescribir un certificado legacy timbrado (osituac=F).'],
            ]);
        }

        $legacyId = $existente['id'] ?? $data['id'] ?? 'LEG-'.substr(md5($urlShort), 0, 12);
        $this->certificados[$urlShort] = array_merge($existente ?? [], $data, [
            'id' => $legacyId,
            'ourl_short' => $urlShort,
        ]);

        return $legacyId;
    }

    public function syncMaterias(string $urlShort, array $materias): int
    {
        $urlShort = trim($urlShort);
        $exportadas = 0;

        foreach ($materias as $row) {
            $clave = trim((string) ($row['oclave_materia'] ?? $row['clave'] ?? ''));
            $periodo = trim((string) ($row['operiodo'] ?? $row['periodo'] ?? ''));
            $semestre = (string) ($row['osemestre_materia'] ?? $row['semestre'] ?? '');

            $key = implode('|', [$urlShort, $clave, $periodo, $semestre]);
            $found = false;
            foreach ($this->materias as $i => $existing) {
                $eKey = implode('|', [
                    trim((string) ($existing['ourl_short_materia'] ?? $existing['url_short'] ?? '')),
                    trim((string) ($existing['oclave_materia'] ?? '')),
                    trim((string) ($existing['operiodo'] ?? '')),
                    (string) ($existing['osemestre_materia'] ?? ''),
                ]);
                if ($eKey === $key) {
                    $this->materias[$i] = array_merge($existing, $row, [
                        'ourl_short_materia' => $urlShort,
                    ]);
                    $found = true;
                    break;
                }
            }
            if (! $found) {
                $this->materias[] = array_merge($row, ['ourl_short_materia' => $urlShort]);
            }
            $exportadas++;
        }

        return $exportadas;
    }

    /** @return list<array<string, mixed>> */
    public function allMaterias(): array
    {
        return $this->materias;
    }

    public function writebackFirmaSep(
        string $urlShort,
        string $folioDigitalSep,
        ?string $xmlSep = null,
        ?string $selloSep = null,
    ): void {
        $urlShort = trim($urlShort);
        $row = $this->certificados[$urlShort] ?? null;
        if ($row === null) {
            throw ValidationException::withMessages([
                'legacy' => ['No existe certificado legacy para writeback.'],
            ]);
        }

        $this->certificados[$urlShort] = array_merge($row, [
            'ofoliodigitalsep' => $folioDigitalSep,
            'oxml_sep' => $xmlSep,
            'sellosep' => $selloSep,
            'osituac' => 'F',
            'istatus' => 'M',
        ]);
    }
}
