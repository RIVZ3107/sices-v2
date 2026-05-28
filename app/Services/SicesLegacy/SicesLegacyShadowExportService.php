<?php

declare(strict_types=1);

namespace App\Services\SicesLegacy;

use App\Contracts\SicesLegacy\SicesLegacyShadowRepositoryInterface;
use App\Data\SicesLegacy\ShadowExportResult;
use App\Enums\Certificacion\EstadoCadena;
use App\Enums\Certificacion\EstadoFirma;
use App\Enums\Certificacion\EstadoWorkflow;
use App\Enums\Certificacion\EstadoXml;
use App\Exceptions\Legacy\SicesLegacyShadowDisabledException;
use App\Models\CadenaOriginalGenerada;
use App\Models\DocumentoAcademico;
use App\Models\DocumentoMateriaSnapshot;
use App\Models\DocumentoPayload;
use App\Models\DocumentoVersion;
use App\Models\UrlShortToken;
use App\Services\Certificacion\AuditoriaService;
use App\Services\Certificacion\DocumentoPreflightValidator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Throwable;

class SicesLegacyShadowExportService
{
    public function __construct(
        protected SicesLegacyShadowRepositoryInterface $shadowRepository,
        protected DocumentoPreflightValidator $preflightValidator,
        protected AuditoriaService $auditoria,
        protected LegacyCertificadoTimbradoJsonService $timbradoJson,
    ) {}

    public function exportarDocumentoParaFirma(
        DocumentoAcademico $documento,
        ?int $userId = null,
    ): ShadowExportResult {
        $documento = $documento->fresh() ?? $documento;

        try {
            $this->assertExportacionHabilitada();
        } catch (SicesLegacyShadowDisabledException $e) {
            return $this->fallo(
                $documento,
                [$e->getMessage()],
                $userId,
                'Exportación shadow deshabilitada por configuración.',
            );
        }

        $this->auditoria->registrar(
            evento: 'sices_legacy.shadow_export_intento',
            entidadTipo: DocumentoAcademico::class,
            entidadId: $documento->id,
            payload: ['documento_id' => $documento->id],
            userId: $userId,
        );

        $errores = $this->collectExportErrors($documento);
        if ($errores !== []) {
            return $this->fallo($documento, $errores, $userId);
        }

        try {
            $this->preflightValidator->assertListoParaFirmaTecnica($documento);
        } catch (ValidationException $e) {
            $flat = collect($e->errors())->flatten()->values()->all();

            return $this->fallo($documento, $flat, $userId);
        }

        $documento->loadMissing([
            'alumno',
            'matricula',
            'sede',
            'institucion',
            'cicloEscolar',
            'ofertaAcademica.programaEstudio',
            'ofertaAcademica.planEstudio',
            'materiasSnapshot',
        ]);

        $urlShort = $this->resolverUrlShort($documento);
        $cadena = $this->resolverCadena($documento);
        $xml = $this->resolverXml($documento);
        $meta = is_array($documento->metadata) ? $documento->metadata : [];
        $sello = (string) ($meta['sello_local'] ?? $meta['sello_local_base64'] ?? '');

        $certData = $this->buildCertificadoLegacyRow($documento, $urlShort, $cadena, $xml, $sello);
        $materiasRows = $this->buildMateriasLegacyRows($documento, $urlShort, $certData);

        try {
            $resultado = DB::connection(config('database.default'))->transaction(function () use (
                $documento,
                $certData,
                $materiasRows,
                $urlShort,
                $userId
            ) {
                $legacyId = $this->shadowRepository->upsertCertificado($certData);
                $materiasExportadas = $this->shadowRepository->syncMaterias($urlShort, $materiasRows);

                $metaDoc = is_array($documento->metadata) ? $documento->metadata : [];
                $documento->metadata = array_merge($metaDoc, [
                    'legacy_shadow' => [
                        'exported' => true,
                        'legacy_cert_id' => (string) $legacyId,
                        'url_short' => $urlShort,
                        'materias_exportadas' => $materiasExportadas,
                        'exported_at' => now()->toIso8601String(),
                        'last_success_at' => now()->toIso8601String(),
                        'exported_by' => $userId,
                        'last_error' => null,
                        'last_attempt_at' => now()->toIso8601String(),
                    ],
                ]);
                $documento->save();

                return [$legacyId, $materiasExportadas];
            });

            [$legacyId, $materiasExportadas] = $resultado;

            $this->auditoria->registrar(
                evento: 'sices_legacy.shadow_export_ok',
                entidadTipo: DocumentoAcademico::class,
                entidadId: $documento->id,
                payload: [
                    'url_short' => $urlShort,
                    'legacy_id' => (string) $legacyId,
                    'materias_exportadas' => $materiasExportadas,
                    'sello_presente' => $sello !== '',
                    'xml_bytes' => strlen($xml),
                    'cadena_bytes' => strlen($cadena),
                ],
                userId: $userId,
            );

            return new ShadowExportResult(
                success: true,
                message: 'Documento exportado a SICES legacy para firma.',
                documentoId: $documento->id,
                urlShort: $urlShort,
                legacyId: (string) $legacyId,
                materiasExportadas: (int) $materiasExportadas,
            );
        } catch (ValidationException $e) {
            $flat = collect($e->errors())->flatten()->values()->all();

            return $this->fallo($documento, $flat, $userId);
        } catch (Throwable $e) {
            return $this->fallo(
                $documento,
                ['No se pudo exportar a SICES legacy: '.$e->getMessage()],
                $userId,
            );
        }
    }

    protected function assertExportacionHabilitada(): void
    {
        if (! config('sices_legacy.enabled')) {
            throw new SicesLegacyShadowDisabledException('SICES_LEGACY_ENABLED=false.');
        }

        if (! config('sices_legacy.shadow_enabled')) {
            throw new SicesLegacyShadowDisabledException('SICES_LEGACY_SHADOW_ENABLED=false.');
        }

        if (! config('sices_legacy.write_enabled')) {
            throw new SicesLegacyShadowDisabledException('SICES_LEGACY_WRITE_ENABLED=false.');
        }

        if (config('sices_legacy.read_only')) {
            throw new SicesLegacyShadowDisabledException('SICES_LEGACY_READ_ONLY=true.');
        }
    }

    /**
     * @return list<string>
     */
    public function collectExportErrors(DocumentoAcademico $documento): array
    {
        $errores = [];

        $meta = is_array($documento->metadata) ? $documento->metadata : [];
        if (! ($meta['listo_para_firma'] ?? false)) {
            $errores[] = 'El documento no está liberado a proceso técnico (listo_para_firma).';
        }

        if ($documento->estado_workflow === EstadoWorkflow::CANCELADO->value) {
            $errores[] = 'El documento está cancelado.';
        }

        if (in_array($documento->estado_firma, [
            EstadoFirma::FIRMADO->value,
            EstadoFirma::FIRMANDO->value,
        ], true)) {
            $errores[] = 'El documento ya está firmado o en proceso de firma.';
        }

        if ($documento->estado_cadena !== EstadoCadena::GENERADA->value) {
            $errores[] = 'La cadena original debe estar generada.';
        }

        if ($documento->estado_xml !== EstadoXml::GENERADO->value) {
            $errores[] = 'El XML local debe estar generado.';
        }

        $payload = DocumentoPayload::query()
            ->where('documento_academico_id', $documento->id)
            ->orderByDesc('id')
            ->first();
        if ($payload === null || empty($payload->payload_json)) {
            $errores[] = 'Falta payload técnico generado.';
        }

        if (trim($this->resolverCadena($documento)) === '') {
            $errores[] = 'Falta cadena original.';
        }

        if (trim($this->resolverXml($documento)) === '') {
            $errores[] = 'Falta XML DEC local.';
        }

        if (empty($meta['sello_local']) && empty($meta['sello_local_base64'])) {
            $errores[] = 'Falta sello local en metadata.';
        }

        try {
            $this->resolverUrlShort($documento);
        } catch (ValidationException $e) {
            $errores = array_merge($errores, collect($e->errors())->flatten()->all());
        }

        $documento->loadMissing(['alumno', 'matricula', 'sede', 'institucion', 'materiasSnapshot']);
        if ($documento->alumno === null || trim((string) $documento->alumno->curp) === '') {
            $errores[] = 'El alumno debe tener CURP.';
        }

        if ($documento->matricula_id === null || $documento->matricula === null) {
            $errores[] = 'Falta matrícula institucional.';
        }

        if ($documento->institucion_id === null || $documento->sede_id === null) {
            $errores[] = 'Faltan institución y sede (CCT).';
        }

        if ($documento->sede !== null && trim((string) $documento->sede->clave) === '') {
            $errores[] = 'La sede debe tener CCT (clave).';
        }

        if (! in_array($documento->tipo_certificacion, ['parcial', 'total', 'termino'], true)
            && $documento->tipo_documento !== 'certificado') {
            $errores[] = 'Tipo de certificado no válido para exportación legacy.';
        }

        $materiasCount = $documento->materiasSnapshot->count();
        if ($materiasCount === 0) {
            $materiasCount = DocumentoMateriaSnapshot::query()
                ->where('documento_academico_id', $documento->id)
                ->count();
        }
        if ($materiasCount === 0) {
            $errores[] = 'No hay materias en snapshot del documento.';
        }

        return $errores;
    }

    /**
     * @return array<string, mixed>
     */
    protected function buildCertificadoLegacyRow(
        DocumentoAcademico $documento,
        string $urlShort,
        string $cadena,
        string $xml,
        string $sello,
    ): array {
        $c = config('sices_legacy.columns.certificado');
        $export = $this->timbradoJson->buildE11SuperiorCert($documento);
        $ciclo = $documento->cicloEscolar?->clave ?? $documento->cicloEscolar?->nombre ?? '';

        $row = [
            $c['url_short'] => $urlShort,
            $c['cadena_original'] => $cadena,
            $c['xml_local'] => $xml,
            $c['sello_certificado'] => $sello,
            $c['nombre'] => $export['nombre'],
            $c['primer_apellido'] => $export['primerApellido'],
            $c['segundo_apellido'] => $export['segundoApellido'],
            $c['curp'] => $export['curp'],
            $c['matricula'] => $documento->matricula?->matricula,
            $c['cct'] => $export['cct'],
            $c['nombre_ct'] => $export['nombreEscuela'],
            $c['cve_institucion'] => $export['claveInstitucion'],
            $c['cve_carrera'] => $export['claveCarrera'],
            $c['licenciatura'] => $export['carrera'],
            $c['modalidad'] => $documento->ofertaAcademica?->modalidad,
            $c['plan'] => $export['planEstudios'],
            $c['tipo_cert'] => $export['tipoCertificado'],
            $c['tipo_cert_label'] => $documento->tipo_certificacion,
            $c['cve_tipo_cert'] => $export['tipoCertificado'],
            $c['ciclo'] => $ciclo,
            $c['promedio'] => $export['promedio'],
            $c['creditos'] => $documento->snapshot_json['creditos'] ?? null,
            $c['total_asignaturas'] => $documento->materiasSnapshot->count(),
            $c['fecha_expedicion'] => $export['fechaExpedicion'],
            $c['estado_inicial'] => 'P',
        ];

        $unknown = array_filter($row, static fn ($col) => $col === null || $col === '');
        if (isset($unknown[$c['cve_institucion']]) || isset($unknown[$c['cve_carrera']])) {
            throw ValidationException::withMessages([
                'legacy' => [
                    'Faltan claves de institución o carrera para mapeo legacy (rcve_institucion / rcve_carrera).',
                ],
            ]);
        }

        return array_filter($row, static fn ($v) => $v !== null);
    }

    /**
     * @return list<array<string, mixed>>
     */
    /**
     * @param  array<string, mixed>  $certData
     * @return list<array<string, mixed>>
     */
    protected function buildMateriasLegacyRows(DocumentoAcademico $documento, string $urlShort, array $certData): array
    {
        $cMat = config('sices_legacy.columns.materias');
        $cCert = config('sices_legacy.columns.certificado');
        $tipoLegacy = (string) ($certData[$cCert['tipo_cert']] ?? 'T');
        $curp = strtoupper(trim((string) ($certData[$cCert['curp']] ?? '')));
        $matricula = $documento->matricula?->matricula;
        $ciclo = $documento->cicloEscolar?->clave ?? '';

        $rows = [];
        foreach ($this->timbradoJson->buildE11MateriasCert($documento) as $m) {
            $rows[] = array_filter([
                $cMat['url_short_materia'] => $urlShort,
                $cMat['curp'] => $curp,
                $cMat['matricula'] => $matricula,
                $cMat['clave'] => $m['clave_materia'],
                $cMat['nombre'] => $m['nombre_materia'],
                $cMat['calificacion'] => $m['calificacionFinal_materia'],
                $cMat['semestre'] => $m['semestre_materia'],
                $cMat['periodo'] => $m['periodo'],
                $cMat['ciclo'] => $ciclo,
                $cMat['tipo_cert'] => $tipoLegacy,
            ], static fn ($v) => $v !== null && $v !== '');
        }

        return $rows;
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
                'url_short' => ['No hay url_short activo para exportación legacy.'],
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

    /**
     * @param  list<string>  $errores
     */
    protected function fallo(
        DocumentoAcademico $documento,
        array $errores,
        ?int $userId,
        ?string $mensaje = null,
    ): ShadowExportResult {
        $metaDoc = is_array($documento->metadata) ? $documento->metadata : [];
        $shadow = is_array($metaDoc['legacy_shadow'] ?? null) ? $metaDoc['legacy_shadow'] : [];
        $documento->metadata = array_merge($metaDoc, [
            'legacy_shadow' => array_merge($shadow, [
                'last_error' => implode(' ', $errores),
                'last_attempt_at' => now()->toIso8601String(),
            ]),
        ]);
        $documento->save();

        $this->auditoria->registrar(
            evento: 'sices_legacy.shadow_export_fallo',
            entidadTipo: DocumentoAcademico::class,
            entidadId: $documento->id,
            payload: [
                'errores_count' => count($errores),
                'errores_resumen' => array_slice($errores, 0, 15),
            ],
            userId: $userId,
        );

        return new ShadowExportResult(
            success: false,
            message: $mensaje ?? 'No se pudo exportar a SICES legacy.',
            documentoId: $documento->id,
            errors: $errores,
        );
    }
}
