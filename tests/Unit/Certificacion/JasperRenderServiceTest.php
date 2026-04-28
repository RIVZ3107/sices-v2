<?php

declare(strict_types=1);

namespace Tests\Unit\Certificacion;

use App\Models\PlantillaDocumento;
use App\Services\Certificacion\JasperRenderService;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Tests\TestCase;

class JasperRenderServiceTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Config::set('certificacion.pdf.simulada', true);
        Config::set('certificacion.jasper.enabled', false);
        $this->seed(DatabaseSeeder::class);
    }

    public function test_render_simulado_es_determinista_y_sin_jasper_real(): void
    {
        $plantilla = PlantillaDocumento::query()->where('codigo', 'PDF_CERTIFICADO_NORMAL_JASPER_V1')->firstOrFail();
        $svc = app(JasperRenderService::class);

        $payload = ['demo' => true];

        $a = $svc->renderSimulado($payload, $plantilla);
        $b = $svc->renderSimulado($payload, $plantilla);

        $this->assertSame($a, $b);
        $this->assertStringStartsWith('%PDF', $a);
        $this->assertTrue($svc->debeRenderizarEnModoSimulado());
    }
}
