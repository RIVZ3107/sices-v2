<?php

declare(strict_types=1);

namespace App\Services\Firma;

use App\Contracts\Firma\DocumentoFirmaCanalHandlerInterface;
use App\Data\Firma\FirmaDocumentoResult;
use App\Enums\Certificacion\CanalFirmaDocumento;
use App\Enums\Certificacion\EstadoFirma;
use App\Models\DocumentoAcademico;
use App\Services\Certificacion\AuditoriaService;
use App\Services\Firma\Handlers\GradoSepFirmaHandler;
use App\Services\Firma\Handlers\NormalCertificadoSepFirmaHandler;
use App\Services\Firma\Handlers\TituloSepFirmaHandler;
use App\Services\Firma\Handlers\UpnFirmaLocalPdfHandler;
use InvalidArgumentException;

/**
 * Orquestador único de firma/timbrado según subsistema y tipo documental.
 */
class DocumentoFirmaUnificadoService
{
    /** @var array<string, DocumentoFirmaCanalHandlerInterface> */
    protected array $handlers;

    public function __construct(
        protected DocumentoFirmaCanalResolver $canalResolver,
        protected DocumentoFirmaPostFirmaService $postFirma,
        protected AuditoriaService $auditoria,
        NormalCertificadoSepFirmaHandler $normalHandler,
        UpnFirmaLocalPdfHandler $upnHandler,
        TituloSepFirmaHandler $tituloHandler,
        GradoSepFirmaHandler $gradoHandler,
    ) {
        $this->handlers = [
            CanalFirmaDocumento::NORMAL_CERTIFICADO_SEP->value => $normalHandler,
            CanalFirmaDocumento::UPN_FIRMA_LOCAL->value => $upnHandler,
            CanalFirmaDocumento::TITULO_SEP->value => $tituloHandler,
            CanalFirmaDocumento::GRADO_SEP->value => $gradoHandler,
        ];
    }

    public function firmar(DocumentoAcademico $documento, ?int $usuarioId = null): FirmaDocumentoResult
    {
        $documento = $documento->fresh() ?? $documento;

        if ($documento->estado_firma === EstadoFirma::FIRMADO->value) {
            return new FirmaDocumentoResult(
                success: false,
                message: 'El documento ya está firmado.',
                documentoId: $documento->id,
                estadoFirma: $documento->estado_firma,
                errorCode: 'ya_firmado',
                errors: ['El documento ya consta como firmado; no se permite doble firma.'],
            );
        }

        if ($documento->estado_firma === EstadoFirma::FIRMANDO->value) {
            return new FirmaDocumentoResult(
                success: false,
                message: 'Firma en curso.',
                documentoId: $documento->id,
                estadoFirma: $documento->estado_firma,
                errorCode: 'firma_en_curso',
                errors: ['El documento ya está en proceso de firma.'],
            );
        }

        $canal = $this->canalResolver->resolver($documento);

        $this->auditoria->registrar(
            evento: 'firma_canal_resuelto',
            entidadTipo: DocumentoAcademico::class,
            entidadId: $documento->id,
            payload: [
                'canal' => $canal->value,
                'subsistema' => $documento->subsistema?->clave,
                'tipo_documento' => $documento->tipo_documento,
            ],
            userId: $usuarioId,
        );

        $handler = $this->handlers[$canal->value] ?? null;
        if ($handler === null) {
            throw new InvalidArgumentException("Sin handler para canal [{$canal->value}].");
        }

        $resultado = $handler->firmar($documento, $usuarioId);

        if (! $resultado->success) {
            return $this->conCanal($resultado, $canal);
        }

        $docRefrescado = DocumentoAcademico::query()->find($resultado->documentoId) ?? $documento;
        $urlShort = $this->postFirma->asegurarConsultaPublica(
            $docRefrescado,
            $usuarioId,
        ) ?? $resultado->urlShort;

        return new FirmaDocumentoResult(
            success: true,
            message: $resultado->message,
            documentoId: $resultado->documentoId,
            urlShort: $urlShort,
            folioDigitalSep: $resultado->folioDigitalSep,
            estadoFirma: $resultado->estadoFirma,
            canalFirma: $canal->value,
            pdfGenerado: $resultado->pdfGenerado,
        );
    }

    /**
     * @return array<string, mixed>
     */
    public function configuracionCanales(): array
    {
        return [
            'canales' => array_map(
                fn (CanalFirmaDocumento $c) => $this->configuracionDeCanal($c),
                CanalFirmaDocumento::cases(),
            ),
            'since_firma_enabled' => (bool) config('since.firma.enabled', false),
            'since_firma_simulated' => (bool) config('since.firma.simulated', false),
            'since_titulos_enabled' => (bool) config('since.titulos.enabled', false),
            'since_titulos_simulated' => (bool) config('since.titulos.simulated', false),
            'upn_firma_local_enabled' => (bool) config('since.upn.firma_local_enabled', true),
            'legacy_writeback_enabled' => (bool) config('sices_legacy.writeback_enabled', false),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    protected function configuracionDeCanal(CanalFirmaDocumento $canal): array
    {
        $base = [
            'clave' => $canal->value,
            'label' => $canal->label(),
            'requiere_servicio_34' => $canal->requiereServicio34(),
            'requiere_since_titulos' => $canal->requiereSinceTitulos(),
        ];

        return match ($canal) {
            CanalFirmaDocumento::NORMAL_CERTIFICADO_SEP => array_merge($base, [
                'habilitado' => (bool) config('since.firma.enabled', false),
                'simulated' => (bool) config('since.firma.simulated', false),
                'endpoint' => $this->enmascararEndpoint($this->endpointServicio34()),
            ]),
            CanalFirmaDocumento::UPN_FIRMA_LOCAL => array_merge($base, [
                'habilitado' => (bool) config('since.upn.firma_local_enabled', true),
                'simulated' => true,
                'endpoint' => null,
            ]),
            CanalFirmaDocumento::TITULO_SEP => array_merge($base, [
                'habilitado' => (bool) config('since.titulos.enabled', false),
                'simulated' => (bool) config('since.titulos.simulated', false),
                'endpoint' => $this->enmascararEndpoint((string) config('since.titulos.titulo_prod_url', '')),
            ]),
            CanalFirmaDocumento::GRADO_SEP => array_merge($base, [
                'habilitado' => (bool) config('since.titulos.enabled', false),
                'simulated' => (bool) config('since.titulos.simulated', false),
                'endpoint' => $this->enmascararEndpoint((string) config('since.titulos.grado_prod_url', '')),
            ]),
        };
    }

    protected function endpointServicio34(): ?string
    {
        $env = strtolower((string) config('since.firma.env', 'dev'));
        $prod = $env === 'prod' || $env === 'production'
            || filter_var(env('SINCE_FIRMA_PROD', config('since.firma.prod_flag', '1') === '1'), FILTER_VALIDATE_BOOL);

        $url = $prod
            ? (string) config('since.firma.prod_url', '')
            : (string) config('since.firma.dev_url', '');

        return $url !== '' ? $url : null;
    }

    protected function enmascararEndpoint(?string $url): ?string
    {
        if ($url === null || trim($url) === '') {
            return null;
        }

        $parsed = parse_url($url);
        if ($parsed === false || ! isset($parsed['host'])) {
            return '[endpoint-configurado]';
        }

        $path = $parsed['path'] ?? '';

        return ($parsed['scheme'] ?? 'http').'://'.$parsed['host'].($path !== '' ? $path : '');
    }

    protected function conCanal(FirmaDocumentoResult $resultado, CanalFirmaDocumento $canal): FirmaDocumentoResult
    {
        return new FirmaDocumentoResult(
            success: $resultado->success,
            message: $resultado->message,
            documentoId: $resultado->documentoId,
            urlShort: $resultado->urlShort,
            folioDigitalSep: $resultado->folioDigitalSep,
            estadoFirma: $resultado->estadoFirma,
            errorCode: $resultado->errorCode,
            errors: $resultado->errors,
            canalFirma: $resultado->canalFirma ?? $canal->value,
            pdfGenerado: $resultado->pdfGenerado,
        );
    }
}
