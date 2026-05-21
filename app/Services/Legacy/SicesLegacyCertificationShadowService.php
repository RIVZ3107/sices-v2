<?php

declare(strict_types=1);

namespace App\Services\Legacy;

use App\Data\Legacy\LegacyShadowResult;
use App\Exceptions\Legacy\InformixNotEnabledException;
use App\Exceptions\Legacy\InformixWriteDisabledException;
use App\Models\CadenaOriginalGenerada;
use App\Models\DocumentoAcademico;
use App\Models\DocumentoVersion;
use App\Models\UrlShortToken;
use App\Services\Certificacion\AuditoriaService;
use App\Services\Certificacion\DocumentoPreflightValidator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Sincroniza el documento congelado de SICES v2 hacia tablas Informix legacy
 * que el servicio 34 resuelve por urlshort.
 *
 * Columnas objetivo documentadas (e11superior_cert / e11materias_cert):
 * - ourl_short, ocadena_original, oxml, osellocertficado
 * - datos alumno, CURP, matrícula, CCT, institución, carrera, modalidad, plan
 * - promedio, créditos, total asignaturas, tipo certificado
 * - materias: clave, calificación, semestre, periodo
 * - post-firma opcional: oxml_sep, ofoliodigitalsep, sellosep, osituac, istatus
 */
class SicesLegacyCertificationShadowService
{
    public function __construct(
        protected DocumentoPreflightValidator $preflight,
        protected AuditoriaService $auditoria,
    ) {}

    public function syncForSigning(DocumentoAcademico $documento): LegacyShadowResult
    {
        if (! config('informix.enabled')) {
            throw new InformixNotEnabledException('INFORMIX_ENABLED=false: no se puede sincronizar shadow legacy.');
        }

        if (! config('informix.write_enabled')) {
            throw new InformixWriteDisabledException('INFORMIX_WRITE_ENABLED=false: escritura shadow deshabilitada.');
        }

        $this->preflight->assertListoParaFirmaTecnica($documento);

        $documento->loadMissing(['alumno', 'sede', 'institucion', 'materiasSnapshot', 'matricula']);

        $urlShort = $this->resolverUrlShort($documento);
        $cadena = $this->resolverCadena($documento);
        $xml = $this->resolverXml($documento);
        $meta = is_array($documento->metadata) ? $documento->metadata : [];
        $sello = (string) ($meta['sello_local'] ?? $meta['sello_local_base64'] ?? '');

        $payload = $this->buildShadowPayload($documento, $urlShort, $cadena, $xml, $sello);

        return DB::connection((string) config('informix.connection'))->transaction(function () use ($documento, $payload, $urlShort): LegacyShadowResult {
            $legacyId = $this->upsertCertificadoLegacy($payload);
            $this->syncMateriasLegacy($legacyId, $documento);

            $metaDoc = is_array($documento->metadata) ? $documento->metadata : [];
            $documento->metadata = array_merge($metaDoc, [
                'legacy_shadow' => [
                    'legacy_cert_id' => $legacyId,
                    'url_short' => $urlShort,
                    'synced_at' => now()->toIso8601String(),
                ],
            ]);
            $documento->save();

            $this->auditoria->registrar(
                'legacy.informix.shadow_sync',
                DocumentoAcademico::class,
                $documento->id,
                ['legacy_cert_id' => $legacyId, 'url_short' => $urlShort],
            );

            return new LegacyShadowResult(
                success: true,
                message: 'Shadow Informix sincronizado para firma.',
                legacyCertId: $legacyId,
                urlShort: $urlShort,
                metadata: ['tabla_cert' => config('informix.tables.certificado')],
            );
        });
    }

    /**
     * @return array<string, mixed>
     */
    protected function buildShadowPayload(
        DocumentoAcademico $documento,
        string $urlShort,
        string $cadena,
        string $xml,
        string $sello,
    ): array {
        $alumno = $documento->alumno;

        return [
            'ourl_short' => $urlShort,
            'ocadena_original' => $cadena,
            'oxml' => $xml,
            'osellocertficado' => $sello,
            'curp' => $alumno?->curp,
            'nombre' => $alumno?->nombre,
            'paterno' => $alumno?->primer_apellido,
            'materno' => $alumno?->segundo_apellido,
            'matricula' => $documento->matricula?->matricula,
            'cct' => $documento->sede?->clave,
            'institucion' => $documento->institucion?->nombre,
            'carrera' => $documento->ofertaAcademica?->programaEstudio?->nombre ?? null,
            'modalidad' => $documento->ofertaAcademica?->modalidad ?? null,
            'plan' => $documento->ofertaAcademica?->planEstudio?->nombre ?? null,
            'tipo_certificado' => $documento->tipo_documento,
            'documento_academico_id' => $documento->id,
        ];
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    protected function upsertCertificadoLegacy(array $payload): string
    {
        throw ValidationException::withMessages([
            'informix' => [
                'TODO: implementar upsert en '.config('informix.tables.certificado')
                .' (ourl_short, ocadena_original, oxml, osellocertficado, datos alumno) con bindings Informix.',
            ],
        ]);
    }

    protected function syncMateriasLegacy(string $legacyCertId, DocumentoAcademico $documento): void
    {
        throw ValidationException::withMessages([
            'informix' => [
                'TODO: implementar sync en '.config('informix.tables.materias_cert')
                .' para legacy_cert_id='.$legacyCertId.' desde snapshot (clave, calificación, semestre, periodo).',
            ],
        ]);
    }

    protected function resolverUrlShort(DocumentoAcademico $documento): string
    {
        $token = $documento->token_consulta_publica
            ?? UrlShortToken::query()
                ->where('documento_academico_id', $documento->id)
                ->where('estado', 'activo')
                ->value('token');

        if ($token === null || trim((string) $token) === '') {
            throw ValidationException::withMessages([
                'url_short' => ['No hay urlshort activo para shadow legacy.'],
            ]);
        }

        return (string) $token;
    }

    protected function resolverCadena(DocumentoAcademico $documento): string
    {
        $cadena = CadenaOriginalGenerada::query()
            ->where('documento_academico_id', $documento->id)
            ->orderByDesc('version')
            ->first();

        return trim((string) ($cadena?->cadena_original ?? ''));
    }

    protected function resolverXml(DocumentoAcademico $documento): string
    {
        $xml = DocumentoVersion::query()
            ->where('documento_academico_id', $documento->id)
            ->where('tipo', 'XML_ORIGINAL')
            ->where('activo', true)
            ->orderByDesc('version')
            ->first();

        return trim((string) ($xml?->contenido ?? ''));
    }
}
