<?php

declare(strict_types=1);

namespace App\Services\Firma;

use App\Data\Firma\FirmaDocumentoResult;
use App\Enums\Certificacion\EstadoFirma;
use App\Enums\Certificacion\EstadoWorkflow;
use App\Models\DocumentoAcademico;
use App\Models\UrlShortToken;
use App\Services\Certificacion\AuditoriaService;
use App\Services\Certificacion\DocumentoPreflightValidator;
use App\Services\SicesLegacy\SicesLegacyShadowExportService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Reserva pesimista y validaciones previas a firma SEP (servicio 34 o since-títulos).
 */
class DocumentoFirmaReservaService
{
    public function __construct(
        protected DocumentoPreflightValidator $preflight,
        protected SicesLegacyShadowExportService $shadowExportValidator,
        protected AuditoriaService $auditoria,
    ) {}

    /**
     * @return FirmaDocumentoResult|array{0: DocumentoAcademico, 1: string}
     */
    public function reservarParaTimbradoSep(
        int $documentoId,
        ?int $usuarioId,
        string $metadataKey = 'firma_sep',
    ): FirmaDocumentoResult|array {
        return DB::transaction(function () use ($documentoId, $usuarioId, $metadataKey): FirmaDocumentoResult|array {
            $documento = DocumentoAcademico::query()->lockForUpdate()->find($documentoId);
            if ($documento === null) {
                throw (new ModelNotFoundException)->setModel(DocumentoAcademico::class, [$documentoId]);
            }

            $erroresPrevios = $this->collectPreFirmaErrors($documento);
            if ($erroresPrevios !== []) {
                return $this->falloResultado($documento, 'No se pudo firmar el documento.', 'prefirma_fallido', $erroresPrevios, $usuarioId, $metadataKey);
            }

            try {
                $this->preflight->assertListoParaFirmaTecnica($documento);
            } catch (ValidationException $e) {
                $flat = collect($e->errors())->flatten()->values()->all();

                return $this->falloResultado($documento, 'No se pudo firmar el documento.', 'preflight_fallido', $flat, $usuarioId, $metadataKey);
            }

            $shadowErrores = $this->shadowExportValidator->collectExportErrors($documento);
            if ($shadowErrores !== []) {
                return $this->falloResultado(
                    $documento,
                    'No se pudo firmar: shadow export incompleto.',
                    'shadow_incompleto',
                    $shadowErrores,
                    $usuarioId,
                    $metadataKey,
                );
            }

            if (! $this->assertShadowExportConfirmado($documento)) {
                return $this->falloResultado(
                    $documento,
                    'No se pudo firmar: el documento no fue exportado a SICES legacy.',
                    'shadow_no_exportado',
                    ['legacy_shadow' => ['Exporte a SICES legacy antes de firmar.']],
                    $usuarioId,
                    $metadataKey,
                );
            }

            $urlShort = $this->resolverUrlShort($documento);
            $documento->forceFill(['estado_firma' => EstadoFirma::FIRMANDO->value])->save();

            return [$documento->fresh(), $urlShort];
        });
    }

    /**
     * @return list<string>
     */
    public function collectPreFirmaErrors(DocumentoAcademico $documento): array
    {
        $errores = [];
        $meta = is_array($documento->metadata) ? $documento->metadata : [];
        if (! ($meta['listo_para_firma'] ?? false)) {
            $errores[] = 'El documento no está liberado a proceso técnico.';
        }

        if ($documento->estado_workflow === EstadoWorkflow::CANCELADO->value) {
            $errores[] = 'El documento está cancelado.';
        }

        if (in_array($documento->estado_firma, [EstadoFirma::FIRMADO->value, EstadoFirma::FIRMANDO->value], true)) {
            $errores[] = 'El documento ya está firmado o en proceso de firma.';
        }

        return $errores;
    }

    public function resolverUrlShort(DocumentoAcademico $documento): string
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
                'url_short' => ['No hay url_short para timbrado SEP.'],
            ]);
        }

        return $token;
    }

    public function assertShadowExportConfirmado(DocumentoAcademico $documento): bool
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

    public function liberarReservaFirmaEnError(DocumentoAcademico $documento, string $mensaje, ?int $usuarioId, string $metadataKey): void
    {
        DB::transaction(function () use ($documento, $mensaje, $usuarioId, $metadataKey): void {
            $doc = DocumentoAcademico::query()->lockForUpdate()->find($documento->id);
            if ($doc === null || $doc->estado_firma !== EstadoFirma::FIRMANDO->value) {
                return;
            }

            $doc->forceFill(['estado_firma' => EstadoFirma::ERROR_FIRMA->value])->save();

            $meta = is_array($doc->metadata) ? $doc->metadata : [];
            $firmaMeta = is_array($meta[$metadataKey] ?? null) ? $meta[$metadataKey] : [];
            $doc->metadata = array_merge($meta, [
                $metadataKey => array_merge($firmaMeta, [
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
                payload: ['error_code' => 'since_excepcion', 'error' => $mensaje, 'canal' => $metadataKey],
                userId: $usuarioId,
            );
        });
    }

    /**
     * @param  list<string>|array<string, mixed>  $errores
     */
    public function falloResultado(
        DocumentoAcademico $documento,
        string $message,
        string $errorCode,
        array $errores,
        ?int $usuarioId,
        string $metadataKey,
    ): FirmaDocumentoResult {
        $doc = $documento->fresh() ?? $documento;

        $preservarEstadoEnCurso = $errorCode === 'prefirma_fallido'
            && in_array($doc->estado_firma, [EstadoFirma::FIRMADO->value, EstadoFirma::FIRMANDO->value], true);

        if (! $preservarEstadoEnCurso && $doc->estado_firma !== EstadoFirma::FIRMADO->value) {
            $doc->forceFill(['estado_firma' => EstadoFirma::ERROR_FIRMA->value])->save();
        }

        $flat = is_array($errores) && array_is_list($errores)
            ? $errores
            : collect($errores)->flatten()->values()->all();

        $meta = is_array($doc->metadata) ? $doc->metadata : [];
        $firmaMeta = is_array($meta[$metadataKey] ?? null) ? $meta[$metadataKey] : [];
        $doc->metadata = array_merge($meta, [
            $metadataKey => array_merge($firmaMeta, [
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
            payload: ['error_code' => $errorCode, 'errores' => array_slice($flat, 0, 15), 'canal' => $metadataKey],
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
