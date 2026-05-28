<?php

declare(strict_types=1);

namespace App\Services\Firma;

use App\Contracts\SicesLegacy\SicesLegacyShadowRepositoryInterface;
use App\Data\Firma\FirmaDocumentoResult;
use App\Data\Firma\SinceFirmaResponse;
use App\Enums\Certificacion\CanalFirmaDocumento;
use App\Enums\Certificacion\EstadoFirma;
use App\Enums\Certificacion\EstadoSep;
use App\Enums\Certificacion\EstadoXml;
use App\Enums\Certificacion\ProveedorFirma;
use App\Infrastructure\Since\SinceTitulosFirmaClient;
use App\Models\DocumentoAcademico;
use App\Models\DocumentoFirma;
use App\Services\Certificacion\AuditoriaService;
use App\Services\Certificacion\DocumentoEstadoService;
use App\Services\Certificacion\DocumentStorageService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class TituloGradoSepFirmaService
{
    public function __construct(
        protected DocumentoFirmaReservaService $reserva,
        protected SinceTitulosFirmaClient $titulosClient,
        protected DocumentoEstadoService $estados,
        protected DocumentStorageService $storage,
        protected AuditoriaService $auditoria,
        protected SicesLegacyShadowRepositoryInterface $shadowRepository,
    ) {}

    public function firmar(
        DocumentoAcademico $documento,
        CanalFirmaDocumento $canal,
        ?int $usuarioId = null,
    ): FirmaDocumentoResult {
        $documentoId = $documento->id;
        $metaKey = $canal === CanalFirmaDocumento::GRADO_SEP ? 'firma_since_titulos_grado' : 'firma_since_titulos';

        $this->auditoria->registrar(
            evento: 'firma_intento',
            entidadTipo: DocumentoAcademico::class,
            entidadId: $documentoId,
            payload: ['documento_id' => $documentoId, 'canal' => $canal->value],
            userId: $usuarioId,
        );

        if (! $this->titulosClient->firmaHabilitada()) {
            return $this->reserva->falloResultado(
                $documento->fresh() ?? $documento,
                'Timbrado since-títulos deshabilitado.',
                'since_titulos_disabled',
                ['config' => ['SINCE_TITULOS_ENABLED=false.']],
                $usuarioId,
                $metaKey,
            );
        }

        $reserva = $this->reserva->reservarParaTimbradoSep($documentoId, $usuarioId, $metaKey);
        if ($reserva instanceof FirmaDocumentoResult) {
            return $reserva;
        }

        [$documentoBloqueado, $urlShort] = $reserva;

        try {
            $respuesta = $canal === CanalFirmaDocumento::GRADO_SEP
                ? $this->titulosClient->firmarGradoPorUrlShort($urlShort, $this->esProduccion())
                : $this->titulosClient->firmarTituloPorUrlShort($urlShort, $this->esProduccion());
        } catch (\Throwable $e) {
            $this->reserva->liberarReservaFirmaEnError($documentoBloqueado, $e->getMessage(), $usuarioId, $metaKey);

            return new FirmaDocumentoResult(
                success: false,
                message: 'No se pudo timbrar el documento.',
                documentoId: $documentoBloqueado->id,
                urlShort: $urlShort,
                estadoFirma: EstadoFirma::ERROR_FIRMA->value,
                errorCode: 'since_titulos_excepcion',
                errors: [$e->getMessage()],
                canalFirma: $canal->value,
            );
        }

        if (! $respuesta->success) {
            return $this->registrarErrorFirma($documentoBloqueado, $respuesta, $urlShort, $usuarioId, $metaKey, $canal);
        }

        return $this->registrarExitoFirma($documentoBloqueado, $respuesta, $urlShort, $usuarioId, $metaKey, $canal);
    }

    protected function esProduccion(): bool
    {
        $flag = (string) config('since.firma.prod_flag', '1');

        return filter_var(env('SINCE_FIRMA_PROD', $flag === '1'), FILTER_VALIDATE_BOOL);
    }

    protected function registrarExitoFirma(
        DocumentoAcademico $documento,
        SinceFirmaResponse $respuesta,
        string $urlShort,
        ?int $usuarioId,
        string $metaKey,
        CanalFirmaDocumento $canal,
    ): FirmaDocumentoResult {
        return DB::transaction(function () use ($documento, $respuesta, $urlShort, $usuarioId, $metaKey, $canal): FirmaDocumentoResult {
            $doc = DocumentoAcademico::query()->lockForUpdate()->findOrFail($documento->id);
            $xmlFirmado = (string) ($respuesta->xmlFirmado ?? '');
            $correlationId = Str::uuid()->toString();

            DocumentoFirma::query()->create([
                'documento_academico_id' => $doc->id,
                'proveedor' => $respuesta->simulada
                    ? ProveedorFirma::SIMULADO->value
                    : ProveedorFirma::SEP_SINCE_TITULOS->value,
                'endpoint' => $this->endpointParaCanal($canal),
                'estado' => 'firmado',
                'folio_digital_sep' => $respuesta->folioDigital,
                'xml_firmado' => $xmlFirmado !== '' ? $xmlFirmado : null,
                'correlation_id' => $correlationId,
                'idempotency_key' => 'firma-titulos-'.$doc->id.'-'.$correlationId,
                'request_payload' => [
                    'url_short' => $urlShort,
                    'prod' => $this->esProduccion(),
                    'canal' => $canal->value,
                    'modo' => $respuesta->simulada ? 'since_titulos_simulado' : 'since_titulos',
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
                            'proveedor' => 'since_titulos',
                            'canal' => $canal->value,
                            'simulada' => $respuesta->simulada,
                        ],
                    ],
                    $usuarioId,
                );
            }

            $meta = is_array($doc->metadata) ? $doc->metadata : [];
            $doc->metadata = array_merge($meta, [
                $metaKey => [
                    'at' => now()->toIso8601String(),
                    'simulada' => $respuesta->simulada,
                    'folio_digital' => $respuesta->folioDigital,
                    'url_short' => $urlShort,
                    'last_success_at' => now()->toIso8601String(),
                    'last_error' => null,
                ],
                'sello_sep' => $respuesta->selloSep ? Str::limit($respuesta->selloSep, 120) : ($meta['sello_sep'] ?? null),
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
                'XML timbrado vía since-títulos.',
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
                    $this->auditoria->registrar(
                        evento: 'firma_writeback_legacy_fallo',
                        entidadTipo: DocumentoAcademico::class,
                        entidadId: $doc->id,
                        payload: ['error' => $e->getMessage(), 'canal' => $canal->value],
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
                    'canal' => $canal->value,
                    'simulada' => $respuesta->simulada,
                ],
                userId: $usuarioId,
            );

            return new FirmaDocumentoResult(
                success: true,
                message: 'Documento timbrado correctamente.',
                documentoId: $doc->id,
                urlShort: $urlShort,
                folioDigitalSep: $respuesta->folioDigital,
                estadoFirma: EstadoFirma::FIRMADO->value,
                canalFirma: $canal->value,
            );
        });
    }

    protected function registrarErrorFirma(
        DocumentoAcademico $documento,
        SinceFirmaResponse $respuesta,
        string $urlShort,
        ?int $usuarioId,
        string $metaKey,
        CanalFirmaDocumento $canal,
    ): FirmaDocumentoResult {
        return DB::transaction(function () use ($documento, $respuesta, $urlShort, $usuarioId, $metaKey, $canal): FirmaDocumentoResult {
            $doc = DocumentoAcademico::query()->lockForUpdate()->findOrFail($documento->id);
            $doc->forceFill(['estado_firma' => EstadoFirma::ERROR_FIRMA->value])->save();

            $meta = is_array($doc->metadata) ? $doc->metadata : [];
            $firmaMeta = is_array($meta[$metaKey] ?? null) ? $meta[$metaKey] : [];
            $doc->metadata = array_merge($meta, [
                $metaKey => array_merge($firmaMeta, [
                    'last_attempt_at' => now()->toIso8601String(),
                    'last_error' => $respuesta->message,
                    'error_code' => $respuesta->errorCode,
                    'url_short' => $urlShort,
                ]),
            ]);
            $doc->save();

            $correlationId = Str::uuid()->toString();
            DocumentoFirma::query()->create([
                'documento_academico_id' => $doc->id,
                'proveedor' => ProveedorFirma::SEP_SINCE_TITULOS->value,
                'endpoint' => $this->endpointParaCanal($canal),
                'estado' => 'error',
                'error_message' => $respuesta->message,
                'correlation_id' => $correlationId,
                'idempotency_key' => 'firma-titulos-err-'.$doc->id.'-'.$correlationId,
                'request_payload' => ['url_short' => $urlShort, 'canal' => $canal->value],
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
                    'canal' => $canal->value,
                ],
                userId: $usuarioId,
            );

            return new FirmaDocumentoResult(
                success: false,
                message: 'No se pudo timbrar el documento.',
                documentoId: $doc->id,
                urlShort: $urlShort,
                estadoFirma: EstadoFirma::ERROR_FIRMA->value,
                errorCode: $respuesta->errorCode,
                errors: [$respuesta->message],
                canalFirma: $canal->value,
            );
        });
    }

    protected function endpointParaCanal(CanalFirmaDocumento $canal): ?string
    {
        $env = strtolower((string) config('since.titulos.env', 'dev'));
        $prod = $env === 'prod' || $env === 'production' || $this->esProduccion();

        return match ($canal) {
            CanalFirmaDocumento::GRADO_SEP => (string) ($prod ? config('since.titulos.grado_prod_url') : config('since.titulos.grado_dev_url')),
            default => (string) ($prod ? config('since.titulos.titulo_prod_url') : config('since.titulos.titulo_dev_url')),
        };
    }
}
