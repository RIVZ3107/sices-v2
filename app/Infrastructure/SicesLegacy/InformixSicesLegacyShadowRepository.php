<?php

declare(strict_types=1);

namespace App\Infrastructure\SicesLegacy;

use App\Contracts\SicesLegacy\SicesLegacyShadowRepositoryInterface;
use App\Exceptions\Legacy\SicesLegacyConnectionException;
use App\Exceptions\Legacy\SicesLegacyDisabledException;
use App\Exceptions\Legacy\SicesLegacyShadowDisabledException;
use App\Support\SicesLegacy\SicesLegacyTextEncoding;
use Illuminate\Database\Connection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Throwable;

class InformixSicesLegacyShadowRepository implements SicesLegacyShadowRepositoryInterface
{
    public function findCertificadoByUrlShort(string $urlShort): ?array
    {
        $this->assertShadowWritePermitido();
        $c = config('sices_legacy.columns.certificado');
        $urlShort = trim($urlShort);

        try {
            $row = $this->connection()
                ->table($this->tablaCertificado())
                ->where($c['url_short'], $urlShort)
                ->first();

            if ($row === null) {
                return null;
            }

            return $this->mapCertificadoRow($row);
        } catch (SicesLegacyDisabledException|SicesLegacyShadowDisabledException $e) {
            throw $e;
        } catch (Throwable $e) {
            throw new SicesLegacyConnectionException(
                'Error al consultar certificado legacy: '.$e->getMessage(),
                (string) config('sices_legacy.connection'),
            );
        }
    }

    public function isCertificadoTimbrado(array $row): bool
    {
        $c = config('sices_legacy.columns.certificado');
        $situac = strtoupper(trim((string) ($row[$c['situacion']] ?? $row['osituac'] ?? '')));
        if ($situac === 'F') {
            return true;
        }

        $folio = trim((string) ($row[$c['folio_digital']] ?? $row['ofoliodigitalsep'] ?? ''));
        if ($folio !== '') {
            return true;
        }

        $xmlSep = $row[$c['xml_sep']] ?? $row['oxml_sep'] ?? null;
        if ($xmlSep !== null && trim((string) $xmlSep) !== '') {
            return true;
        }

        return false;
    }

    public function upsertCertificado(array $data): string|int
    {
        $this->assertShadowWritePermitido();
        $urlShort = trim((string) ($data['ourl_short'] ?? ''));
        if ($urlShort === '') {
            throw ValidationException::withMessages(['url_short' => ['url_short requerido.']]);
        }

        $existente = $this->findCertificadoByUrlShort($urlShort);
        if ($existente !== null && $this->isCertificadoTimbrado($existente)) {
            throw ValidationException::withMessages([
                'legacy' => ['El certificado legacy está timbrado; no se permite sobrescritura.'],
            ]);
        }

        $c = config('sices_legacy.columns.certificado');
        $tabla = $this->tablaCertificado();
        $payload = $this->encodeRowForInformix($data);

        return DB::connection((string) config('sices_legacy.connection'))->transaction(function () use (
            $existente,
            $c,
            $tabla,
            $payload,
            $urlShort
        ) {
            $db = $this->connection();

            if ($existente !== null) {
                $update = $this->filtrarColumnasProtegidas($payload);
                $db->table($tabla)
                    ->where($c['url_short'], $urlShort)
                    ->update($update);

                return $existente[$c['id']] ?? $existente['id'] ?? $urlShort;
            }

            $db->table($tabla)->insert($payload);

            $row = $db->table($tabla)->where($c['url_short'], $urlShort)->first();

            return $row?->{$c['id']} ?? $urlShort;
        });
    }

    public function syncMaterias(string $urlShort, array $materias): int
    {
        $this->assertShadowWritePermitido();
        $cMat = config('sices_legacy.columns.materias');
        $tabla = $this->tablaMaterias();
        $urlShort = trim($urlShort);
        $exportadas = 0;

        return (int) DB::connection((string) config('sices_legacy.connection'))->transaction(function () use (
            $materias,
            $cMat,
            $tabla,
            $urlShort,
            &$exportadas
        ) {
            $db = $this->connection();

            foreach ($materias as $materia) {
                $row = $this->encodeRowForInformix($materia);
                $clave = trim((string) ($row[$cMat['clave']] ?? ''));
                $periodo = trim((string) ($row[$cMat['periodo']] ?? ''));
                $semestre = $row[$cMat['semestre']] ?? null;

                $query = $db->table($tabla)
                    ->where($cMat['url_short_materia'], $urlShort)
                    ->where($cMat['clave'], $clave);

                if ($periodo !== '') {
                    $query->where($cMat['periodo'], $periodo);
                }
                if ($semestre !== null && $semestre !== '') {
                    $query->where($cMat['semestre'], $semestre);
                }

                $existente = $query->first();
                if ($existente !== null) {
                    $query->update($row);
                } else {
                    $db->table($tabla)->insert($row);
                }
                $exportadas++;
            }

            return $exportadas;
        });
    }

    protected function assertShadowWritePermitido(): void
    {
        if (! config('sices_legacy.enabled')) {
            throw new SicesLegacyDisabledException;
        }

        if (! config('sices_legacy.shadow_enabled')) {
            throw new SicesLegacyShadowDisabledException(
                'SICES_LEGACY_SHADOW_ENABLED=false: exportación shadow deshabilitada.',
            );
        }

        if (! config('sices_legacy.write_enabled')) {
            throw new SicesLegacyShadowDisabledException(
                'SICES_LEGACY_WRITE_ENABLED=false: escritura legacy deshabilitada.',
            );
        }

        if (config('sices_legacy.read_only')) {
            throw new SicesLegacyShadowDisabledException(
                'SICES_LEGACY_READ_ONLY=true: no se permite escritura shadow.',
            );
        }
    }

    /**
     * @return array<string, mixed>
     */
    protected function mapCertificadoRow(object $row): array
    {
        $c = config('sices_legacy.columns.certificado');
        $out = [];
        foreach ($c as $key => $col) {
            if (isset($row->{$col})) {
                $out[$col] = $row->{$col};
                $out[$key] = $row->{$col};
            }
        }

        return $out;
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    protected function encodeRowForInformix(array $data): array
    {
        $encoded = [];
        foreach ($data as $key => $value) {
            if (is_string($value)) {
                $encoded[$key] = SicesLegacyTextEncoding::fromUtf8($value);
            } else {
                $encoded[$key] = $value;
            }
        }

        return $encoded;
    }

    /**
     * No sobrescribe campos post-firma SEP.
     *
     * @param  array<string, mixed>  $payload
     * @return array<string, mixed>
     */
    protected function filtrarColumnasProtegidas(array $payload): array
    {
        $c = config('sices_legacy.columns.certificado');
        unset(
            $payload[$c['folio_digital'] ?? 'ofoliodigitalsep'],
            $payload[$c['xml_sep'] ?? 'oxml_sep'],
            $payload['oxml_sep'],
            $payload['ofoliodigitalsep'],
            $payload['sellosep'],
        );

        return $payload;
    }

    protected function connection(): Connection
    {
        return DB::connection((string) config('sices_legacy.connection'));
    }

    protected function tablaCertificado(): string
    {
        return (string) config('sices_legacy.tables.certificado');
    }

    protected function tablaMaterias(): string
    {
        return (string) config('sices_legacy.tables.materias');
    }

    public function writebackFirmaSep(
        string $urlShort,
        string $folioDigitalSep,
        ?string $xmlSep = null,
        ?string $selloSep = null,
    ): void {
        if (! config('sices_legacy.writeback_enabled')) {
            return;
        }

        $this->assertShadowWritePermitido();
        $c = config('sices_legacy.columns.certificado');
        $urlShort = trim($urlShort);

        $update = [
            $c['folio_digital'] => SicesLegacyTextEncoding::fromUtf8($folioDigitalSep),
            $c['situacion'] => 'F',
        ];
        if (isset($c['status'])) {
            $update[$c['status']] = 'M';
        }

        if ($xmlSep !== null && isset($c['xml_sep'])) {
            $update[$c['xml_sep']] = SicesLegacyTextEncoding::fromUtf8($xmlSep);
        }

        $this->connection()
            ->table($this->tablaCertificado())
            ->where($c['url_short'], $urlShort)
            ->update($update);
    }
}
