<?php

declare(strict_types=1);

namespace App\Services\Firma;

use App\Data\Firma\SinceFirmaResult;
use App\Enums\Certificacion\EstadoFirma;
use App\Enums\Certificacion\EstadoXml;
use App\Exceptions\Legacy\InformixWriteDisabledException;
use App\Models\DocumentoAcademico;
use App\Models\DocumentoFirma;
use App\Models\UrlShortToken;
use App\Services\Certificacion\AuditoriaService;
use App\Services\Certificacion\DocumentoEstadoService;
use App\Services\Certificacion\DocumentoPreflightValidator;
use App\Services\Certificacion\FirmarDocumentoAcademicoService;
use App\Services\Legacy\SicesLegacyCertificationShadowService;
use App\Infrastructure\Since\SinceFirmaClient;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Orquestador híbrido: preflight → shadow Informix → servicio 34 (urlshort+prod).
 */
class LegacySinceSigningBridgeService
{
    public function __construct(
        protected DocumentoPreflightValidator $preflight,
        protected SicesLegacyCertificationShadowService $shadow,
        protected SinceFirmaClient $sinceClient,
        protected DocumentoEstadoService $estados,
        protected AuditoriaService $auditoria,
        protected FirmarDocumentoAcademicoService $firmaSimuladaLegacy,
    ) {}

    /**
     * @return array{success: bool, message: string, documento_id: int, estado_firma: string, folio_digital_sep: ?string, errores?: list<string>}
     */
    public function ejecutarFirma(DocumentoAcademico $documento, ?int $usuarioId = null): array
    {
        if (! config('certificacion.sep_firma.use_bridge', false) && $this->sinceClient->debeUsarSoloSimulacion()) {
            $firma = $this->firmaSimuladaLegacy->firmarSimulado($documento->fresh(), null, null, $usuarioId);

            return [
                'success' => true,
                'message' => 'Firma simulada (bridge desactivado).',
                'documento_id' => $documento->id,
                'estado_firma' => $documento->fresh()->estado_firma,
                'folio_digital_sep' => $firma->folio_digital_sep,
            ];
        }

        try {
            $this->preflight->assertListoParaFirmaTecnica($documento);
        } catch (ValidationException $e) {
            return $this->fallo($documento, $e->errors(), $usuarioId);
        }

        try {
            if (config('informix.enabled') && config('informix.write_enabled')) {
                $this->shadow->syncForSigning($documento->fresh());
            } elseif (config('informix.enabled') && ! config('informix.write_enabled')) {
                throw new InformixWriteDisabledException('INFORMIX_WRITE_ENABLED=false');
            }
        } catch (InformixWriteDisabledException $e) {
            return $this->fallo($documento, ['informix' => [$e->getMessage()]], $usuarioId);
        } catch (ValidationException $e) {
            return $this->fallo($documento, $e->errors(), $usuarioId);
        }

        $urlShort = (string) ($documento->fresh()->token_consulta_publica
            ?? UrlShortToken::query()
                ->where('documento_academico_id', $documento->id)
                ->where('estado', 'activo')
                ->value('token'));

        $resultado = $this->sinceClient->firmarPorUrlShort(
            $urlShort,
            (bool) config('certificacion.sep_firma.produccion', false),
        );

        if (! $resultado->success) {
            return $this->registrarErrorFirma($documento, $resultado, $usuarioId);
        }

        return DB::transaction(function () use ($documento, $resultado, $usuarioId): array {
            $doc = $documento->fresh();

            DocumentoFirma::query()->create([
                'documento_academico_id' => $doc->id,
                'proveedor' => $resultado->simulada ? 'simulado_servicio_34' : 'since_servicio_34',
                'estado' => 'firmado',
                'folio_digital_sep' => $resultado->folioDigital,
                'xml_firmado' => $resultado->xmlFirmado,
                'response_payload' => $resultado->rawResponse,
                'http_status' => $resultado->httpStatus,
                'signed_at' => now(),
                'created_by' => $usuarioId,
            ]);

            $doc->forceFill([
                'folio_digital_sep' => $resultado->folioDigital,
                'estado_firma' => EstadoFirma::FIRMADO->value,
                'fecha_firma' => now(),
            ])->save();

            $this->estados->cambiarEstado(
                $doc,
                'estado_xml',
                EstadoXml::SELLADO->value,
                $usuarioId,
                'XML timbrado vía servicio 34.',
            );

            $meta = is_array($doc->metadata) ? $doc->metadata : [];
            $doc->metadata = array_merge($meta, [
                'sello_sep' => $resultado->selloSep,
                'firma_servicio_34' => [
                    'at' => now()->toIso8601String(),
                    'simulada' => $resultado->simulada,
                ],
            ]);
            $doc->save();

            $this->auditoria->registrar(
                'documento_academico.firma_servicio_34',
                DocumentoAcademico::class,
                $doc->id,
                [
                    'folio_digital' => $resultado->folioDigital,
                    'simulada' => $resultado->simulada,
                ],
                $usuarioId,
            );

            return [
                'success' => true,
                'message' => $resultado->simulada
                    ? 'Firma simulada vía bridge servicio 34.'
                    : 'Firma técnica ejecutada vía servicio 34.',
                'documento_id' => $doc->id,
                'estado_firma' => $doc->estado_firma,
                'folio_digital_sep' => $resultado->folioDigital,
            ];
        });
    }

    /**
     * @param  array<string, list<string>>  $errores
     * @return array{success: bool, message: string, documento_id: int, estado_firma: string, folio_digital_sep: null, errores: array<string, list<string>>}
     */
    protected function fallo(DocumentoAcademico $documento, array $errores, ?int $usuarioId): array
    {
        $doc = $documento->fresh();
        $doc->forceFill(['estado_firma' => EstadoFirma::ERROR_FIRMA->value])->save();

        $this->auditoria->registrar(
            'documento_academico.firma_preflight_fallido',
            DocumentoAcademico::class,
            $doc->id,
            ['errores' => $errores],
            $usuarioId,
        );

        return [
            'success' => false,
            'message' => 'Preflight o shadow falló; no se llamó al servicio 34.',
            'documento_id' => $doc->id,
            'estado_firma' => $doc->estado_firma,
            'folio_digital_sep' => null,
            'errores' => $errores,
        ];
    }

    /**
     * @return array{success: bool, message: string, documento_id: int, estado_firma: string, folio_digital_sep: null, errores: array<string, string>}
     */
    protected function registrarErrorFirma(
        DocumentoAcademico $documento,
        SinceFirmaResult $resultado,
        ?int $usuarioId,
    ): array {
        $doc = $documento->fresh();
        $doc->forceFill(['estado_firma' => EstadoFirma::ERROR_FIRMA->value])->save();

        $mensaje = $resultado->errorMessage ?? 'Error servicio 34';

        DocumentoFirma::query()->create([
            'documento_academico_id' => $doc->id,
            'proveedor' => 'since_servicio_34',
            'estado' => 'error',
            'error_message' => $mensaje,
            'response_payload' => $resultado->rawResponse,
            'http_status' => $resultado->httpStatus,
            'created_by' => $usuarioId,
        ]);

        $this->auditoria->registrar(
            'documento_academico.firma_servicio_34_error',
            DocumentoAcademico::class,
            $doc->id,
            ['error' => $mensaje, 'http_status' => $resultado->httpStatus],
            $usuarioId,
        );

        return [
            'success' => false,
            'message' => $mensaje,
            'documento_id' => $doc->id,
            'estado_firma' => $doc->estado_firma,
            'folio_digital_sep' => null,
            'errores' => ['servicio_34' => [$mensaje]],
        ];
    }
}
