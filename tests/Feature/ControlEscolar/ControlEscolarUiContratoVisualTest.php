<?php

declare(strict_types=1);

namespace Tests\Feature\ControlEscolar;

use Tests\TestCase;

/**
 * Contrato visual en código: rutas React y textos clave del módulo Control Escolar.
 */
final class ControlEscolarUiContratoVisualTest extends TestCase
{
    public function test_dashboard_incluye_bloques_y_metricas(): void
    {
        $path = base_path('resources/js/pages/dashboard/ControlEscolarDashboardPage.jsx');
        $this->assertFileExists($path);
        $src = (string) file_get_contents($path);
        $this->assertStringContainsString('Mis pendientes', $src);
        $this->assertStringContainsString('Alumnos por estatus', $src);
        $this->assertStringContainsString('Procesos recientes', $src);
        $this->assertStringContainsString('Expedientes pendientes', $src);
        $this->assertStringContainsString('Inscripciones por validar', $src);
    }

    public function test_alumnos_incluye_acciones_rapidas_y_tabla(): void
    {
        $path = base_path('resources/js/pages/controlEscolar/AlumnosCePage.jsx');
        $this->assertFileExists($path);
        $src = (string) file_get_contents($path);
        $this->assertStringContainsString('Acciones rápidas', $src);
        $this->assertStringContainsString('Gestión de alumnos', $src);
        $this->assertStringContainsString('controlEscolarApi', $src);
        $this->assertStringContainsString('Matrícula', $src);
    }

    public function test_expedientes_incluye_panel_documentos_y_actividad(): void
    {
        $path = base_path('resources/js/pages/controlEscolar/ExpedientesCePage.jsx');
        $src = (string) file_get_contents($path);
        $this->assertStringContainsString('Documentos requeridos', $src);
        $this->assertStringContainsString('Actividad reciente', $src);
        $this->assertStringContainsString('Validar expediente operativo', $src);
    }

    public function test_inscripciones_indica_regla_matricula(): void
    {
        $path = base_path('resources/js/pages/controlEscolar/InscripcionesCePage.jsx');
        $src = (string) file_get_contents($path);
        $this->assertStringContainsString('matrícula', strtolower($src));
        $this->assertStringContainsString('controlEscolarApi', $src);
    }

    public function test_reinscripciones_sin_colegiatura_en_datos_demo(): void
    {
        $path = base_path('resources/js/data/controlEscolarDemoData.js');
        $src = (string) file_get_contents($path);
        $this->assertStringContainsString('CE_DEMO_REINSCRIPCIONES', $src);
        $this->assertStringNotContainsString('colegiatura', strtolower($src));
    }

    public function test_calificaciones_conecta_api(): void
    {
        $path = base_path('resources/js/pages/controlEscolar/CalificacionesCePage.jsx');
        $this->assertFileExists($path);
        $src = (string) file_get_contents($path);
        $this->assertStringContainsString('controlEscolarApi', $src);
        $this->assertStringContainsString('calificaciones', $src);
        $this->assertStringNotContainsString('CE_DEMO_CALIFICACIONES_TABLA', $src);
    }

    public function test_trayectoria_conecta_api(): void
    {
        $path = base_path('resources/js/pages/controlEscolar/TrayectoriaCePage.jsx');
        $this->assertFileExists($path);
        $src = (string) file_get_contents($path);
        $this->assertStringContainsString('controlEscolarApi', $src);
        $this->assertStringContainsString('trayectoria', $src);
        $this->assertStringNotContainsString('CE_DEMO_ALUMNO_TRAYECTORIA', $src);
    }

    public function test_reinscripciones_conecta_api(): void
    {
        $path = base_path('resources/js/pages/controlEscolar/ReinscripcionesCePage.jsx');
        $this->assertFileExists($path);
        $src = (string) file_get_contents($path);
        $this->assertStringContainsString('controlEscolarApi', $src);
        $this->assertStringContainsString('reinscripciones', $src);
        $this->assertStringNotContainsString('CE_DEMO_REINSCRIPCIONES', $src);
    }

    public function test_bajas_cambios_conecta_api(): void
    {
        $path = base_path('resources/js/pages/controlEscolar/BajasCambiosPage.jsx');
        $this->assertFileExists($path);
        $src = (string) file_get_contents($path);
        $this->assertStringContainsString('controlEscolarApi', $src);
        $this->assertStringContainsString('bajasCambios', $src);
        $this->assertStringNotContainsString('DEMO_BAJAS', $src);
        $this->assertStringNotContainsString('CE_DEMO_BAJAS', $src);
    }

    public function test_documentos_conecta_api(): void
    {
        $path = base_path('resources/js/pages/controlEscolar/DocumentosCePage.jsx');
        $this->assertFileExists($path);
        $src = (string) file_get_contents($path);
        $this->assertStringContainsString('controlEscolarApi', $src);
        $this->assertStringContainsString('documentos', $src);
        $this->assertStringNotContainsString('CE_DEMO_DOCUMENTOS_EMITIDOS', $src);
    }

    public function test_documentos_sin_firma_ni_sellos_en_copy(): void
    {
        $path = base_path('resources/js/pages/controlEscolar/DocumentosCePage.jsx');
        $src = (string) file_get_contents($path);
        $low = strtolower($src);
        $this->assertStringNotContainsString('firma', $low);
        $this->assertStringNotContainsString('sello', $low);
    }

    public function test_solicitudes_conecta_api(): void
    {
        $path = base_path('resources/js/pages/controlEscolar/SolicitudesCePage.jsx');
        $this->assertFileExists($path);
        $src = (string) file_get_contents($path);
        $this->assertStringContainsString('controlEscolarApi', $src);
        $this->assertStringContainsString('solicitudes', $src);
        $this->assertStringNotContainsString('CE_DEMO_SOLICITUDES', $src);
        $this->assertStringNotContainsString('DEMO_SOLICITUDES', $src);
    }

    public function test_observaciones_conecta_api(): void
    {
        $path = base_path('resources/js/pages/controlEscolar/ObservacionesCePage.jsx');
        $this->assertFileExists($path);
        $src = (string) file_get_contents($path);
        $this->assertStringContainsString('controlEscolarApi', $src);
        $this->assertStringContainsString('observaciones', $src);
        $this->assertStringNotContainsString('CE_DEMO_OBSERVACIONES', $src);
    }

    public function test_solicitudes_sin_aprobar_rechazar_asignar_en_acciones(): void
    {
        $path = base_path('resources/js/pages/controlEscolar/SolicitudesCePage.jsx');
        $src = (string) file_get_contents($path);
        $this->assertStringContainsString('Enviar', $src);
        $this->assertStringNotContainsString('Aprobar', $src);
        $this->assertStringNotContainsString('Rechazar', $src);
        $this->assertStringNotContainsString('Asignar', $src);
    }

    public function test_importaciones_conecta_api(): void
    {
        $path = base_path('resources/js/pages/controlEscolar/ImportacionesCePage.jsx');
        $this->assertFileExists($path);
        $src = (string) file_get_contents($path);
        $this->assertStringContainsString('controlEscolarApi', $src);
        $this->assertStringContainsString('importaciones', $src);
        $this->assertStringNotContainsString('CE_DEMO_IMPORTACIONES', $src);
        $this->assertStringNotContainsString('DEMO_IMPORTACIONES', $src);
    }

    public function test_reportes_conecta_api(): void
    {
        $path = base_path('resources/js/pages/controlEscolar/ReportesCePage.jsx');
        $this->assertFileExists($path);
        $src = (string) file_get_contents($path);
        $this->assertStringContainsString('controlEscolarApi', $src);
        $this->assertStringContainsString('reportes', $src);
        $this->assertStringNotContainsString('CE_DEMO_REPORTES_FRECUENTES', $src);
    }

    public function test_reportes_sin_pagos(): void
    {
        $path = base_path('resources/js/pages/controlEscolar/ReportesCePage.jsx');
        $src = strtolower((string) file_get_contents($path));
        $this->assertStringNotContainsString('pago', $src);
        $this->assertStringNotContainsString('colegiatura', $src);
    }

    public function test_notificaciones_conecta_api(): void
    {
        $path = base_path('resources/js/pages/controlEscolar/NotificacionesCePage.jsx');
        $this->assertFileExists($path);
        $src = (string) file_get_contents($path);
        $this->assertStringContainsString('controlEscolarApi', $src);
        $this->assertStringContainsString('notificaciones', $src);
        $this->assertStringNotContainsString('CE_DEMO_NOTIFICACIONES', $src);
        $this->assertStringNotContainsString('DEMO_NOTIFICACIONES', $src);
    }

    public function test_notificaciones_sin_administrar_categorias(): void
    {
        $path = base_path('resources/js/pages/controlEscolar/NotificacionesCePage.jsx');
        $src = strtolower((string) file_get_contents($path));
        $this->assertStringContainsString('preferencias de notificación', $src);
        $this->assertStringNotContainsString('configurar alertas globales', $src);
    }
}
