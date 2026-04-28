<?php

declare(strict_types=1);

namespace App\Services\Certificacion;

use App\Exceptions\Certificacion\FirmaSepRealNoDisponibleException;

/**
 * Cliente hacia since-service / SEP (producción). En este bloque solo opera en modo simulado:
 * no abre sockets, no envía HTTP y no usa material criptográfico real.
 */
class SinceFirmaClient
{
    public function __construct(
        protected OpenSslSelloService $openSsl,
    ) {}

    /**
     * Solicita firma electrónica. Si la configuración indica solo simulación (típico en desarrollo),
     * devuelve una respuesta determinista sin llamar al endpoint real.
     *
     * Entrada esperada:
     * - correlation_id (string)
     * - idempotency_key (string)
     * - xml_contenido (string)
     * - cadena_hash (string|null)
     *
     * @param  array<string, mixed>  $entrada
     * @return array<string, mixed>
     */
    public function solicitarFirma(array $entrada): array
    {
        $this->validarEntrada($entrada);

        if ($this->debeUsarSoloSimulacion()) {
            return $this->construirRespuestaSimulada($entrada);
        }

        throw new FirmaSepRealNoDisponibleException(
            'La integración con since-service/SEP real no está implementada; use SEP_FIRMA_SIMULADA=true o deshabilite SEP_FIRMA_ENABLED hasta contar con el contrato oficial.'
        );
    }

    public function debeUsarSoloSimulacion(): bool
    {
        $cfg = config('certificacion.sep_firma', []);

        $simulada = (bool) ($cfg['simulada'] ?? true);
        $enabled = (bool) ($cfg['enabled'] ?? false);

        return $simulada || ! $enabled;
    }

    /**
     * @param  array<string, mixed>  $entrada
     * @return array<string, mixed>
     */
    protected function construirRespuestaSimulada(array $entrada): array
    {
        $xml = (string) $entrada['xml_contenido'];
        $correlation = (string) $entrada['correlation_id'];
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
            'idempotency_key' => (string) $entrada['idempotency_key'],
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

    /**
     * @param  array<string, mixed>  $entrada
     */
    protected function validarEntrada(array $entrada): void
    {
        foreach (['correlation_id', 'idempotency_key', 'xml_contenido'] as $clave) {
            if (! isset($entrada[$clave]) || $entrada[$clave] === '' || $entrada[$clave] === null) {
                throw new \InvalidArgumentException("Entrada SinceFirma incompleta: falta {$clave}.");
            }
        }
    }
}
