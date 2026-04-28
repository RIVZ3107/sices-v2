<?php

declare(strict_types=1);

namespace Tests\Unit\Certificacion;

use App\Services\Certificacion\OpenSslSelloService;
use PHPUnit\Framework\TestCase;

class OpenSslSelloServiceTest extends TestCase
{
    public function test_sello_simulado_es_reproducible_y_sin_llaves(): void
    {
        $svc = new OpenSslSelloService;

        $cadena = 'cadena-prueba-determinista';
        $this->assertSame($svc->sellarCadenaSimulada($cadena), $svc->sellarCadenaSimulada($cadena));

        $meta = $svc->metadataSelloSimulado();
        $this->assertSame('sello_simulado', $meta['modo']);
        $this->assertTrue($meta['requiere_llave_real']);
        $this->assertTrue($meta['requiere_revision_senior']);
    }

    public function test_calcular_digest_sha256(): void
    {
        $svc = new OpenSslSelloService;

        $this->assertSame(hash('sha256', 'contenido'), $svc->calcularDigest('contenido'));
    }
}
