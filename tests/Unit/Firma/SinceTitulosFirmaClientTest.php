<?php

declare(strict_types=1);

namespace Tests\Unit\Firma;

use App\Infrastructure\Since\SinceTitulosFirmaClient;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class SinceTitulosFirmaClientTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Config::set('since.titulos.titulo_prod_url', 'https://since-titulos.test/titulo/firma');
        Config::set('since.titulos.grado_prod_url', 'https://since-titulos.test/grado/firma');
        Config::set('since.titulos.env', 'prod');
    }

    public function test_titulo_simulado_no_http(): void
    {
        Config::set('since.titulos.enabled', true);
        Config::set('since.titulos.simulated', true);

        Http::fake();

        $client = app(SinceTitulosFirmaClient::class);
        $result = $client->firmarTituloPorUrlShort('TIT-URL-01');

        $this->assertTrue($result->success);
        $this->assertTrue($result->simulada);
        Http::assertNothingSent();
    }

    public function test_grado_real_parsea_respuesta(): void
    {
        Config::set('since.titulos.enabled', true);
        Config::set('since.titulos.simulated', false);

        Http::fake([
            'https://since-titulos.test/grado/firma' => Http::response([
                'xml_firmado' => '<xml grado/>',
                'folio_digital' => 'GRD-99',
                'sello' => 'SELLO-G',
            ], 200),
        ]);

        $client = app(SinceTitulosFirmaClient::class);
        $result = $client->firmarGradoPorUrlShort('GRD-URL');

        $this->assertTrue($result->success);
        $this->assertSame('GRD-99', $result->folioDigital);
        $this->assertSame('<xml grado/>', $result->xmlFirmado);
    }
}
