<?php

declare(strict_types=1);

namespace Tests\Feature\Direccion;

use Tests\TestCase;

/**
 * Contrato visual Dirección de Escuela: rutas React y textos clave.
 */
final class DireccionEscuelaUiContratoVisualTest extends TestCase
{
    public function test_dashboard_direccion_incluye_bloques_contrato(): void
    {
        $path = base_path('resources/js/pages/dashboard/DirectorEscuelaDashboardPage.jsx');
        $this->assertFileExists($path);
        $src = (string) file_get_contents($path);
        $this->assertStringContainsString('Dashboard Dirección', $src);
        $this->assertStringContainsString('Matrícula por programa', $src);
        $this->assertStringContainsString('Avance de procesos', $src);
        $this->assertStringContainsString('Pendientes críticos', $src);
        $this->assertStringContainsString('Decisiones recientes de la dirección', $src);
        $this->assertStringContainsString('Reportes frecuentes', $src);
    }

    public function test_indicadores_incluye_metricas_y_graficas(): void
    {
        $path = base_path('resources/js/pages/direccion/DireccionIndicadoresPage.jsx');
        $src = (string) file_get_contents($path);
        $this->assertStringContainsString('Indicadores institucionales', $src);
        $this->assertStringContainsString('Tendencia mensual', $src);
        $this->assertStringContainsString('Indicadores monitoreados', $src);
    }

    public function test_alumnos_seguimiento_sin_registrar_nuevo_como_accion_principal(): void
    {
        $path = base_path('resources/js/pages/direccion/DireccionAlumnosPage.jsx');
        $src = (string) file_get_contents($path);
        $this->assertStringContainsString('Seguimiento de alumnos', $src);
        $this->assertStringContainsString('Riesgo', $src);
        $this->assertStringNotContainsString('Registrar nuevo alumno', $src);
    }

    public function test_inscripciones_supervision_sin_confirmar_como_ce(): void
    {
        $path = base_path('resources/js/pages/direccion/DireccionInscripcionesPage.jsx');
        $src = (string) file_get_contents($path);
        $this->assertStringContainsString('Supervisión de inscripciones', $src);
        $this->assertStringContainsString('Confirmación institucional', $src);
        $this->assertStringNotContainsString('Confirmar inscripción', $src);
    }

    public function test_reinscripciones_sin_colegiatura_en_demo(): void
    {
        $path = base_path('resources/js/data/direccionEscuelaDemoData.js');
        $src = strtolower((string) file_get_contents($path));
        $this->assertStringNotContainsString('colegiatura', $src);
        $this->assertStringNotContainsString('adeudo', $src);
    }

    public function test_documentos_sin_firma_ni_sellos_en_copy(): void
    {
        $path = base_path('resources/js/pages/direccion/DireccionDocumentosPage.jsx');
        $src = strtolower((string) file_get_contents($path));
        $this->assertStringNotContainsString('firma', $src);
        $this->assertStringNotContainsString('sello', $src);
    }

    public function test_notificaciones_preferencias_no_global(): void
    {
        $path = base_path('resources/js/pages/direccion/DireccionNotificacionesPage.jsx');
        $src = strtolower((string) file_get_contents($path));
        $this->assertStringContainsString('preferencias de notificación', $src);
        $this->assertStringNotContainsString('configurar alertas globales', $src);
    }

    public function test_calificaciones_sin_capturar(): void
    {
        $path = base_path('resources/js/pages/direccion/DireccionCalificacionesSupervisionPage.jsx');
        $src = strtolower((string) file_get_contents($path));
        $this->assertStringContainsString('este rol no captura', $src);
    }

    public function test_reportes_sin_pagos(): void
    {
        $path = base_path('resources/js/pages/direccion/DireccionReportesPage.jsx');
        $src = strtolower((string) file_get_contents($path));
        $this->assertStringNotContainsString('colegiatura', $src);
        $this->assertStringNotContainsString('pago', $src);
    }
}
