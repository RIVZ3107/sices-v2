<?php

declare(strict_types=1);

namespace App\Infrastructure\Since;

use App\Data\Firma\SinceFirmaResult;
use App\Exceptions\Certificacion\FirmaSepRealNoDisponibleException;
use App\Services\Certificacion\OpenSslSelloService;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

/**
 * Cliente HTTP al servicio 34 SINCE/SEP.
 * Contrato legacy: multipart/form-data con urlshort y prod únicamente.
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

    public function firmarPorUrlShort(string $urlShort, ?bool $produccion = null): SinceFirmaResult
    {
        $urlShort = trim($urlShort);
        if ($urlShort === '') {
            return new SinceFirmaResult(false, errorMessage: 'urlshort vacío.');
        }

        if ($this->debeUsarSoloSimulacion()) {
            return $this->firmarSimuladaPorUrlShort($urlShort);
        }

        $endpoint = (string) config('certificacion.sep_firma.endpoint', '');
        if ($endpoint === '') {
            return new SinceFirmaResult(false, errorMessage: 'SINCE_FIRMA_URL / SEP_FIRMA_ENDPOINT no configurado.');
        }

        $prod = $produccion ?? (bool) config('certificacion.sep_firma.produccion', false);
        $timeout = (int) config('certificacion.sep_firma.timeout', 30);

        try {
            $response = Http::timeout($timeout)
                ->asMultipart()
                ->post($endpoint, [
                    ['name' => 'urlshort', 'contents' => $urlShort],
                    ['name' => 'prod', 'contents' => $prod ? '1' : '0'],
                ]);
        } catch (ConnectionException $e) {
            return new SinceFirmaResult(false, errorMessage: 'Conexión fallida con servicio 34: '.$e->getMessage());
        }

        $status = $response->status();
        $body = $response->body();

        if ($status === 415) {
            return new SinceFirmaResult(false, httpStatus: $status, errorMessage: 'HTTP 415: el servicio 34 no aceptó multipart/form-data.');
        }

        if (str_contains(strtolower($body), '<html') && str_contains(strtolower($body), 'glassfish')) {
            return new SinceFirmaResult(false, httpStatus: $status, errorMessage: 'Respuesta HTML de GlassFish; verifique URL del servicio 34.');
        }

        $parsed = $this->parseResponseBody($body, $response->json());

        if (! $parsed['success']) {
            return new SinceFirmaResult(
                success: false,
                httpStatus: $status,
                errorMessage: $parsed['error'] ?? 'Error desconocido del servicio 34.',
                rawResponse: $parsed['raw'],
            );
        }

        return new SinceFirmaResult(
            success: true,
            xmlFirmado: $parsed['xml_firmado'],
            folioDigital: $parsed['folio_digital'],
            selloSep: $parsed['sello_sep'],
            httpStatus: $status,
            rawResponse: $parsed['raw'],
        );
    }

    public function debeUsarSoloSimulacion(): bool
    {
        $cfg = config('certificacion.sep_firma', []);
        $simulada = (bool) ($cfg['simulada'] ?? true);
        $enabled = (bool) ($cfg['enabled'] ?? false);

        return $simulada || ! $enabled;
    }

    protected function firmarSimuladaPorUrlShort(string $urlShort): SinceFirmaResult
    {
        $material = 'urlshort|'.$urlShort.'|'.(config('certificacion.sep_firma.produccion') ? '1' : '0');
        $digest = $this->openSsl->calcularDigest($material);
        $sello = $this->openSsl->sellarCadenaSimulada($material);
        $folio = 'SIM-34-'.substr(hash('sha256', $material), 0, 12);

        $xml = '<?xml version="1.0" encoding="UTF-8"?>'
            .'<FirmaServicio34Simulado urlshort="'.htmlspecialchars($urlShort, ENT_XML1).'">'
            .'<folioDigital>'.htmlspecialchars($folio, ENT_XML1).'</folioDigital>'
            .'<sello>'.htmlspecialchars($sello, ENT_XML1).'</sello>'
            .'</FirmaServicio34Simulado>';

        return new SinceFirmaResult(
            success: true,
            xmlFirmado: $xml,
            folioDigital: $folio,
            selloSep: $sello,
            httpStatus: 200,
            simulada: true,
            rawResponse: ['modo' => 'servicio_34_simulado', 'digest' => $digest],
        );
    }

    /**
     * @param  array<string, mixed>|null  $json
     * @return array{success: bool, xml_firmado?: string, folio_digital?: string, sello_sep?: string, error?: string, raw: array<string, mixed>}
     */
    protected function parseResponseBody(string $body, ?array $json): array
    {
        $raw = ['body' => $body, 'json' => $json ?? []];

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
                return ['success' => false, 'error' => $error, 'raw' => $raw];
            }
        }

        if (trim($body) === '') {
            return ['success' => false, 'error' => 'Respuesta vacía del servicio 34.', 'raw' => $raw];
        }

        if (! str_starts_with(trim($body), '{') && ! str_starts_with(trim($body), '[')) {
            if (str_contains(strtolower($body), 'error') || str_contains(strtolower($body), 'cadena')) {
                return ['success' => false, 'error' => Str::limit(strip_tags($body), 500), 'raw' => $raw];
            }
        }

        return ['success' => false, 'error' => 'JSON inválido o estructura no reconocida del servicio 34.', 'raw' => $raw];
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
            'idempotency_key' => (string) ($entrada['idempotency_key'] ?? ''),
            'digest_xml_sha256' => $digestXml,
            'valor_firma_simulado_base64' => $valorFirmaSimulado,
            'folio_digital_sep_simulado' => $folioSimulado,
            'metadata_openssl_simulado' => $this->openSsl->metadataSelloSimulado(),
            'respuesta_since_estructura' => [
                'status' => 'simulated_accepted',
                'latency_ms' => 0,
                'endpoint_usado' => null,
                'mensaje' => 'Respuesta generada localmente; sin llamada HTTP.',
            ],
        ];
    }
}
