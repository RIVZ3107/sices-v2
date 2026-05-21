<?php

declare(strict_types=1);

namespace App\Infrastructure\SicesLegacy;

use App\Contracts\SicesLegacy\SicesLegacyCertificadoRepositoryInterface;
use App\Data\SicesLegacy\SicesLegacyCertificadoData;
use App\Data\SicesLegacy\SicesLegacyMateriaData;
use App\Exceptions\Legacy\SicesLegacyConnectionException;
use App\Exceptions\Legacy\SicesLegacyDisabledException;
use App\Support\SicesLegacy\SicesLegacyTextEncoding;
use Illuminate\Database\Connection;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Throwable;

/**
 * Repositorio de solo lectura sobre Informix (SICES legacy).
 * No ejecuta INSERT/UPDATE/DELETE.
 */
class InformixSicesLegacyCertificadoRepository implements SicesLegacyCertificadoRepositoryInterface
{
    public function buscarPorCurp(string $curp): Collection
    {
        $this->assertConsultaPermitida();
        $curp = strtoupper(trim($curp));
        $cols = $this->columnasCertificadoSelect();

        $rows = $this->runSelect(function (Connection $db) use ($curp, $cols) {
            $c = config('sices_legacy.columns.certificado');

            return $db->table($this->tablaCertificado())
                ->select($cols)
                ->where($c['curp'], $curp)
                ->orderByDesc($c['fecha_mod'])
                ->limit(25)
                ->get();
        });

        return $rows->map(fn ($row) => $this->mapCertificado($row));
    }

    public function buscarPorMatricula(string $matricula): Collection
    {
        $this->assertConsultaPermitida();
        $matricula = trim($matricula);
        $cols = $this->columnasCertificadoSelect();

        $rows = $this->runSelect(function (Connection $db) use ($matricula, $cols) {
            $c = config('sices_legacy.columns.certificado');

            return $db->table($this->tablaCertificado())
                ->select($cols)
                ->where($c['matricula'], $matricula)
                ->orderByDesc($c['fecha_mod'])
                ->limit(25)
                ->get();
        });

        return $rows->map(fn ($row) => $this->mapCertificado($row));
    }

    public function buscarPorUrlShort(string $urlShort): ?SicesLegacyCertificadoData
    {
        $this->assertConsultaPermitida();
        $urlShort = trim($urlShort);
        $cols = $this->columnasCertificadoSelect();

        $row = $this->runSelect(function (Connection $db) use ($urlShort, $cols) {
            $c = config('sices_legacy.columns.certificado');

            return $db->table($this->tablaCertificado())
                ->select($cols)
                ->where($c['url_short'], $urlShort)
                ->first();
        });

        return $row ? $this->mapCertificado($row) : null;
    }

    public function obtenerMateriasPorCertificado(SicesLegacyCertificadoData $certificado): Collection
    {
        $this->assertConsultaPermitida();
        $cCert = config('sices_legacy.columns.certificado');
        $cMat = config('sices_legacy.columns.materias');

        $curp = strtoupper(trim((string) $certificado->curp));
        $ciclo = trim((string) $certificado->cicloEscolar);
        $tipo = strtoupper(trim((string) $certificado->tipoCertificado));

        if ($curp === '' || $ciclo === '' || $tipo === '') {
            return collect();
        }

        $rows = $this->runSelect(function (Connection $db) use ($curp, $ciclo, $tipo, $cMat) {
            return $db->table($this->tablaMaterias())
                ->select([
                    $cMat['clave'],
                    $cMat['nombre'],
                    $cMat['calificacion'],
                    $cMat['semestre'],
                    $cMat['periodo'],
                    $cMat['ciclo'],
                    $cMat['tipo_cert'],
                    $cMat['url_short_materia'],
                ])
                ->where($cMat['curp'], $curp)
                ->where($cMat['ciclo'], $ciclo)
                ->where($cMat['tipo_cert'], $tipo)
                ->orderBy($cMat['semestre'])
                ->limit(500)
                ->get();
        });

        return $rows->map(fn ($row) => $this->mapMateria($row, $cMat));
    }

    public function obtenerEstadoPdf(string $urlShort): array
    {
        $cert = $this->buscarPorUrlShort($urlShort);

        return [
            'pdf_generado' => $cert?->pdfGenerado() ?? false,
            'url_short' => $cert?->urlShort,
        ];
    }

    public function health(): array
    {
        $enabled = (bool) config('sices_legacy.enabled');
        $readOnly = (bool) config('sices_legacy.read_only');
        $connection = (string) config('sices_legacy.connection');

        if (! $enabled) {
            return [
                'enabled' => false,
                'read_only' => $readOnly,
                'connection' => $connection,
                'reachable' => false,
                'message' => 'SICES legacy deshabilitado (SICES_LEGACY_ENABLED=false).',
            ];
        }

        try {
            $this->assertReadOnlyConfig();
            $db = $this->connection();
            $db->getPdo();

            return [
                'enabled' => true,
                'read_only' => $readOnly,
                'connection' => $connection,
                'reachable' => true,
                'message' => 'Conexión Informix operativa (consulta de prueba).',
            ];
        } catch (Throwable $e) {
            return [
                'enabled' => true,
                'read_only' => $readOnly,
                'connection' => $connection,
                'reachable' => false,
                'message' => 'No se pudo validar la conexión Informix.',
                'error_code' => class_basename($e),
            ];
        }
    }

    protected function assertConsultaPermitida(): void
    {
        if (! config('sices_legacy.enabled')) {
            throw new SicesLegacyDisabledException;
        }
        $this->assertReadOnlyConfig();
    }

    protected function assertReadOnlyConfig(): void
    {
        if (! config('sices_legacy.read_only')) {
            throw new SicesLegacyConnectionException(
                'SICES legacy en modo no seguro: SICES_LEGACY_READ_ONLY debe ser true en esta fase.',
                (string) config('sices_legacy.connection'),
            );
        }
    }

    protected function connection(): Connection
    {
        return DB::connection((string) config('sices_legacy.connection'));
    }

    /**
     * @template T
     *
     * @param  callable(Connection): T  $callback
     * @return T
     */
    protected function runSelect(callable $callback): mixed
    {
        try {
            return $callback($this->connection());
        } catch (SicesLegacyDisabledException $e) {
            throw $e;
        } catch (Throwable $e) {
            throw new SicesLegacyConnectionException(
                'Error al consultar SICES legacy: '.$e->getMessage(),
                (string) config('sices_legacy.connection'),
            );
        }
    }

    protected function tablaCertificado(): string
    {
        return (string) config('sices_legacy.tables.certificado');
    }

    protected function tablaMaterias(): string
    {
        return (string) config('sices_legacy.tables.materias');
    }

    /**
     * @return list<string>
     */
    protected function columnasCertificadoSelect(): array
    {
        $c = config('sices_legacy.columns.certificado');

        return [
            $c['id'],
            $c['curp'],
            $c['matricula'],
            $c['nombre'],
            $c['primer_apellido'],
            $c['segundo_apellido'],
            $c['tipo_cert'],
            $c['ciclo'],
            $c['url_short'],
            $c['folio_digital'],
            $c['situacion'],
            $c['status'],
            $c['pdf'],
            $c['fecha_mod'],
            $c['cve_institucion'],
            $c['cve_carrera'],
            $c['plan'],
            DB::raw("CASE WHEN {$c['xml_local']} IS NOT NULL AND LENGTH(TRIM(CAST({$c['xml_local']} AS VARCHAR(10)))) > 0 THEN 1 ELSE 0 END AS tiene_xml_local_flag"),
            DB::raw("CASE WHEN {$c['xml_sep']} IS NOT NULL THEN 1 ELSE 0 END AS tiene_xml_sep_flag"),
        ];
    }

    protected function mapCertificado(object $row): SicesLegacyCertificadoData
    {
        $c = config('sices_legacy.columns.certificado');
        $nombre = trim(implode(' ', array_filter([
            SicesLegacyTextEncoding::toUtf8($row->{$c['nombre']} ?? null),
            SicesLegacyTextEncoding::toUtf8($row->{$c['primer_apellido']} ?? null),
            SicesLegacyTextEncoding::toUtf8($row->{$c['segundo_apellido']} ?? null),
        ])));

        $instNombre = $this->resolverNombreInstitucion(
            $row->{$c['cve_institucion']} ?? null,
            $row->{$c['cve_carrera']} ?? null,
        );

        return new SicesLegacyCertificadoData(
            idSices: isset($row->{$c['id']}) ? (int) $row->{$c['id']} : null,
            curp: SicesLegacyTextEncoding::toUtf8($row->{$c['curp']} ?? null),
            matricula: SicesLegacyTextEncoding::toUtf8($row->{$c['matricula']} ?? null),
            nombreCompleto: $nombre !== '' ? $nombre : null,
            tipoCertificado: SicesLegacyTextEncoding::toUtf8($row->{$c['tipo_cert']} ?? null),
            cicloEscolar: SicesLegacyTextEncoding::toUtf8($row->{$c['ciclo']} ?? null),
            urlShort: SicesLegacyTextEncoding::toUtf8($row->{$c['url_short']} ?? null),
            folioDigitalSep: SicesLegacyTextEncoding::toUtf8($row->{$c['folio_digital']} ?? null),
            osituac: SicesLegacyTextEncoding::toUtf8($row->{$c['situacion']} ?? null),
            istatus: SicesLegacyTextEncoding::toUtf8($row->{$c['status']} ?? null),
            opdf: isset($row->{$c['pdf']}) ? (int) $row->{$c['pdf']} : null,
            tieneXmlLocal: (int) ($row->tiene_xml_local_flag ?? 0) === 1,
            tieneXmlSep: (int) ($row->tiene_xml_sep_flag ?? 0) === 1,
            fechaModificacion: SicesLegacyTextEncoding::toUtf8($row->{$c['fecha_mod']} ?? null),
            institucion: $instNombre,
            cct: null,
            carrera: SicesLegacyTextEncoding::toUtf8($row->{$c['cve_carrera']} ?? null),
            planEstudios: SicesLegacyTextEncoding::toUtf8($row->{$c['plan']} ?? null),
            raw: ['source' => 'informix_readonly'],
        );
    }

    /**
     * @param  array<string, string>  $cMat
     */
    protected function mapMateria(object $row, array $cMat): SicesLegacyMateriaData
    {
        return new SicesLegacyMateriaData(
            clave: SicesLegacyTextEncoding::toUtf8($row->{$cMat['clave']} ?? null),
            nombre: SicesLegacyTextEncoding::toUtf8($row->{$cMat['nombre']} ?? null),
            calificacion: SicesLegacyTextEncoding::toUtf8($row->{$cMat['calificacion']} ?? null),
            semestre: SicesLegacyTextEncoding::toUtf8($row->{$cMat['semestre']} ?? null),
            periodo: SicesLegacyTextEncoding::toUtf8($row->{$cMat['periodo']} ?? null),
            ciclo: SicesLegacyTextEncoding::toUtf8($row->{$cMat['ciclo']} ?? null),
            tipoCertificado: SicesLegacyTextEncoding::toUtf8($row->{$cMat['tipo_cert']} ?? null),
            urlShortMateria: SicesLegacyTextEncoding::toUtf8($row->{$cMat['url_short_materia']} ?? null),
            raw: ['source' => 'informix_readonly'],
        );
    }

    protected function resolverNombreInstitucion(mixed $cveInst, mixed $cveCarrera): ?string
    {
        if ($cveInst === null && $cveCarrera === null) {
            return null;
        }

        try {
            $ci = config('sices_legacy.columns.instituciones');
            $row = $this->runSelect(function (Connection $db) use ($cveInst, $cveCarrera, $ci) {
                $q = $db->table((string) config('sices_legacy.tables.instituciones'))
                    ->select([$ci['nombre'], $ci['cct']])
                    ->limit(1);
                if ($cveInst !== null) {
                    $q->where($ci['cve_institucion'], $cveInst);
                }
                if ($cveCarrera !== null) {
                    $q->where($ci['cve_carrera'], $cveCarrera);
                }

                return $q->first();
            });

            return $row ? SicesLegacyTextEncoding::toUtf8($row->{$ci['nombre']} ?? null) : null;
        } catch (Throwable) {
            return null;
        }
    }
}
