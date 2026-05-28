<?php

declare(strict_types=1);

namespace App\Infrastructure\Since;

use App\Data\Firma\SinceFirmaResponse;
use App\Data\Firma\SinceFirmaResult;
use App\Exceptions\Certificacion\FirmaSepRealNoDisponibleException;
use App\Services\Certificacion\OpenSslSelloService;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

/**
 * Cliente HTTP al servicio 34 SINCE/SEP.
 * Contrato: multipart/form-data con urlshort y prod únicamente.
 */
class SinceFirmaClient
{
    public function __construct(
        protected OpenSslSelloService $openSsl,
    ) {}

    /**
     * @param  array<string, mixed>  $entrada
     * @return array<string, mixed>
     */
    public function solicitarFirma(array $entrada): array
    {
        if ($this->debeUsarSoloSimulacion()) {
            return $this->construirRespuestaSimulada($entrada);
        }

        throw new FirmaSepRealNoDisponibleException(
            'Use firmarPorUrlShort() para el servicio 34; solicitarFirma() con XML está obsoleto para producción.',
        );
    }

    public function firmarPorUrlShort(string $urlShort, ?bool $produccion = null): SinceFirmaResponse
    {
        $urlShort = trim($urlShort);
        if ($urlShort === '') {
            return $this->respuestaError('urlshort_vacio', 'urlshort vacío.');
        }

        if (! $this->firmaHabilitada()) {
            return $this->respuestaError('since_firma_disabled', 'SINCE_FIRMA_ENABLED=false.');
        }

        if ($this->debeUsarSoloSimulacion()) {
            return $this->firmarSimuladaPorUrlShort($urlShort);
        }

        $endpoint = $this->resolverEndpoint();
        if ($endpoint === '') {
            return $this->respuestaError('endpoint_no_configurado', 'URL del servicio 34 no configurada.');
        }

        $prod = $produccion ?? $this->esProduccion();
        $timeout = (int) config('since.firma.timeout', 120);
        $connectTimeout = (int) config('since.firma.connect_timeout', 10);

        try {
            $response = Http::connectTimeout($connectTimeout)
                ->timeout($timeout)
                ->asMultipart()
                ->post($endpoint, [
                    ['name' => 'urlshort', 'contents' => $urlShort],
                    ['name' => 'prod', 'contents' => $prod ? '1' : '0'],
                ]);
        } catch (ConnectionException $e) {
            return $this->respuestaError(
                'conexion_fallida',
                'Conexión fallida con servicio 34: '.$e->getMessage(),
            );
        }

        $status = $response->status();
        $body = $response->body();

        if ($status === 415) {
            return $this->respuestaError(
                'http_415',
                'HTTP 415: el servicio 34 no aceptó multipart/form-data.',
                $status,
                $this->sanitizarRaw(['http_status' => $status, 'body_preview' => Str::limit($body, 300)]),
            );
        }

        if ($this->esRespuestaGlassfishHtml($body)) {
            return $this->respuestaError(
                'glassfish_html',
                'Respuesta HTML de GlassFish; verifique URL del servicio 34.',
                $status,
                $this->sanitizarRaw(['http_status' => $status, 'body_preview' => Str::limit($body, 300)]),
            );
        }

        $json = $response->json();
        if ($json === null && trim($body) !== '' && ! str_starts_with(trim($body), '{') && ! str_starts_with(trim($body), '[')) {
            if (str_contains(strtolower($body), 'error al autenticar la cadena')) {
                return $this->respuestaError(
                    'error_autenticar_cadena',
                    'Error al autenticar la cadena (servicio 34).',
                    $status,
                    $this->sanitizarRaw(['http_status' => $status, 'body_preview' => Str::limit(strip_tags($body), 400)]),
                );
            }
        }

        $parsed = $this->parseResponseBody($body, $json);

        if (! $parsed['success']) {
            return new SinceFirmaResponse(
                success: false,
                message: $parsed['error'] ?? 'Error desconocido del servicio 34.',
                errorCode: $parsed['error_code'] ?? 'sep_error',
                httpStatus: $status,
                rawSanitized: $parsed['raw'],
            );
        }

        return new SinceFirmaResponse(
            success: true,
            message: 'Documento firmado correctamente por servicio 34.',
            xmlFirmado: $parsed['xml_firmado'],
            folioDigital: $parsed['folio_digital'],
            selloSep: $parsed['sello_sep'],
            httpStatus: $status,
            rawSanitized: $parsed['raw'],
        );
    }

    /** Compatibilidad con código que aún usa SinceFirmaResult. */
    public function firmarPorUrlShortLegacy(string $urlShort, ?bool $produccion = null): SinceFirmaResult
    {
        return $this->firmarPorUrlShort($urlShort, $produccion)->toSinceFirmaResult();
    }

    public function firmaHabilitada(): bool
    {
        return (bool) config('since.firma.enabled', false);
    }

    public function debeUsarSoloSimulacion(): bool
    {
        if (! $this->firmaHabilitada()) {
            return true;
        }

        return (bool) config('since.firma.simulated', false);
    }

    protected function firmarSimuladaPorUrlShort(string $urlShort): SinceFirmaResponse
    {
        $prod = $this->esProduccion();
        $material = 'urlshort|'.$urlShort.'|'.($prod ? '1' : '0');
        $sello = $this->openSsl->sellarCadenaSimulada($material);
        $folio = 'SIM-34-'.substr(hash('sha256', $material), 0, 12);

        $xml = '<?xml version="1.0" encoding="UTF-8"?>'
            .'<FirmaServicio34Simulado urlshort="'.htmlspecialchars($urlShort, ENT_XML1).'">'
            .'<folioDigital>'.htmlspecialchars($folio, ENT_XML1).'</folioDigital>'
            .'</FirmaServicio34Simulado>';

        return new SinceFirmaResponse(
            success: true,
            message: 'Firma simulada (SINCE_FIRMA_SIMULATED=true).',
            xmlFirmado: $xml,
            folioDigital: $folio,
            selloSep: $sello,
            httpStatus: 200,
            simulada: true,
            rawSanitized: ['modo' => 'servicio_34_simulado', 'url_short' => $urlShort],
        );
    }

    protected function resolverEndpoint(): string
    {
        $env = strtolower((string) config('since.firma.env', 'dev'));

        if ($env === 'prod' || $env === 'production' || $this->esProduccion()) {
            return (string) config('since.firma.prod_url', '');
        }

        return (string) config('since.firma.dev_url', '');
    }

    protected function esProduccion(): bool
    {
        $flag = (string) config('since.firma.prod_flag', '1');

        return filter_var(env('SINCE_FIRMA_PROD', $flag === '1'), FILTER_VALIDATE_BOOL);
    }

    protected function esRespuestaGlassfishHtml(string $body): bool
    {
        $lower = strtolower($body);

        return str_contains($lower, '<html') && str_contains($lower, 'glassfish');
    }

    /**
     * @param  array<string, mixed>|null  $json
     * @return array{success: bool, xml_firmado?: string, folio_digital?: string, sello_sep?: string, error?: string, error_code?: string, raw: array<string, mixed>}
     */
    protected function parseResponseBody(string $body, ?array $json): array
    {
        $raw = $this->sanitizarRaw([
            'http_body_length' => strlen($body),
            'json_keys' => $json !== null ? array_keys($json) : [],
        ]);

        if ($json !== null) {
            $xml = $this->extractField($json, ['xmlFirmado', 'xml_firmado', 'xmlfirmado', 'data.xmlFirmado']);
            $folio = $this->extractField($json, ['folioDigital', 'folio_digital', 'foliodigital', 'data.folioDigital']);
            $sello = $this->extractField($json, ['sello', 'selloSep', 'sellosep', 'data.sello']);

            if ($xml !== null || $folio !== null) {
                return [
                    'success' => true,
                    'xml_firmado' => $xml,
                    'folio_digital' => $folio,
                    'sello_sep' => $sello,
                    'raw' => $raw,
                ];
            }

            $error = $this->extractField($json, ['error', 'message', 'mensaje', 'data.error']);
            if ($error !== null) {
                $code = str_contains(strtolower($error), 'autenticar la cadena')
                    ? 'error_autenticar_cadena'
                    : 'sep_error';

                return ['success' => false, 'error' => $error, 'error_code' => $code, 'raw' => $raw];
            }
        }

        if (trim($body) === '') {
            return ['success' => false, 'error' => 'Respuesta vacía del servicio 34.', 'error_code' => 'respuesta_vacia', 'raw' => $raw];
        }

        if (str_contains(strtolower($body), 'error al autenticar la cadena')) {
            return [
                'success' => false,
                'error' => 'Error al autenticar la cadena.',
                'error_code' => 'error_autenticar_cadena',
                'raw' => $raw,
            ];
        }

        return ['success' => false, 'error' => 'JSON inválido o estructura no reconocida.', 'error_code' => 'json_invalido', 'raw' => $raw];
    }

    /**
     * @param  array<string, mixed>  $data
     */
    protected function sanitizarRaw(array $data): array
    {
        $out = [];
        foreach ($data as $k => $v) {
            if (is_string($v) && strlen($v) > 500) {
                $out[$k] = Str::limit($v, 500);
            } else {
                $out[$k] = $v;
            }
        }

        return $out;
    }

    /**
     * @param  array<string, mixed>  $data
     * @param  list<string>  $paths
     */
    protected function extractField(array $data, array $paths): ?string
    {
        foreach ($paths as $path) {
            $value = data_get($data, str_replace('data.', '', $path));
            if (is_string($value) && $value !== '') {
                return $value;
            }
        }

        return null;
    }

    /**
     * @param  array<string, mixed>  $raw
     */
    protected function respuestaError(
        string $errorCode,
        string $message,
        ?int $httpStatus = null,
        array $raw = [],
    ): SinceFirmaResponse {
        return new SinceFirmaResponse(
            success: false,
            message: $message,
            errorCode: $errorCode,
            httpStatus: $httpStatus,
            rawSanitized: $raw !== [] ? $raw : ['error_code' => $errorCode],
        );
    }

    /**
     * @param  array<string, mixed>  $entrada
     * @return array<string, mixed>
     */
    protected function construirRespuestaSimulada(array $entrada): array
    {
        $xml = (string) ($entrada['xml_contenido'] ?? '');
        $correlation = (string) ($entrada['correlation_id'] ?? Str::uuid()->toString());
        $digestXml = $this->openSsl->calcularDigest($xml);
        $cadenaHash = isset($entrada['cadena_hash']) ? (string) $entrada['cadena_hash'] : '';
        $materialFirma = $digestXml.'|'.$cadenaHash.'|'.$correlation;
        $valorFirmaSimulado = $this->openSsl->sellarCadenaSimulada($materialFirma);
        $folioSimulado = 'SIM-SEP-'.substr(hash('sha256', $materialFirma), 0, 16);

        return [
            'modo' => 'since_firma_simulada',
            'requiere_revision_senior_sep' => true,
            'no_es_firma_valida_sep' => true,
            'correlation_id' => $correlation,
            'folio_digital_sep_simulado' => $folioSimulado,
            'valor_firma_simulado_base64' => Str::limit($valorFirmaSimulado, 64),
        ];
    }
}
