<?php

declare(strict_types=1);

namespace Tests\Unit\Certificacion;

use App\Exceptions\Certificacion\FirmaSepRealNoDisponibleException;
use App\Services\Certificacion\SinceFirmaClient;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * Alias de compatibilidad App\Services\Certificacion\SinceFirmaClient → Infrastructure.
 */
class SinceFirmaClientTest extends TestCase
{
    public function test_solicitar_firma_simulada_es_reproducible_y_sin_http(): void
    {
        Config::set('since.firma.enabled', true);
        Config::set('since.firma.simulated', true);

        Http::fake();

        $client = app(SinceFirmaClient::class);

        $entrada = [
            'correlation_id' => 'corr-test-1',
            'idempotency_key' => 'idem-test-1',
            'xml_contenido' => '<xml/>',
            'cadena_hash' => 'abc123',
        ];

        $a = $client->solicitarFirma($entrada);
        $b = $client->solicitarFirma($entrada);

        $this->assertSame($a['valor_firma_simulado_base64'], $b['valor_firma_simulado_base64']);
        $this->assertSame('since_firma_simulada', $a['modo']);
        $this->assertTrue($a['no_es_firma_valida_sep']);
        $this->assertArrayHasKey('folio_digital_sep_simulado', $a);
        $this->assertTrue($client->debeUsarSoloSimulacion());
        Http::assertNothingSent();
    }

    public function test_ruta_since_real_dispara_excepcion_controlada(): void
    {
        Config::set('since.firma.enabled', true);
        Config::set('since.firma.simulated', false);

        $client = app(SinceFirmaClient::class);

        $this->expectException(FirmaSepRealNoDisponibleException::class);

        $client->solicitarFirma([
            'correlation_id' => 'corr-real',
            'idempotency_key' => 'idem-real',
            'xml_contenido' => '<x/>',
        ]);
    }
}
