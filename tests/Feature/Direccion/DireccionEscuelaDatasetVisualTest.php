<?php

declare(strict_types=1);

namespace Tests\Feature\Direccion;

use Tests\TestCase;

/**
 * Dataset centralizado Dirección: Normal/UPN, sin genéricos prohibidos.
 */
final class DireccionEscuelaDatasetVisualTest extends TestCase
{
    public function test_dataset_centralizado_sin_terminos_prohibidos(): void
    {
        $path = base_path('resources/js/data/direccionEscuelaDemoData.js');
        $this->assertFileExists($path);
        $src = strtolower((string) file_get_contents($path));
        $this->assertStringContainsString("from './controlEscolarDemoData'", $src);
        $this->assertStringNotContainsString('ingeniería', $src);
        $this->assertStringNotContainsString('contaduría', $src);
        $this->assertStringNotContainsString('colegiatura', $src);
        $this->assertStringNotContainsString('legacy_', $src);
    }

    public function test_dataset_programas_normal_upn(): void
    {
        $path = base_path('resources/js/data/direccionEscuelaDemoData.js');
        $src = (string) file_get_contents($path);
        $this->assertStringContainsString('Educación Primaria', $src);
        $this->assertStringContainsString('Inclusión Educativa', $src);
    }
}
