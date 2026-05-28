<?php

declare(strict_types=1);

namespace App\Services\Firma;

use App\Contracts\SicesLegacy\SicesLegacyShadowRepositoryInterface;
use App\Data\Firma\FirmaDocumentoResult;
use App\Data\Firma\SinceFirmaResponse;
use App\Enums\Certificacion\EstadoFirma;
use App\Enums\Certificacion\EstadoSep;
use App\Enums\Certificacion\EstadoWorkflow;
use App\Enums\Certificacion\EstadoXml;
use App\Enums\Certificacion\ProveedorFirma;
use App\Infrastructure\Since\SinceFirmaClient;
use App\Models\DocumentoAcademico;
use App\Models\DocumentoFirma;
use App\Models\UrlShortToken;
use App\Services\Certificacion\AuditoriaService;
use App\Services\Certificacion\DocumentoEstadoService;
use App\Services\Certificacion\DocumentoPreflightValidator;
use App\Services\Certificacion\DocumentStorageService;
use App\Services\SicesLegacy\SicesLegacyShadowExportService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Orquestador: preflight → shadow export confirmado → servicio 34 (urlshort+prod).
 */
class LegacySinceSigningBridgeService
{
    public function __construct(
        protected DocumentoPreflightValidator $preflight,
        protected SicesLegacyShadowExportService $shadowExportValidator,
        protected SinceFirmaClient $sinceClient,
        protected DocumentoEstadoService $estados,
        protected DocumentStorageService $storage,
        protected AuditoriaService $auditoria,
        protected SicesLegacyShadowRepositoryInterface $shadowRepository,
    ) {}

    public function firmar(DocumentoAcademico $documento, ?int $usuarioId = null): FirmaDocumentoResult
    {
        $documentoId = $documento->id;

        $this->auditoria->registrar(
            evento: 'firma_intento',
            entidadTipo: DocumentoAcademico::class,
            entidadId: $documentoId,
            payload: ['documento_id' => $documentoId],
            userId: $usuarioId,
        );

        if (! $this->sinceClient->firmaHabilitada()) {
            return $this->falloResultado(
                $documento->fresh() ?? $documento,
                'SINCE_FIRMA_ENABLED=false.',
                'since_firma_disabled',
                ['config' => ['La firma SEP/SINCE está deshabilitada.']],
                $usuarioId,
            );
        }

        $reserva = $this->reservarDocumentoParaFirma($documentoId, $usuarioId);
        if ($reserva instanceof FirmaDocumentoResult) {
            return $reserva;
        }

        [$documentoBloqueado, $urlShort] = $reserva;

        try {
            $respuesta = $this->sinceClient->firmarPorUrlShort($urlShort, $this->esProduccion());
        } catch (\Throwable $e) {
            $this->liberarReservaFirmaEnError($documentoBloqueado, $e->getMessage(), $usuarioId);

            return new FirmaDocumentoResult(
                success: false,
                message: 'No se pudo firmar el documento.',
                documentoId: $documentoBloqueado->id,
                urlShort: $urlShort,
                estadoFirma: EstadoFirma::ERROR_FIRMA->value,
                errorCode: 'since_excepcion',
                errors: [$e->getMessage()],
            );
        }

        if (! $respuesta->success) {
            return $this->registrarErrorFirma($documentoBloqueado, $respuesta, $urlShort, $usuarioId);
        }

        return $this->registrarExitoFirma($documentoBloqueado, $respuesta, $urlShort, $usuarioId);
    }

    /**
     * Reserva el documento bajo lock pesimista, valida elegibilidad y marca {@see EstadoFirma::FIRMANDO}
     * antes de invocar SINCE (la llamada HTTP ocurre fuera de la transacción).
     *
     * @return FirmaDocumentoResult|array{0: DocumentoAcademico, 1: string}
     */
    protected function reservarDocumentoParaFirma(int $documentoId, ?int $usuarioId): FirmaDocumentoResult|array
    {
        return DB::transaction(function () use ($documentoId, $usuarioId): FirmaDocumentoResult|array {
            $documento = DocumentoAcademico::query()->lockForUpdate()->find($documentoId);
            if ($documento === null) {
                throw (new ModelNotFoundException)->setModel(DocumentoAcademico::class, [$documentoId]);
            }

            $erroresPrevios = $this->collectPreFirmaErrors($documento);
            if ($erroresPrevios !== []) {
                return $this->falloResultado($documento, 'No se pudo firmar el documento.', 'prefirma_fallido', $erroresPrevios, $usuarioId);
            }

            try {
                $this->preflight->assertListoParaFirmaTecnica($documento);
            } catch (ValidationException $e) {
                $flat = collect($e->errors())->flatten()->values()->all();

                return $this->falloResultado($documento, 'No se pudo firmar el documento.', 'preflight_fallido', $flat, $usuarioId);
            }

            $shadowErrores = $this->shadowExportValidator->collectExportErrors($documento);
            if ($shadowErrores !== []) {
                return $this->falloResultado(
                    $documento,
                    'No se pudo firmar: shadow export incompleto.',
                    'shadow_incompleto',
                    $shadowErrores,
                    $usuarioId,
                );
            }

            if (! $this->assertShadowExportConfirmado($documento)) {
                return $this->falloResultado(
                    $documento,
                    'No se pudo firmar: el documento no fue exportado a SICES legacy.',
                    'shadow_no_exportado',
                    ['legacy_shadow' => ['Exporte a SICES legacy antes de firmar.']],
                    $usuarioId,
                );
            }

            $urlShort = $this->resolverUrlShort($documento);

            $documento->forceFill(['estado_firma' => EstadoFirma::FIRMANDO->value])->save();

            return [$documento->fresh(), $urlShort];
        });
    }

    protected function liberarReservaFirmaEnError(DocumentoAcademico $documento, string $mensaje, ?int $usuarioId): void
    {
        DB::transaction(function () use ($documento, $mensaje, $usuarioId): void {
            $doc = DocumentoAcademico::query()->lockForUpdate()->find($documento->id);
            if ($doc === null || $doc->estado_firma !== EstadoFirma::FIRMANDO->value) {
                return;
            }

            $doc->forceFill(['estado_firma' => EstadoFirma::ERROR_FIRMA->value])->save();

            $meta = is_array($doc->metadata) ? $doc->metadata : [];
            $firmaMeta = is_array($meta['firma_servicio_34'] ?? null) ? $meta['firma_servicio_34'] : [];
            $doc->metadata = array_merge($meta, [
                'firma_servicio_34' => array_merge($firmaMeta, [
                    'last_attempt_at' => now()->toIso8601String(),
                    'last_error' => $mensaje,
                    'error_code' => 'since_excepcion',
                ]),
            ]);
            $doc->save();

            $this->auditoria->registrar(
                evento: 'firma_fallo',
                entidadTipo: DocumentoAcademico::class,
                entidadId: $doc->id,
                payload: ['error_code' => 'since_excepcion', 'error' => $mensaje],
                userId: $usuarioId,
            );
        });
    }

    /**
     * @return array{success: bool, message: string, documento_id: int, estado_firma: string, folio_digital_sep: ?string, errores?: list<string>|array<string, mixed>, error_code?: string}
     */
    public function ejecutarFirma(DocumentoAcademico $documento, ?int $usuarioId = null): array
    {
        return $this->firmar($documento, $usuarioId)->toResponseArray();
    }

    /**
     * @return list<string>
     */
    protected function collectPreFirmaErrors(DocumentoAcademico $documento): array
    {
        $errores = [];

        $meta = is_array($documento->metadata) ? $documento->metadata : [];
        if (! ($meta['listo_para_firma'] ?? false)) {
            $errores[] = 'El documento no está liberado a proceso técnico.';
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

        return $errores;
    }

    protected function assertShadowExportConfirmado(DocumentoAcademico $documento): bool
    {
        $shadow = is_array($documento->metadata['legacy_shadow'] ?? null)
            ? $documento->metadata['legacy_shadow']
            : [];

        if (($shadow['exported'] ?? false) !== true && empty($shadow['exported_at'])) {
            return false;
        }

        if (empty($shadow['url_short']) && empty($documento->token_consulta_publica)) {
            return false;
        }

        if (empty($shadow['last_success_at']) && empty($shadow['exported_at'])) {
            return false;
        }

        return true;
    }

    protected function resolverUrlShort(DocumentoAcademico $documento): string
    {
        $shadow = is_array($documento->metadata['legacy_shadow'] ?? null)
            ? $documento->metadata['legacy_shadow']
            : [];

        $token = trim((string) ($shadow['url_short'] ?? $documento->token_consulta_publica ?? ''));
        if ($token === '') {
            $token = (string) (UrlShortToken::query()
                ->where('documento_academico_id', $documento->id)
                ->where('estado', 'activo')
                ->value('token') ?? '');
        }

        if ($token === '') {
            throw ValidationException::withMessages([
                'url_short' => ['No hay url_short para firma SEP.'],
            ]);
        }

        return $token;
    }

    protected function esProduccion(): bool
    {
        return filter_var(env('SINCE_FIRMA_PROD', config('since.firma.prod_flag', '1') === '1'), FILTER_VALIDATE_BOOL);
    }

    /**
     * @return array{correlation_id: string, idempotency_key: string}
     */
    protected function nuevosIdsRegistroFirma(int $documentoId): array
    {
        $correlationId = Str::uuid()->toString();

        return [
            'correlation_id' => $correlationId,
            'idempotency_key' => 'firma-s34-'.$documentoId.'-'.$correlationId,
        ];
    }

    protected function endpointServicio34(): ?string
    {
        $env = strtolower((string) config('since.firma.env', 'dev'));
        if ($env === 'prod' || $env === 'production' || $this->esProduccion()) {
            $url = (string) config('since.firma.prod_url', '');

            return $url !== '' ? $url : null;
        }

        $url = (string) config('since.firma.dev_url', '');

        return $url !== '' ? $url : null;
    }

    protected function registrarExitoFirma(
        DocumentoAcademico $documento,
        SinceFirmaResponse $respuesta,
        string $urlShort,
        ?int $usuarioId,
    ): FirmaDocumentoResult {
        return DB::transaction(function () use ($documento, $respuesta, $urlShort, $usuarioId): FirmaDocumentoResult {
            $doc = DocumentoAcademico::query()->lockForUpdate()->findOrFail($documento->id);
            $xmlFirmado = (string) ($respuesta->xmlFirmado ?? '');

            $ids = $this->nuevosIdsRegistroFirma($doc->id);

            DocumentoFirma::query()->create([
                'documento_academico_id' => $doc->id,
                'proveedor' => $respuesta->simulada
                    ? ProveedorFirma::SIMULADO->value
                    : ProveedorFirma::SEP_SINCE_SERVICE->value,
                'endpoint' => $this->endpointServicio34(),
                'estado' => 'firmado',
                'folio_digital_sep' => $respuesta->folioDigital,
                'xml_firmado' => $xmlFirmado !== '' ? $xmlFirmado : null,
                'correlation_id' => $ids['correlation_id'],
                'idempotency_key' => $ids['idempotency_key'],
                'request_payload' => [
                    'url_short' => $urlShort,
                    'prod' => $this->esProduccion(),
                    'modo' => $respuesta->simulada ? 'servicio_34_simulado' : 'servicio_34',
                ],
                'response_payload' => $respuesta->rawSanitized,
                'http_status' => $respuesta->httpStatus,
                'sent_at' => now(),
                'signed_at' => now(),
                'created_by' => $usuarioId,
            ]);

            if ($xmlFirmado !== '') {
                $this->storage->registrarVersionDocumental(
                    $doc,
                    'XML_FIRMADO_SEP',
                    [
                        'contenido' => $xmlFirmado,
                        'sha256' => hash('sha256', $xmlFirmado),
                        'size_bytes' => strlen($xmlFirmado),
                        'metadata' => [
                            'proveedor' => 'since_servicio_34',
                            'simulada' => $respuesta->simulada,
                        ],
                    ],
                    $usuarioId,
                );
            }

            $meta = is_array($doc->metadata) ? $doc->metadata : [];
            $shadow = is_array($meta['legacy_shadow'] ?? null) ? $meta['legacy_shadow'] : [];
            $doc->metadata = array_merge($meta, [
                'legacy_shadow' => $shadow,
                'sello_sep' => $respuesta->selloSep ? Str::limit($respuesta->selloSep, 120) : ($meta['sello_sep'] ?? null),
                'firma_servicio_34' => [
                    'at' => now()->toIso8601String(),
                    'simulada' => $respuesta->simulada,
                    'folio_digital' => $respuesta->folioDigital,
                    'url_short' => $urlShort,
                    'last_success_at' => now()->toIso8601String(),
                    'last_error' => null,
                ],
            ]);

            $doc->forceFill([
                'folio_digital_sep' => $respuesta->folioDigital,
                'estado_firma' => EstadoFirma::FIRMADO->value,
                'estado_sep' => EstadoSep::TIMBRADO->value,
                'fecha_firma' => now(),
            ])->save();

            $this->estados->cambiarEstado(
                $doc,
                'estado_xml',
                EstadoXml::TIMBRADO->value,
                $usuarioId,
                'XML timbrado vía servicio 34.',
            );

            if (config('sices_legacy.writeback_enabled') && $respuesta->folioDigital) {
                try {
                    $this->shadowRepository->writebackFirmaSep(
                        $urlShort,
                        $respuesta->folioDigital,
                        $xmlFirmado !== '' ? $xmlFirmado : null,
                        $respuesta->selloSep,
                    );
                } catch (\Throwable $e) {
                    // Writeback opcional: no revierte firma exitosa en MySQL.
                    $this->auditoria->registrar(
                        evento: 'firma_writeback_legacy_fallo',
                        entidadTipo: DocumentoAcademico::class,
                        entidadId: $doc->id,
                        payload: ['error' => $e->getMessage()],
                        userId: $usuarioId,
                    );
                }
            }

            $this->auditoria->registrar(
                evento: 'firma_ok',
                entidadTipo: DocumentoAcademico::class,
                entidadId: $doc->id,
                payload: [
                    'url_short' => $urlShort,
                    'folio_digital' => $respuesta->folioDigital,
                    'simulada' => $respuesta->simulada,
                    'http_status' => $respuesta->httpStatus,
                    'respuesta_sep' => $respuesta->rawSanitized,
                ],
                userId: $usuarioId,
            );

            return new FirmaDocumentoResult(
                success: true,
                message: 'Documento firmado correctamente.',
                documentoId: $doc->id,
                urlShort: $urlShort,
                folioDigitalSep: $respuesta->folioDigital,
                estadoFirma: EstadoFirma::FIRMADO->value,
            );
        });
    }

    protected function registrarErrorFirma(
        DocumentoAcademico $documento,
        SinceFirmaResponse $respuesta,
        string $urlShort,
        ?int $usuarioId,
    ): FirmaDocumentoResult {
        return DB::transaction(function () use ($documento, $respuesta, $urlShort, $usuarioId): FirmaDocumentoResult {
            $doc = DocumentoAcademico::query()->lockForUpdate()->findOrFail($documento->id);
            $doc->forceFill(['estado_firma' => EstadoFirma::ERROR_FIRMA->value])->save();

            $meta = is_array($doc->metadata) ? $doc->metadata : [];
            $firmaMeta = is_array($meta['firma_servicio_34'] ?? null) ? $meta['firma_servicio_34'] : [];
            $doc->metadata = array_merge($meta, [
                'firma_servicio_34' => array_merge($firmaMeta, [
                    'last_attempt_at' => now()->toIso8601String(),
                    'last_error' => $respuesta->message,
                    'error_code' => $respuesta->errorCode,
                    'url_short' => $urlShort,
                ]),
            ]);
            $doc->save();

            $ids = $this->nuevosIdsRegistroFirma($doc->id);

            DocumentoFirma::query()->create([
                'documento_academico_id' => $doc->id,
                'proveedor' => ProveedorFirma::SEP_SINCE_SERVICE->value,
                'endpoint' => $this->endpointServicio34(),
                'estado' => 'error',
                'error_message' => $respuesta->message,
                'correlation_id' => $ids['correlation_id'],
                'idempotency_key' => $ids['idempotency_key'],
                'request_payload' => ['url_short' => $urlShort, 'error_code' => $respuesta->errorCode],
                'response_payload' => $respuesta->rawSanitized,
                'http_status' => $respuesta->httpStatus,
                'sent_at' => now(),
                'created_by' => $usuarioId,
            ]);

            $this->auditoria->registrar(
                evento: 'firma_fallo',
                entidadTipo: DocumentoAcademico::class,
                entidadId: $doc->id,
                payload: [
                    'url_short' => $urlShort,
                    'error_code' => $respuesta->errorCode,
                    'error' => $respuesta->message,
                    'respuesta_sep' => $respuesta->rawSanitized,
                ],
                userId: $usuarioId,
            );

            return new FirmaDocumentoResult(
                success: false,
                message: 'No se pudo firmar el documento.',
                documentoId: $doc->id,
                urlShort: $urlShort,
                estadoFirma: EstadoFirma::ERROR_FIRMA->value,
                errorCode: $respuesta->errorCode,
                errors: [$respuesta->message],
            );
        });
    }

    /**
     * @param  list<string>|array<string, mixed>  $errores
     */
    protected function falloResultado(
        DocumentoAcademico $documento,
        string $message,
        string $errorCode,
        array $errores,
        ?int $usuarioId,
    ): FirmaDocumentoResult {
        $doc = $documento->fresh() ?? $documento;

        $preservarEstadoEnCurso = $errorCode === 'prefirma_fallido'
            && in_array($doc->estado_firma, [
                EstadoFirma::FIRMADO->value,
                EstadoFirma::FIRMANDO->value,
            ], true);

        if (! $preservarEstadoEnCurso && $doc->estado_firma !== EstadoFirma::FIRMADO->value) {
            $doc->forceFill(['estado_firma' => EstadoFirma::ERROR_FIRMA->value])->save();
        }

        $flat = is_array($errores) && array_is_list($errores)
            ? $errores
            : collect($errores)->flatten()->values()->all();

        $meta = is_array($doc->metadata) ? $doc->metadata : [];
        $firmaMeta = is_array($meta['firma_servicio_34'] ?? null) ? $meta['firma_servicio_34'] : [];
        $doc->metadata = array_merge($meta, [
            'firma_servicio_34' => array_merge($firmaMeta, [
                'last_attempt_at' => now()->toIso8601String(),
                'last_error' => implode(' ', $flat),
                'error_code' => $errorCode,
            ]),
        ]);
        $doc->save();

        $this->auditoria->registrar(
            evento: 'firma_fallo',
            entidadTipo: DocumentoAcademico::class,
            entidadId: $doc->id,
            payload: [
                'error_code' => $errorCode,
                'errores' => array_slice($flat, 0, 15),
            ],
            userId: $usuarioId,
        );

        return new FirmaDocumentoResult(
            success: false,
            message: $message,
            documentoId: $doc->id,
            estadoFirma: $doc->estado_firma,
            errorCode: $errorCode,
            errors: $flat,
        );
    }
}
