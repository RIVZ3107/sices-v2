<?php

declare(strict_types=1);

namespace Tests\Unit\Firma;

use App\Infrastructure\Since\SinceFirmaClient;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class SinceFirmaClientTest extends TestCase
{
    public function test_firmar_por_url_short_simulado_no_usa_http(): void
    {
        Config::set('certificacion.sep_firma.enabled', true);
        Config::set('certificacion.sep_firma.simulada', true);

        Http::fake();

        $client = app(SinceFirmaClient::class);
        $result = $client->firmarPorUrlShort('TOKEN12AB', false);

        $this->assertTrue($result->success);
        $this->assertTrue($result->simulada);
        $this->assertNotEmpty($result->folioDigital);
        $this->assertNotEmpty($result->xmlFirmado);
        Http::assertNothingSent();
    }

    public function test_multipart_real_parsea_xml_firmado_y_folio(): void
    {
        Config::set('certificacion.sep_firma.enabled', true);
        Config::set('certificacion.sep_firma.simulada', false);
        Config::set('certificacion.sep_firma.endpoint', 'https://since.test/servicio34');

        Http::fake([
            'https://since.test/servicio34' => Http::response([
                'xmlFirmado' => '<xml firmado/>',
                'folioDigital' => 'FD-123',
                'sello' => 'SELLO-ABC',
            ], 200),
        ]);

        $client = app(SinceFirmaClient::class);
        $result = $client->firmarPorUrlShort('SHORT99', true);

        $this->assertTrue($result->success);
        $this->assertSame('FD-123', $result->folioDigital);
        $this->assertSame('<xml firmado/>', $result->xmlFirmado);
        $this->assertSame('SELLO-ABC', $result->selloSep);

        Http::assertSent(function ($request) {
            return $request->url() === 'https://since.test/servicio34';
        });
    }
}
