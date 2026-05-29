<?php

declare(strict_types=1);

namespace Tests\Unit\DocumentosAcademicos;

use App\Services\DocumentosAcademicos\DocumentoAcademicoTipoService;
use Tests\TestCase;

class DocumentoAcademicoTipoServiceTest extends TestCase
{
    private DocumentoAcademicoTipoService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new DocumentoAcademicoTipoService;
    }

    public function test_catalogo_pasa_validacion_de_integridad(): void
    {
        $this->service->validarIntegridadCatalogo();
        $this->addToAssertionCount(1);
    }

    public function test_existen_todos_los_tipos_minimos(): void
    {
        $minimos = $this->service->tiposMinimos();
        $this->assertCount(8, $minimos);

        foreach ($minimos as $tipo) {
            $this->assertNotNull($this->service->obtener($tipo));
        }
    }

    public function test_certificado_terminal_solo_normal(): void
    {
        $this->assertTrue($this->service->permitidoParaSubsistema('certificado_terminal', 'NORMAL'));
        $this->assertFalse($this->service->permitidoParaSubsistema('certificado_terminal', 'UPN'));
        $this->assertNull($this->service->obtener('certificado_terminal', 'UPN'));
    }

    public function test_constancia_upn_sin_xml_sep_ni_informix(): void
    {
        $cap = $this->service->capacidades('constancia', 'UPN');

        $this->assertFalse($cap['requiere_xml_sep']);
        $this->assertFalse($cap['requiere_firma_sep']);
        $this->assertTrue($cap['requiere_firma_local']);
        $this->assertFalse($cap['permite_puente_informix']);
        $this->assertSame('upn_constancia_pdf', $cap['pipeline_key']);
    }

    public function test_certificado_terminal_normal_requiere_sep_y_consulta_publica(): void
    {
        $cap = $this->service->capacidades('certificado_terminal', 'NORMAL');

        $this->assertTrue($cap['requiere_xml_sep']);
        $this->assertTrue($cap['requiere_firma_sep']);
        $this->assertTrue($cap['requiere_url_short']);
        $this->assertTrue($cap['requiere_consulta_publica']);
        $this->assertTrue($cap['permite_puente_informix']);
        $this->assertSame('normal_certificado_terminal_sep', $cap['pipeline_key']);
    }

    public function test_cada_tipo_tiene_pipeline_key_por_subsistema(): void
    {
        $tipos = config('sices_documentos.tipos', []);

        foreach ($tipos as $key => $def) {
            foreach ($def['subsistemas_permitidos'] as $sub) {
                $reglas = $def['reglas'][$sub];
                $this->assertNotEmpty(
                    $reglas['pipeline_key'],
                    "pipeline_key vacío en {$key}/{$sub}",
                );
            }
        }
    }

    public function test_no_hay_reglas_upn_en_tipos_solo_normal(): void
    {
        $def = config('sices_documentos.tipos.certificado_terminal');
        $this->assertSame(['NORMAL'], $def['subsistemas_permitidos']);
        $this->assertArrayHasKey('NORMAL', $def['reglas']);
        $this->assertArrayNotHasKey('UPN', $def['reglas']);
    }

    public function test_listar_filtra_por_subsistema(): void
    {
        $soloNormal = $this->service->listar('NORMAL');
        $keys = array_column($soloNormal, 'key');

        $this->assertContains('certificado', $keys);
        $this->assertContains('certificado_terminal', $keys);
        $this->assertNotContains('certificado_terminal', array_column($this->service->listar('UPN'), 'key'));
    }

    public function test_normaliza_subsistema_desde_alias(): void
    {
        $this->assertTrue($this->service->permitidoParaSubsistema('constancia', 'normales'));
        $this->assertTrue($this->service->permitidoParaSubsistema('constancia', 'upn'));
    }
}
