<?php

declare(strict_types=1);

namespace App\Services\Firma;

use App\Data\Firma\FirmaDocumentoResult;
use App\Enums\Certificacion\CanalFirmaDocumento;
use App\Enums\Certificacion\EstadoCadena;
use App\Enums\Certificacion\EstadoFirma;
use App\Enums\Certificacion\EstadoPdf;
use App\Enums\Certificacion\EstadoSep;
use App\Enums\Certificacion\EstadoXml;
use App\Enums\Certificacion\ProveedorFirma;
use App\Models\CadenaOriginalGenerada;
use App\Models\DocumentoAcademico;
use App\Models\DocumentoFirma;
use App\Models\DocumentoVersion;
use App\Models\IntegracionLog;
use App\Services\Certificacion\AuditoriaService;
use App\Services\Certificacion\DocumentoEstadoService;
use App\Services\Certificacion\DocumentoPreflightValidator;
use App\Services\Certificacion\DocumentStorageService;
use App\Services\Certificacion\JasperPayloadBuilder;
use App\Services\Certificacion\JasperRenderService;
use App\Services\Certificacion\OpenSslSelloService;
use App\Services\Certificacion\UrlShortTokenService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * UPN: firma local (estilo firma-bin legacy) + PDF controlado, sin servicio 34 SEP.
 */
class UpnFirmaLocalService
{
    public function __construct(
        protected DocumentoPreflightValidator $preflight,
        protected OpenSslSelloService $openSsl,
        protected DocumentoEstadoService $estados,
        protected DocumentStorageService $storage,
        protected AuditoriaService $auditoria,
        protected JasperPayloadBuilder $payloadBuilder,
        protected JasperRenderService $renderService,
        protected UrlShortTokenService $urlShortTokens,
    ) {}

    public function firmar(DocumentoAcademico $documento, ?int $usuarioId = null): FirmaDocumentoResult
    {
        if (! (bool) config('since.upn.firma_local_enabled', true)) {
            return new FirmaDocumentoResult(
                success: false,
                message: 'Firma local UPN deshabilitada.',
                documentoId: $documento->id,
                estadoFirma: $documento->estado_firma,
                errorCode: 'upn_firma_local_disabled',
                errors: ['SICES_UPN_FIRMA_LOCAL_ENABLED=false.'],
                canalFirma: CanalFirmaDocumento::UPN_FIRMA_LOCAL->value,
            );
        }

        $this->auditoria->registrar(
            evento: 'firma_intento',
            entidadTipo: DocumentoAcademico::class,
            entidadId: $documento->id,
            payload: ['canal' => CanalFirmaDocumento::UPN_FIRMA_LOCAL->value],
            userId: $usuarioId,
        );

        try {
            return DB::transaction(function () use ($documento, $usuarioId): FirmaDocumentoResult {
                $doc = DocumentoAcademico::query()->lockForUpdate()->findOrFail($documento->id);

                if ($doc->estado_firma === EstadoFirma::FIRMADO->value) {
                    return new FirmaDocumentoResult(
                        success: false,
                        message: 'El documento ya está firmado.',
                        documentoId: $doc->id,
                        estadoFirma: $doc->estado_firma,
                        errorCode: 'ya_firmado',
                        errors: ['El documento ya consta como firmado.'],
                        canalFirma: CanalFirmaDocumento::UPN_FIRMA_LOCAL->value,
                    );
                }

                if ($doc->estado_firma === EstadoFirma::FIRMANDO->value) {
                    return new FirmaDocumentoResult(
                        success: false,
                        message: 'Firma en curso.',
                        documentoId: $doc->id,
                        estadoFirma: $doc->estado_firma,
                        errorCode: 'firma_en_curso',
                        errors: ['El documento ya está en proceso de firma.'],
                        canalFirma: CanalFirmaDocumento::UPN_FIRMA_LOCAL->value,
                    );
                }

                $meta = is_array($doc->metadata) ? $doc->metadata : [];
                if (! ($meta['listo_para_firma'] ?? false)) {
                    return $this->fallo($doc, 'prefirma_fallido', ['El documento no está liberado a proceso técnico.'], $usuarioId);
                }

                try {
                    $this->preflight->assertListoParaFirmaTecnica($doc);
                } catch (ValidationException $e) {
                    return $this->fallo($doc, 'preflight_fallido', collect($e->errors())->flatten()->all(), $usuarioId);
                }

                $xmlOriginal = $this->resolverXmlOriginal($doc);
                $cadena = $this->resolverCadena($doc, $xmlOriginal);
                $contenidoXml = (string) ($xmlOriginal->contenido ?? '');
                if ($contenidoXml === '') {
                    return $this->fallo($doc, 'xml_vacio', ['No hay contenido XML original.'], $usuarioId);
                }

                $doc->forceFill(['estado_firma' => EstadoFirma::FIRMANDO->value])->save();

                $correlationId = Str::uuid()->toString();
                $materialCadena = (string) ($cadena?->cadena_original ?? $cadena?->cadena_hash ?? '');
                $selloLocal = $this->openSsl->sellarCadenaSimulada('UPN_FIRMA_BIN|'.$materialCadena.'|'.$doc->id);
                $folioLocal = 'UPN-LOC-'.substr(hash('sha256', $selloLocal.$doc->id), 0, 14);

                $xmlFirmado = $this->empaquetarXmlFirmadoLocal($contenidoXml, $selloLocal, $folioLocal);

                DocumentoFirma::query()->create([
                    'documento_academico_id' => $doc->id,
                    'documento_version_id' => $xmlOriginal->id,
                    'proveedor' => ProveedorFirma::UPN_FIRMA_LOCAL->value,
                    'endpoint' => null,
                    'estado' => 'firmado',
                    'folio_digital_sep' => $folioLocal,
                    'xml_firmado' => $xmlFirmado,
                    'correlation_id' => $correlationId,
                    'idempotency_key' => 'upn-local-'.$doc->id.'-'.$correlationId,
                    'request_payload' => [
                        'modo' => 'firma_bin_local_simulada',
                        'cadena_id' => $cadena?->id,
                        'sello_metadata' => $this->openSsl->metadataSelloSimulado(),
                    ],
                    'response_payload' => ['folio_local' => $folioLocal],
                    'http_status' => null,
                    'sent_at' => now(),
                    'signed_at' => now(),
                    'created_by' => $usuarioId,
                ]);

                $this->storage->registrarVersionDocumental(
                    $doc,
                    'XML_FIRMADO_SEP',
                    [
                        'documento_payload_id' => $xmlOriginal->documento_payload_id,
                        'cadena_original_generada_id' => $cadena?->id ?? $xmlOriginal->cadena_original_generada_id,
                        'contenido' => $xmlFirmado,
                        'sha256' => hash('sha256', $xmlFirmado),
                        'size_bytes' => strlen($xmlFirmado),
                        'metadata' => [
                            'modo' => 'upn_firma_local',
                            'no_afirmar_validez_sep' => true,
                            'sello_local' => Str::limit($selloLocal, 80),
                        ],
                    ],
                    $usuarioId,
                );

                if ($cadena !== null) {
                    $cadena->forceFill([
                        'metadata' => array_merge(is_array($cadena->metadata) ? $cadena->metadata : [], [
                            'sello_local_upn' => $selloLocal,
                            'sello_metadata' => $this->openSsl->metadataSelloSimulado(),
                            'sellada_local_upn' => true,
                        ]),
                    ])->save();
                }

                $tokenConsulta = trim((string) ($doc->token_consulta_publica ?? ''));
                if ($tokenConsulta === '') {
                    $registro = $this->urlShortTokens->emitirTokenConsulta($doc, null, [
                        'emitido_tras_firma_upn' => true,
                    ]);
                    $tokenConsulta = $registro->token;
                }

                $doc->metadata = array_merge($meta, [
                    'firma_upn_local' => [
                        'at' => now()->toIso8601String(),
                        'folio_local' => $folioLocal,
                        'url_short' => $tokenConsulta,
                        'last_success_at' => now()->toIso8601String(),
                    ],
                    'sello_local_upn' => Str::limit($selloLocal, 120),
                ]);

                $doc->forceFill([
                    'folio_digital_sep' => $folioLocal,
                    'estado_firma' => EstadoFirma::FIRMADO->value,
                    'estado_sep' => EstadoSep::TIMBRADO->value,
                    'estado_xml' => EstadoXml::SELLADO->value,
                    'fecha_firma' => now(),
                    'token_consulta_publica' => $tokenConsulta,
                ])->save();

                $this->estados->cambiarEstado(
                    $doc,
                    'estado_xml',
                    EstadoXml::SELLADO->value,
                    $usuarioId,
                    'XML sellado con firma local UPN.',
                );

                $pdfGenerado = false;
                if ((bool) config('since.upn.generar_pdf_tras_firma', true)) {
                    $pdfGenerado = $this->generarPdfUpn($doc->fresh(), $usuarioId);
                }

                $this->auditoria->registrar(
                    evento: 'firma_ok',
                    entidadTipo: DocumentoAcademico::class,
                    entidadId: $doc->id,
                    payload: [
                        'canal' => CanalFirmaDocumento::UPN_FIRMA_LOCAL->value,
                        'folio_local' => $folioLocal,
                        'url_short' => $tokenConsulta,
                        'pdf_generado' => $pdfGenerado,
                    ],
                    userId: $usuarioId,
                );

                return new FirmaDocumentoResult(
                    success: true,
                    message: 'Documento firmado localmente (UPN).',
                    documentoId: $doc->id,
                    urlShort: $tokenConsulta,
                    folioDigitalSep: $folioLocal,
                    estadoFirma: EstadoFirma::FIRMADO->value,
                    canalFirma: CanalFirmaDocumento::UPN_FIRMA_LOCAL->value,
                    pdfGenerado: $pdfGenerado,
                );
            });
        } catch (\Throwable $e) {
            $this->liberarError($documento, $e->getMessage(), $usuarioId);

            return new FirmaDocumentoResult(
                success: false,
                message: 'No se pudo completar la firma local UPN.',
                documentoId: $documento->id,
                estadoFirma: EstadoFirma::ERROR_FIRMA->value,
                errorCode: 'upn_firma_excepcion',
                errors: [$e->getMessage()],
                canalFirma: CanalFirmaDocumento::UPN_FIRMA_LOCAL->value,
            );
        }
    }

    protected function generarPdfUpn(DocumentoAcademico $documento, ?int $usuarioId): bool
    {
        if (! (bool) config('certificacion.pdf.generation_enabled', true)) {
            return false;
        }

        $correlationId = Str::uuid()->toString();
        $this->estados->cambiarEstado(
            $documento,
            'estado_pdf',
            EstadoPdf::GENERANDO->value,
            $usuarioId,
            'Generación PDF UPN (controlado).',
        );

        try {
            $payloadPdf = $this->payloadBuilder->obtenerOCrearPayloadPdf($documento, $usuarioId);
            $plantilla = $this->payloadBuilder->resolverPlantilla($documento);
            /** @var array<string, mixed> $payloadArr */
            $payloadArr = $payloadPdf->payload_json ?? [];
            $pdfBinario = $this->renderService->render($payloadArr, $plantilla);
            $sha = hash('sha256', $pdfBinario);

            $this->storage->registrarVersionDocumental(
                $documento,
                'PDF_OFICIAL',
                [
                    'documento_payload_id' => $payloadPdf->id,
                    'contenido' => $pdfBinario,
                    'sha256' => $sha,
                    'size_bytes' => strlen($pdfBinario),
                    'metadata' => [
                        'modo' => 'upn_pdf_controlado',
                        'canal' => CanalFirmaDocumento::UPN_FIRMA_LOCAL->value,
                    ],
                ],
                $usuarioId,
            );

            $this->estados->cambiarEstado(
                $documento->fresh(),
                'estado_pdf',
                EstadoPdf::GENERADO->value,
                $usuarioId,
                'PDF UPN generado.',
            );

            IntegracionLog::query()->create([
                'documento_academico_id' => $documento->id,
                'tipo' => 'PDF_GENERATION',
                'method' => 'UPN_LOCAL',
                'correlation_id' => $correlationId,
                'idempotency_key' => 'upn-pdf-'.$documento->id.'-'.$correlationId,
                'request_payload' => ['canal' => 'upn_firma_local'],
                'response_payload' => ['sha256' => $sha, 'bytes' => strlen($pdfBinario)],
                'estado' => 'OK',
            ]);

            return true;
        } catch (\Throwable $e) {
            $this->estados->cambiarEstado(
                $documento->fresh(),
                'estado_pdf',
                EstadoPdf::ERROR_PDF->value,
                $usuarioId,
                'Error PDF UPN: '.$e->getMessage(),
            );

            $this->auditoria->registrar(
                evento: 'pdf_generacion_fallo',
                entidadTipo: DocumentoAcademico::class,
                entidadId: $documento->id,
                payload: ['error' => $e->getMessage(), 'canal' => 'upn'],
                userId: $usuarioId,
            );

            return false;
        }
    }

    protected function resolverXmlOriginal(DocumentoAcademico $documento): DocumentoVersion
    {
        $v = DocumentoVersion::query()
            ->where('documento_academico_id', $documento->id)
            ->where('tipo', 'XML_ORIGINAL')
            ->where('activo', true)
            ->orderByDesc('version')
            ->first();

        if ($v === null) {
            throw ValidationException::withMessages(['xml' => ['No existe versión activa XML_ORIGINAL.']]);
        }

        return $v;
    }

    protected function resolverCadena(DocumentoAcademico $documento, DocumentoVersion $xml): ?CadenaOriginalGenerada
    {
        if ($xml->cadena_original_generada_id !== null) {
            return CadenaOriginalGenerada::query()->find($xml->cadena_original_generada_id);
        }

        return CadenaOriginalGenerada::query()
            ->where('documento_academico_id', $documento->id)
            ->where('estado', EstadoCadena::GENERADA->value)
            ->orderByDesc('id')
            ->first();
    }

    protected function empaquetarXmlFirmadoLocal(string $xmlOriginal, string $sello, string $folio): string
    {
        $selloEsc = htmlspecialchars($sello, ENT_XML1 | ENT_QUOTES, 'UTF-8');
        $folioEsc = htmlspecialchars($folio, ENT_XML1 | ENT_QUOTES, 'UTF-8');

        if (str_contains($xmlOriginal, '</Dec>')) {
            return str_replace(
                '</Dec>',
                "<FirmaLocalUPN folio=\"{$folioEsc}\" sello=\"{$selloEsc}\"/></Dec>",
                $xmlOriginal,
            );
        }

        return $xmlOriginal."\n<!-- FirmaLocalUPN folio=\"{$folioEsc}\" -->";
    }

    /**
     * @param  list<string>  $errores
     */
    protected function fallo(DocumentoAcademico $doc, string $code, array $errores, ?int $usuarioId): FirmaDocumentoResult
    {
        if ($doc->estado_firma !== EstadoFirma::FIRMADO->value) {
            $doc->forceFill(['estado_firma' => EstadoFirma::ERROR_FIRMA->value])->save();
        }

        $meta = is_array($doc->metadata) ? $doc->metadata : [];
        $doc->metadata = array_merge($meta, [
            'firma_upn_local' => [
                'last_attempt_at' => now()->toIso8601String(),
                'last_error' => implode(' ', $errores),
                'error_code' => $code,
            ],
        ]);
        $doc->save();

        $this->auditoria->registrar(
            evento: 'firma_fallo',
            entidadTipo: DocumentoAcademico::class,
            entidadId: $doc->id,
            payload: ['error_code' => $code, 'canal' => 'upn_firma_local'],
            userId: $usuarioId,
        );

        return new FirmaDocumentoResult(
            success: false,
            message: 'No se pudo firmar el documento UPN.',
            documentoId: $doc->id,
            estadoFirma: $doc->estado_firma,
            errorCode: $code,
            errors: $errores,
            canalFirma: CanalFirmaDocumento::UPN_FIRMA_LOCAL->value,
        );
    }

    protected function liberarError(DocumentoAcademico $documento, string $mensaje, ?int $usuarioId): void
    {
        DB::transaction(function () use ($documento, $mensaje, $usuarioId): void {
            $doc = DocumentoAcademico::query()->lockForUpdate()->find($documento->id);
            if ($doc === null || $doc->estado_firma !== EstadoFirma::FIRMANDO->value) {
                return;
            }
            $doc->forceFill(['estado_firma' => EstadoFirma::ERROR_FIRMA->value])->save();
            $this->auditoria->registrar(
                evento: 'firma_fallo',
                entidadTipo: DocumentoAcademico::class,
                entidadId: $doc->id,
                payload: ['error' => $mensaje, 'canal' => 'upn_firma_local'],
                userId: $usuarioId,
            );
        });
    }
}
