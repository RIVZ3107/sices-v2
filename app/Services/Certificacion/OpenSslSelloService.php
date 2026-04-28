<?php

declare(strict_types=1);

namespace App\Services\Certificacion;

/**
 * Punto de extensión para sello criptográfico local (OpenSSL/PKCS#7 u homólogo SEP).
 *
 * Estado actual: solo digest y “sello” determinista simulado; no cargar PEM/PFX ni claves.
 * La implementación definitiva debe: cargar certificado real, firmar cadena/XML según norma SEP,
 * y adjuntar metadatos de certificado (no simulados).
 */
class OpenSslSelloService
{
    /**
     * Sello simulado determinista para pruebas de integración sin material criptográfico real.
     *
     * Salida: base64( sha256_bin( prefijo_simulado + cadena ) ).
     *
     * @return string Metadatos de operación real deben incluir {@see metadataSelloSimulado}.
     */
    public function sellarCadenaSimulada(string $cadena): string
    {
        $bin = hash('sha256', 'SICES_OPENSSL_SIM_V1|'.$cadena, true);

        return base64_encode($bin !== false ? $bin : '');
    }

    /**
     * Digest binario representado en hex minúsculas (SHA-256), típico para referencias o sellos posteriores.
     */
    public function calcularDigest(string $contenido): string
    {
        return hash('sha256', $contenido);
    }

    /**
     * Metadatos que el flujo senior debe registrar junto al sello simulado hasta contar con llave real.
     *
     * @return array<string, mixed>
     */
    public function metadataSelloSimulado(): array
    {
        return [
            'modo' => 'sello_simulado',
            'requiere_llave_real' => true,
            'requiere_revision_senior' => true,
        ];
    }
}
