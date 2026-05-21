<?php

declare(strict_types=1);

namespace App\Services\SicesLegacy;

use App\Contracts\SicesLegacy\SicesLegacyCertificadoRepositoryInterface;
use App\Data\SicesLegacy\SicesLegacyCertificadoData;
use App\Data\SicesLegacy\SicesLegacyEstadoSepData;
use App\Exceptions\Legacy\SicesLegacyConnectionException;
use App\Exceptions\Legacy\SicesLegacyDisabledException;
use App\Models\Alumno;
use App\Models\DocumentoAcademico;
use App\Models\DocumentoMateriaSnapshot;
use App\Models\MateriaCursada;
use App\Services\Certificacion\AuditoriaService;
use Illuminate\Support\Collection;

class SicesLegacyConsultaService
{
    public function __construct(
        protected SicesLegacyCertificadoRepositoryInterface $repository,
        protected AuditoriaService $auditoria,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function health(): array
    {
        return $this->repository->health();
    }

    /**
     * @return array<string, mixed>
     */
    public function consultarEstadoPorAlumno(
        Alumno $alumno,
        ?int $userId = null,
        ?string $ip = null,
        ?string $userAgent = null,
    ): array {
        return $this->envolverConsulta(function () use ($alumno) {
            $curp = strtoupper(trim((string) $alumno->curp));
            $certificados = $this->repository->buscarPorCurp($curp);
            $principal = $certificados->first();

            return $this->armarRespuesta($principal, $certificados, $this->contarMateriasMysqlAlumno($alumno));
        }, 'sices_legacy.consulta_alumno', Alumno::class, $alumno->id, $userId, $ip, $userAgent);
    }

    /**
     * @return array<string, mixed>
     */
    public function consultarEstadoPorDocumento(
        DocumentoAcademico $documento,
        ?int $userId = null,
        ?string $ip = null,
        ?string $userAgent = null,
    ): array {
        return $this->envolverConsulta(function () use ($documento) {
            $documento->loadMissing(['alumno', 'matricula', 'cicloEscolar', 'urlShortToken']);
            $certificados = $this->resolverCertificadosDocumento($documento);
            $principal = $this->elegirCertificadoParaDocumento($certificados, $documento);
            $mysqlCount = $this->contarMateriasMysqlDocumento($documento);
            $comparacion = $principal
                ? $this->compararMateriasInterno($principal, $mysqlCount, $documento)
                : ['mysql' => $mysqlCount, 'sices' => 0, 'coinciden' => false, 'diferencias' => []];

            $payload = $this->armarRespuesta($principal, $certificados, $mysqlCount);
            $payload['comparacion'] = $comparacion;

            return $payload;
        }, 'sices_legacy.consulta_documento', DocumentoAcademico::class, $documento->id, $userId, $ip, $userAgent);
    }

    /**
     * @return array<string, mixed>
     */
    public function compararMateriasConDocumento(
        DocumentoAcademico $documento,
        ?int $userId = null,
        ?string $ip = null,
        ?string $userAgent = null,
    ): array {
        return $this->envolverConsulta(function () use ($documento) {
            $documento->loadMissing(['alumno', 'matricula', 'cicloEscolar', 'urlShortToken']);
            $certificados = $this->resolverCertificadosDocumento($documento);
            $principal = $this->elegirCertificadoParaDocumento($certificados, $documento);
            $mysqlCount = $this->contarMateriasMysqlDocumento($documento);

            if ($principal === null) {
                return [
                    'success' => true,
                    'estado' => SicesLegacyEstadoSepData::vacio()->toArray(),
                    'materias' => [
                        'mysql' => $mysqlCount,
                        'sices' => 0,
                        'coinciden' => false,
                        'diferencias' => ['No hay certificado en SICES legacy para comparar.'],
                    ],
                ];
            }

            return [
                'success' => true,
                'estado' => $this->estadoDesdeCertificado($principal)->toArray(),
                'materias' => $this->compararMateriasInterno($principal, $mysqlCount, $documento),
            ];
        }, 'sices_legacy.comparar_materias', DocumentoAcademico::class, $documento->id, $userId, $ip, $userAgent);
    }

    /**
     * @return array<string, mixed>
     */
    public function consultarPorCurp(string $curp, ?int $userId = null, ?string $ip = null, ?string $userAgent = null): array
    {
        return $this->envolverConsulta(function () use ($curp) {
            $certificados = $this->repository->buscarPorCurp(strtoupper(trim($curp)));

            return [
                'success' => true,
                'certificados' => $certificados->map(fn (SicesLegacyCertificadoData $c) => $c->toArray())->values()->all(),
            ];
        }, 'sices_legacy.consulta_curp', null, null, $userId, $ip, $userAgent, ['curp_prefix' => substr($curp, 0, 4).'***']);
    }

    /**
     * @return array<string, mixed>
     */
    public function consultarPorUrlShort(string $urlShort, ?int $userId = null, ?string $ip = null, ?string $userAgent = null): array
    {
        return $this->envolverConsulta(function () use ($urlShort) {
            $cert = $this->repository->buscarPorUrlShort(trim($urlShort));

            return [
                'success' => true,
                'certificado' => $cert?->toArray(),
                'estado' => $cert ? $this->estadoDesdeCertificado($cert)->toArray() : SicesLegacyEstadoSepData::vacio()->toArray(),
            ];
        }, 'sices_legacy.consulta_url_short', null, null, $userId, $ip, $userAgent, ['url_short' => $urlShort]);
    }

    /**
     * @param  callable(): array<string, mixed>  $fn
     * @param  array<string, mixed>  $auditMeta
     *
     * @return array<string, mixed>
     */
    protected function envolverConsulta(
        callable $fn,
        string $evento,
        ?string $entidadTipo,
        ?int $entidadId,
        ?int $userId,
        ?string $ip,
        ?string $userAgent,
        array $auditMeta = [],
    ): array {
        try {
            $result = $fn();
            $this->auditoria->registrar(
                $evento,
                $entidadTipo,
                $entidadId,
                array_merge(['success' => true], $auditMeta),
                $userId,
                $ip,
                $userAgent,
            );

            return $result;
        } catch (SicesLegacyDisabledException $e) {
            $this->auditoria->registrar(
                'sices_legacy.error_disabled',
                $entidadTipo,
                $entidadId,
                array_merge(['code' => 'SICES_LEGACY_DISABLED'], $auditMeta),
                $userId,
                $ip,
                $userAgent,
            );

            return $this->respuestaError($e->getMessage(), 'SICES_LEGACY_DISABLED', 503);
        } catch (SicesLegacyConnectionException $e) {
            $this->auditoria->registrar(
                'sices_legacy.error_conexion',
                $entidadTipo,
                $entidadId,
                array_merge([
                    'code' => 'SICES_LEGACY_CONNECTION',
                    'connection' => $e->connection,
                ], $auditMeta),
                $userId,
                $ip,
                $userAgent,
            );

            return $this->respuestaError($e->getMessage(), 'SICES_LEGACY_CONNECTION', 503);
        }
    }

    /**
     * @param  Collection<int, SicesLegacyCertificadoData>  $certificados
     *
     * @return array<string, mixed>
     */
    protected function armarRespuesta(
        ?SicesLegacyCertificadoData $principal,
        Collection $certificados,
        int $mysqlMaterias,
    ): array {
        $estado = $principal
            ? $this->estadoDesdeCertificado($principal)
            : SicesLegacyEstadoSepData::vacio();

        $sicesMaterias = 0;
        $diferencias = [];
        if ($principal !== null) {
            $sicesMaterias = $this->repository->obtenerMateriasPorCertificado($principal)->count();
            if ($mysqlMaterias !== $sicesMaterias) {
                $diferencias[] = "Conteo de materias: MySQL={$mysqlMaterias}, SICES={$sicesMaterias}.";
            }
        }

        return [
            'success' => true,
            'estado' => $estado->toArray(),
            'certificado' => $principal?->toArray(),
            'certificados_encontrados' => $certificados->count(),
            'materias' => [
                'mysql' => $mysqlMaterias,
                'sices' => $sicesMaterias,
                'coinciden' => $diferencias === [] && $principal !== null,
                'diferencias' => $diferencias,
            ],
            'enlaces' => $this->enlacesConsulta($principal),
        ];
    }

    protected function estadoDesdeCertificado(SicesLegacyCertificadoData $cert): SicesLegacyEstadoSepData
    {
        return new SicesLegacyEstadoSepData(
            existeEnSices: true,
            timbrado: $cert->timbrado(),
            pdfGenerado: $cert->pdfGenerado(),
            folioDigitalSep: $cert->folioDigitalSep,
            urlShort: $cert->urlShort,
            tipoCertificado: $cert->tipoCertificado,
            cicloEscolar: $cert->cicloEscolar,
            osituac: $cert->osituac,
            istatus: $cert->istatus,
            ultimaActualizacion: $cert->fechaModificacion,
        );
    }

    /**
     * @return Collection<int, SicesLegacyCertificadoData>
     */
    protected function resolverCertificadosDocumento(DocumentoAcademico $documento): Collection
    {
        $urlShort = $documento->urlShortToken?->token
            ?? (is_array($documento->metadata) ? ($documento->metadata['url_short'] ?? null) : null);

        if ($urlShort) {
            $uno = $this->repository->buscarPorUrlShort((string) $urlShort);

            return $uno ? collect([$uno]) : collect();
        }

        $curp = strtoupper(trim((string) $documento->alumno?->curp));
        if ($curp !== '') {
            return $this->repository->buscarPorCurp($curp);
        }

        $mat = trim((string) ($documento->matricula?->matricula ?? ''));
        if ($mat !== '') {
            return $this->repository->buscarPorMatricula($mat);
        }

        return collect();
    }

    /**
     * @param  Collection<int, SicesLegacyCertificadoData>  $certificados
     */
    protected function elegirCertificadoParaDocumento(Collection $certificados, DocumentoAcademico $documento): ?SicesLegacyCertificadoData
    {
        if ($certificados->isEmpty()) {
            return null;
        }

        $tipoMysql = $this->mapTipoCertificacionMysqlASices($documento->tipo_certificacion);
        $ciclo = $documento->cicloEscolar?->nombre ?? $documento->cicloEscolar?->clave;

        $filtrado = $certificados->filter(function (SicesLegacyCertificadoData $c) use ($tipoMysql, $ciclo) {
            $okTipo = $tipoMysql === null || strtoupper((string) $c->tipoCertificado) === $tipoMysql;
            $okCiclo = $ciclo === null || trim((string) $c->cicloEscolar) === trim((string) $ciclo);

            return $okTipo && $okCiclo;
        });

        return $filtrado->first() ?? $certificados->first();
    }

    protected function mapTipoCertificacionMysqlASices(?string $tipo): ?string
    {
        return match (strtolower(trim((string) $tipo))) {
            'parcial' => 'P',
            'total' => 'T',
            default => null,
        };
    }

    protected function contarMateriasMysqlAlumno(Alumno $alumno): int
    {
        return (int) MateriaCursada::query()->where('alumno_id', $alumno->id)->count();
    }

    protected function contarMateriasMysqlDocumento(DocumentoAcademico $documento): int
    {
        $snap = (int) DocumentoMateriaSnapshot::query()
            ->where('documento_academico_id', $documento->id)
            ->count();
        if ($snap > 0) {
            return $snap;
        }

        if ($documento->alumno_id) {
            return $this->contarMateriasMysqlAlumno($documento->alumno);
        }

        return 0;
    }

    /**
     * @return array{mysql: int, sices: int, coinciden: bool, diferencias: list<string>}
     */
    protected function compararMateriasInterno(
        SicesLegacyCertificadoData $cert,
        int $mysqlCount,
        DocumentoAcademico $documento,
    ): array {
        $sicesMaterias = $this->repository->obtenerMateriasPorCertificado($cert);
        $sicesCount = $sicesMaterias->count();
        $diferencias = [];

        if ($mysqlCount !== $sicesCount) {
            $diferencias[] = "Conteo: MySQL={$mysqlCount}, SICES={$sicesCount}.";
        }

        $clavesMysql = DocumentoMateriaSnapshot::query()
            ->where('documento_academico_id', $documento->id)
            ->pluck('clave')
            ->map(fn ($c) => strtoupper(trim((string) $c)))
            ->filter()
            ->values()
            ->all();

        if ($clavesMysql === [] && $documento->alumno_id) {
            $clavesMysql = MateriaCursada::query()
                ->where('alumno_id', $documento->alumno_id)
                ->pluck('clave')
                ->map(fn ($c) => strtoupper(trim((string) $c)))
                ->filter()
                ->values()
                ->all();
        }

        $clavesSices = $sicesMaterias
            ->map(fn ($m) => strtoupper(trim((string) $m->clave)))
            ->filter()
            ->values()
            ->all();

        $soloMysql = array_values(array_diff($clavesMysql, $clavesSices));
        $soloSices = array_values(array_diff($clavesSices, $clavesMysql));

        if ($soloMysql !== []) {
            $diferencias[] = 'Materias solo en MySQL: '.implode(', ', array_slice($soloMysql, 0, 10));
        }
        if ($soloSices !== []) {
            $diferencias[] = 'Materias solo en SICES: '.implode(', ', array_slice($soloSices, 0, 10));
        }

        return [
            'mysql' => $mysqlCount,
            'sices' => $sicesCount,
            'coinciden' => $diferencias === [],
            'diferencias' => $diferencias,
        ];
    }

    /**
     * @return array<string, string|null>
     */
    protected function enlacesConsulta(?SicesLegacyCertificadoData $cert): array
    {
        if ($cert === null || trim((string) $cert->urlShort) === '') {
            return [
                'sices_legacy' => null,
                'consulta_publica_sep' => null,
                'pdf' => null,
            ];
        }

        $base = rtrim((string) config('sices_legacy.base_url'), '/');
        $sepBase = rtrim((string) config('sices_legacy.consulta_publica_sep_url'), '/');
        $short = $cert->urlShort;

        return [
            'sices_legacy' => $base !== '' ? $base.'/?c='.$short : null,
            'consulta_publica_sep' => $sepBase.'?c='.$short,
            'pdf' => $cert->pdfGenerado() ? null : null,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    protected function respuestaError(string $message, string $code, int $httpSuggested = 503): array
    {
        return [
            'success' => false,
            'error' => $message,
            'code' => $code,
            'http_status' => $httpSuggested,
            'estado' => SicesLegacyEstadoSepData::vacio()->toArray(),
            'materias' => [
                'mysql' => 0,
                'sices' => 0,
                'coinciden' => false,
                'diferencias' => [],
            ],
        ];
    }
}
