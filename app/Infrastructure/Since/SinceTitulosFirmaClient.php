<?php

declare(strict_types=1);

namespace App\Infrastructure\Since;

use App\Data\Firma\SinceFirmaResponse;
use App\Services\Certificacion\OpenSslSelloService;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

/**
 * Cliente HTTP since-títulos (título y grado). Contrato: multipart urlshort + prod.
 */
class SinceTitulosFirmaClient
{
    public function __construct(
        protected OpenSslSelloService $openSsl,
    ) {}

    public function firmarTituloPorUrlShort(string $urlShort, ?bool $produccion = null): SinceFirmaResponse
    {
        return $this->firmarPorUrlShort('titulo', $urlShort, $produccion);
    }

    public function firmarGradoPorUrlShort(string $urlShort, ?bool $produccion = null): SinceFirmaResponse
    {
        return $this->firmarPorUrlShort('grado', $urlShort, $produccion);
    }

    public function firmaHabilitada(): bool
    {
        return (bool) config('since.titulos.enabled', false);
    }

    public function debeUsarSoloSimulacion(): bool
    {
        if (! $this->firmaHabilitada()) {
            return true;
        }

        return (bool) config('since.titulos.simulated', false);
    }

    protected function firmarPorUrlShort(string $tipo, string $urlShort, ?bool $produccion): SinceFirmaResponse
    {
        $urlShort = trim($urlShort);
        if ($urlShort === '') {
            return $this->respuestaError('urlshort_vacio', 'urlshort vacío.');
        }

        if (! $this->firmaHabilitada()) {
            return $this->respuestaError('since_titulos_disabled', 'SINCE_TITULOS_ENABLED=false.');
        }

        if ($this->debeUsarSoloSimulacion()) {
            return $this->firmarSimulada($tipo, $urlShort, $produccion);
        }

        $endpoint = $this->resolverEndpoint($tipo);
        if ($endpoint === '') {
            return $this->respuestaError('endpoint_no_configurado', "URL since-títulos ({$tipo}) no configurada.");
        }

        $prod = $produccion ?? $this->esProduccion();
        $timeout = (int) config('since.titulos.timeout', 120);
        $connectTimeout = (int) config('since.titulos.connect_timeout', 10);

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
                'Conexión fallida con since-títulos: '.$e->getMessage(),
            );
        }

        $status = $response->status();
        $body = $response->body();
        $json = $response->json();
        $parsed = $this->parseResponseBody($body, $json);

        if (! $parsed['success']) {
            return new SinceFirmaResponse(
                success: false,
                message: $parsed['error'] ?? 'Error desconocido de since-títulos.',
                errorCode: $parsed['error_code'] ?? 'sep_titulos_error',
                httpStatus: $status,
                rawSanitized: $parsed['raw'],
            );
        }

        return new SinceFirmaResponse(
            success: true,
            message: 'Documento timbrado correctamente por since-títulos.',
            xmlFirmado: $parsed['xml_firmado'],
            folioDigital: $parsed['folio_digital'],
            selloSep: $parsed['sello_sep'],
            httpStatus: $status,
            rawSanitized: $parsed['raw'],
        );
    }

    protected function firmarSimulada(string $tipo, string $urlShort, ?bool $produccion): SinceFirmaResponse
    {
        $prod = $produccion ?? $this->esProduccion();
        $material = $tipo.'|urlshort|'.$urlShort.'|'.($prod ? '1' : '0');
        $sello = $this->openSsl->sellarCadenaSimulada($material);
        $folio = 'SIM-TIT-'.substr(hash('sha256', $material), 0, 12);

        $xml = '<?xml version="1.0" encoding="UTF-8"?>'
            .'<FirmaSinceTitulosSimulado tipo="'.htmlspecialchars($tipo, ENT_XML1).'" urlshort="'.htmlspecialchars($urlShort, ENT_XML1).'">'
            .'<folioDigital>'.htmlspecialchars($folio, ENT_XML1).'</folioDigital>'
            .'</FirmaSinceTitulosSimulado>';

        return new SinceFirmaResponse(
            success: true,
            message: 'Timbrado simulado (SINCE_TITULOS_SIMULATED=true).',
            xmlFirmado: $xml,
            folioDigital: $folio,
            selloSep: $sello,
            httpStatus: 200,
            simulada: true,
            rawSanitized: ['modo' => 'since_titulos_simulado', 'tipo' => $tipo, 'url_short' => $urlShort],
        );
    }

    protected function resolverEndpoint(string $tipo): string
    {
        $env = strtolower((string) config('since.titulos.env', 'dev'));
        $prod = $env === 'prod' || $env === 'production' || $this->esProduccion();

        return match ($tipo) {
            'grado' => (string) ($prod ? config('since.titulos.grado_prod_url') : config('since.titulos.grado_dev_url')),
            default => (string) ($prod ? config('since.titulos.titulo_prod_url') : config('since.titulos.titulo_dev_url')),
        };
    }

    protected function esProduccion(): bool
    {
        $flag = (string) config('since.firma.prod_flag', '1');

        return filter_var(env('SINCE_FIRMA_PROD', $flag === '1'), FILTER_VALIDATE_BOOL);
    }

    /**
     * @param  array<string, mixed>|null  $json
     * @return array{success: bool, xml_firmado?: string, folio_digital?: string, sello_sep?: string, error?: string, error_code?: string, raw: array<string, mixed>}
     */
    protected function parseResponseBody(string $body, ?array $json): array
    {
        $raw = ['http_body_length' => strlen($body), 'json_keys' => $json !== null ? array_keys($json) : []];

        if ($json !== null) {
            $xml = data_get($json, 'xmlFirmado') ?? data_get($json, 'xml_firmado');
            $folio = data_get($json, 'folioDigital') ?? data_get($json, 'folio_digital');
            $sello = data_get($json, 'sello') ?? data_get($json, 'selloSep');

            if (is_string($xml) && $xml !== '' || is_string($folio) && $folio !== '') {
                return [
                    'success' => true,
                    'xml_firmado' => is_string($xml) ? $xml : null,
                    'folio_digital' => is_string($folio) ? $folio : null,
                    'sello_sep' => is_string($sello) ? $sello : null,
                    'raw' => $raw,
                ];
            }

            $error = data_get($json, 'error') ?? data_get($json, 'message');
            if (is_string($error) && $error !== '') {
                return ['success' => false, 'error' => $error, 'error_code' => 'sep_titulos_error', 'raw' => $raw];
            }
        }

        if (trim($body) === '') {
            return ['success' => false, 'error' => 'Respuesta vacía.', 'error_code' => 'respuesta_vacia', 'raw' => $raw];
        }

        return ['success' => false, 'error' => 'JSON inválido o estructura no reconocida.', 'error_code' => 'json_invalido', 'raw' => $raw];
    }

    /**
     * @param  array<string, mixed>  $raw
     */
    protected function respuestaError(string $errorCode, string $message, ?int $httpStatus = null, array $raw = []): SinceFirmaResponse
    {
        return new SinceFirmaResponse(
            success: false,
            message: $message,
            errorCode: $errorCode,
            httpStatus: $httpStatus,
            rawSanitized: $raw !== [] ? $raw : ['error_code' => $errorCode],
        );
    }
}
