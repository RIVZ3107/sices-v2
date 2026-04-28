<?php

declare(strict_types=1);

namespace App\Services\Certificacion;

use App\Enums\Certificacion\EstadoCadena;
use App\Enums\Certificacion\EstadoFirma;
use App\Enums\Certificacion\EstadoXml;
use App\Enums\Certificacion\ProveedorFirma;
use App\Exceptions\Certificacion\DocumentoNoPreparadoParaFirmaException;
use App\Exceptions\Certificacion\FirmaConfiguracionNoEncontradaException;
use App\Models\CadenaOriginalGenerada;
use App\Models\DocumentoAcademico;
use App\Models\DocumentoFirma;
use App\Models\DocumentoVersion;
use App\Models\FirmaConfiguracion;
use App\Models\FirmanteAutorizado;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Orquesta la firma en modo simulado (since-service no real / sin validez SEP).
 */
class FirmarDocumentoAcademicoService
{
    public function __construct(
        protected SinceFirmaClient $sinceFirma,
        protected DocumentoEstadoService $estados,
        protected AuditoriaService $auditoria,
        protected DocumentStorageService $storage,
    ) {}

    /**
     * Ejecuta flujo de firma controlado. No usa endpoints ni llaves reales.
     *
     * @throws DocumentoNoPreparadoParaFirmaException
     * @throws FirmaConfiguracionNoEncontradaException
     */
    public function firmarSimulado(
        DocumentoAcademico $documento,
        ?DocumentoVersion $xmlOriginal = null,
        ?int $firmanteAutorizadoId = null,
        ?int $usuarioId = null,
    ): DocumentoFirma {
        return DB::transaction(function () use ($documento, $xmlOriginal, $firmanteAutorizadoId, $usuarioId) {
            $documento->refresh();

            if ($documento->estado_firma === EstadoFirma::FIRMADO->value) {
                throw new DocumentoNoPreparadoParaFirmaException('El documento ya consta como firmado.');
            }

            $xmlOriginal ??= $this->resolverXmlOriginalActivo($documento);
            $contenidoXml = (string) ($xmlOriginal->contenido ?? '');
            if ($contenidoXml === '') {
                throw new DocumentoNoPreparadoParaFirmaException('No hay contenido XML original para firmar.');
            }

            $this->validarDocumentoListoParaFirma($documento);

            $firmaConfig = $this->resolverFirmaConfiguracionSimulada($documento);

            $firmante = null;
            if ($firmaConfig->requiere_firmante) {
                if ($firmanteAutorizadoId === null) {
                    throw new DocumentoNoPreparadoParaFirmaException('La configuración de firma exige firmante autorizado.');
                }
                $firmante = FirmanteAutorizado::query()->find($firmanteAutorizadoId);
                if ($firmante === null || $firmante->estatus !== 'activo') {
                    throw new DocumentoNoPreparadoParaFirmaException('Firmante autorizado inválido o inactivo.');
                }
            }

            $cadena = $this->resolverCadenaParaFirma($documento, $xmlOriginal, $firmaConfig);

            $correlationId = Str::uuid()->toString();
            $idempotencyKey = 'firma-sim-'.$documento->id.'-'.$xmlOriginal->id.'-'.$correlationId;

            $this->estados->cambiarEstado(
                $documento->fresh(),
                'estado_firma',
                EstadoFirma::FIRMANDO->value,
                $usuarioId,
                'Inicio de firma simulada (since-service no real).',
                ['documento_version_id' => $xmlOriginal->id],
            );

            $entradaSince = [
                'correlation_id' => $correlationId,
                'idempotency_key' => $idempotencyKey,
                'xml_contenido' => $contenidoXml,
                'cadena_hash' => $cadena?->cadena_hash,
            ];

            $requestPayload = [
                'documento_academico_id' => $documento->id,
                'documento_version_id' => $xmlOriginal->id,
                'firma_configuracion_id' => $firmaConfig->id,
                'firmante_autorizado_id' => $firmante?->id,
                'entrada_since' => $entradaSince,
                'modo' => 'firma_simulada_controlada',
            ];

            $respuestaSince = $this->sinceFirma->solicitarFirma($entradaSince);

            $xmlFirmado = $this->empaquetarXmlFirmadoSimulado($contenidoXml, $respuestaSince);

            $firmaRegistro = DocumentoFirma::query()->create([
                'documento_academico_id' => $documento->id,
                'documento_version_id' => $xmlOriginal->id,
                'firma_configuracion_id' => $firmaConfig->id,
                'firmante_autorizado_id' => $firmante?->id,
                'proveedor' => ProveedorFirma::SIMULADO->value,
                'endpoint' => config('certificacion.sep_firma.endpoint') ?: $firmaConfig->endpoint,
                'estado' => 'firmado',
                'folio_digital_sep' => $respuestaSince['folio_digital_sep_simulado'] ?? null,
                'xml_firmado' => $xmlFirmado,
                'correlation_id' => $correlationId,
                'idempotency_key' => $idempotencyKey,
                'request_payload' => $requestPayload,
                'response_payload' => $respuestaSince,
                'http_status' => 200,
                'error_message' => null,
                'sent_at' => now(),
                'signed_at' => now(),
                'created_by' => $usuarioId,
            ]);

            $shaXmlFirmado = hash('sha256', $xmlFirmado);

            $this->storage->registrarVersionDocumental(
                $documento->fresh(),
                'XML_FIRMADO_SEP',
                [
                    'documento_payload_id' => $xmlOriginal->documento_payload_id,
                    'cadena_original_generada_id' => $cadena?->id ?? $xmlOriginal->cadena_original_generada_id,
                    'contenido' => $xmlFirmado,
                    'sha256' => $shaXmlFirmado,
                    'size_bytes' => strlen($xmlFirmado),
                    'metadata' => [
                        'modo' => 'firma_simulada',
                        'estado_validacion' => 'pendiente_validacion_sep',
                        'requiere_revision_senior' => true,
                        'documento_firma_id' => $firmaRegistro->id,
                        'no_afirmar_validez_sep' => true,
                    ],
                ],
                $usuarioId,
            );

            $this->estados->cambiarEstado(
                $documento->fresh(),
                'estado_firma',
                EstadoFirma::FIRMADO->value,
                $usuarioId,
                'Firma simulada completada (sin validez SEP).',
                ['documento_firma_id' => $firmaRegistro->id],
            );

            $this->estados->cambiarEstado(
                $documento->fresh(),
                'estado_xml',
                EstadoXml::SELLADO->value,
                $usuarioId,
                'XML marcado como sellado tras firma simulada local.',
                ['documento_firma_id' => $firmaRegistro->id],
            );

            $metaAudit = [
                'modo' => 'firma_simulada',
                'documento_firma_id' => $firmaRegistro->id,
                'folio_simulado' => $respuestaSince['folio_digital_sep_simulado'] ?? null,
                'requiere_revision_senior_sep' => true,
            ];

            $this->auditoria->registrar(
                'FIRMA_SIMULADA_COMPLETADA',
                DocumentoAcademico::class,
                $documento->id,
                [
                    'documento_firma_id' => $firmaRegistro->id,
                    'correlation_id' => $correlationId,
                ],
                $usuarioId,
                null,
                null,
                $metaAudit,
            );

            return $firmaRegistro->fresh();
        });
    }

    /**
     * @throws DocumentoNoPreparadoParaFirmaException
     */
    protected function resolverXmlOriginalActivo(DocumentoAcademico $documento): DocumentoVersion
    {
        $v = DocumentoVersion::query()
            ->where('documento_academico_id', $documento->id)
            ->where('tipo', 'XML_ORIGINAL')
            ->where('activo', true)
            ->orderByDesc('version')
            ->first();

        if ($v === null) {
            throw new DocumentoNoPreparadoParaFirmaException('No existe versión activa XML_ORIGINAL.');
        }

        return $v;
    }

    /**
     * @throws DocumentoNoPreparadoParaFirmaException
     */
    protected function validarDocumentoListoParaFirma(DocumentoAcademico $documento): void
    {
        if ($documento->estado_cadena !== EstadoCadena::GENERADA->value) {
            throw new DocumentoNoPreparadoParaFirmaException(
                'La cadena original debe estar en estado generada antes de firmar.'
            );
        }

        if ($documento->estado_xml !== EstadoXml::GENERADO->value) {
            throw new DocumentoNoPreparadoParaFirmaException(
                'El XML debe estar generado antes de firmar.'
            );
        }
    }

    protected function resolverFirmaConfiguracionSimulada(DocumentoAcademico $documento): FirmaConfiguracion
    {
        $tipo = $documento->tipo_documento;
        if ($tipo === null || $tipo === '') {
            throw new FirmaConfiguracionNoEncontradaException('El documento no tiene tipo_documento definido.');
        }

        $subsistemaId = $documento->subsistema_id;
        $institucionId = $documento->institucion_id;
        $nivelId = $this->resolverNivelAcademicoId($documento);

        $base = FirmaConfiguracion::query()
            ->where('tipo_documento', $tipo)
            ->where('proveedor', ProveedorFirma::SIMULADO->value)
            ->whereIn('estatus', ['activa', 'pruebas']);

        $intentos = [
            fn () => $institucionId && $subsistemaId && $nivelId
                ? (clone $base)->where('institucion_id', $institucionId)->where('subsistema_id', $subsistemaId)->where('nivel_academico_id', $nivelId)->orderBy('version_firma')->first()
                : null,
            fn () => $institucionId && $subsistemaId
                ? (clone $base)->where('institucion_id', $institucionId)->where('subsistema_id', $subsistemaId)->whereNull('nivel_academico_id')->orderBy('version_firma')->first()
                : null,
            fn () => $institucionId && $nivelId
                ? (clone $base)->where('institucion_id', $institucionId)->whereNull('subsistema_id')->where('nivel_academico_id', $nivelId)->orderBy('version_firma')->first()
                : null,
            fn () => $institucionId
                ? (clone $base)->where('institucion_id', $institucionId)->whereNull('subsistema_id')->whereNull('nivel_academico_id')->orderBy('version_firma')->first()
                : null,
            fn () => $subsistemaId && $nivelId
                ? (clone $base)->whereNull('institucion_id')->where('subsistema_id', $subsistemaId)->where('nivel_academico_id', $nivelId)->orderBy('version_firma')->first()
                : null,
            fn () => $subsistemaId
                ? (clone $base)->whereNull('institucion_id')->where('subsistema_id', $subsistemaId)->whereNull('nivel_academico_id')->orderBy('version_firma')->first()
                : null,
            fn () => $nivelId
                ? (clone $base)->whereNull('institucion_id')->whereNull('subsistema_id')->where('nivel_academico_id', $nivelId)->orderBy('version_firma')->first()
                : null,
            fn () => (clone $base)->whereNull('institucion_id')->whereNull('subsistema_id')->whereNull('nivel_academico_id')->orderBy('version_firma')->first(),
        ];

        foreach ($intentos as $resolver) {
            $r = $resolver();
            if ($r instanceof FirmaConfiguracion) {
                return $r;
            }
        }

        throw new FirmaConfiguracionNoEncontradaException(
            "No hay configuración de firma simulada activa para tipo_documento [{$tipo}]."
        );
    }

    protected function resolverNivelAcademicoId(DocumentoAcademico $documento): ?int
    {
        $documento->loadMissing('ofertaAcademica.programaEstudio');

        return $documento->ofertaAcademica?->programaEstudio?->nivel_academico_id;
    }

    protected function resolverCadenaParaFirma(
        DocumentoAcademico $documento,
        DocumentoVersion $xmlOriginal,
        FirmaConfiguracion $firmaConfig,
    ): ?CadenaOriginalGenerada {
        if (! $firmaConfig->requiere_cadena_original) {
            return null;
        }

        if ($xmlOriginal->cadena_original_generada_id) {
            $c = CadenaOriginalGenerada::query()->find($xmlOriginal->cadena_original_generada_id);
            if ($c !== null) {
                return $c;
            }
        }

        $ultima = CadenaOriginalGenerada::query()
            ->where('documento_academico_id', $documento->id)
            ->orderByDesc('version')
            ->first();

        if ($ultima === null) {
            throw new DocumentoNoPreparadoParaFirmaException('Se requiere cadena original generada y no existe ninguna.');
        }

        return $ultima;
    }

    /**
     * @param  array<string, mixed>  $respuestaSince
     */
    protected function empaquetarXmlFirmadoSimulado(string $xmlOriginal, array $respuestaSince): string
    {
        $advertencia = 'Este sobre XML es simulado para desarrollo; no acredita firma electrónica válida ante la SEP.';
        $payload = json_encode($respuestaSince, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);

        return '<?xml version="1.0" encoding="UTF-8"?>'
            ."\n<DocumentoFirmaSEP_Simulado xmlns=\"urn:sices:sep:firma:simulado\" modo=\"firma_simulada\">"
            .'<Advertencia>'.htmlspecialchars($advertencia, ENT_XML1 | ENT_COMPAT, 'UTF-8').'</Advertencia>'
            .'<XmlOriginal codificacion="base64">'.base64_encode($xmlOriginal).'</XmlOriginal>'
            .'<RespuestaSinceSimulada codificacion="json">'.htmlspecialchars((string) $payload, ENT_XML1 | ENT_COMPAT, 'UTF-8').'</RespuestaSinceSimulada>'
            .'</DocumentoFirmaSEP_Simulado>';
    }
}
