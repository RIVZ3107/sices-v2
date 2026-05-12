<?php

declare(strict_types=1);

namespace Tests\Feature\ControlEscolar;

use Tests\TestCase;

final class ControlEscolarDatasetVisualTest extends TestCase
{
    private function demoDataSource(): string
    {
        $path = base_path('resources/js/data/controlEscolarDemoData.js');

        return (string) file_get_contents($path);
    }

    public function test_no_programas_ni_instituciones_genericas(): void
    {
        $src = strtolower($this->demoDataSource());
        foreach (['ingeniería', 'contaduría', 'bachillerato general', 'bachillerato tecnológico', 'campus central'] as $bad) {
            $this->assertStringNotContainsString($bad, $src, "Contenido indebido: {$bad}");
        }
    }

    public function test_no_finanzas_ni_colegiaturas(): void
    {
        $src = strtolower($this->demoDataSource());
        foreach (['colegiatura', 'adeudo', 'mensualidad', 'pago de'] as $bad) {
            $this->assertStringNotContainsString($bad, $src);
        }
    }

    public function test_incluye_programas_normal_upn(): void
    {
        $src = $this->demoDataSource();
        $this->assertStringContainsString('Lic. en Educación Primaria', $src);
        $this->assertStringContainsString('ESCUELA NORMAL SUPERIOR DEL VALLE DE TOLUCA', $src);
        $this->assertStringContainsString('UNIVERSIDAD PEDAGÓGICA NACIONAL', $src);
    }

    public function test_trayectoria_demo_usa_materias_pedagogicas(): void
    {
        $src = $this->demoDataSource();
        $this->assertStringContainsString('Didáctica general', $src);
        $this->assertStringNotContainsString('Fundamentos de Programación', $src);
    }
}
