<?php

declare(strict_types=1);

namespace Tests\Unit\Certificacion;

use App\Enums\Certificacion\EstadoCadena;
use App\Enums\Certificacion\EstadoFirma;
use App\Enums\Certificacion\EstadoPdf;
use App\Exceptions\Certificacion\PdfGeneracionDeshabilitadaException;
use App\Models\Alumno;
use App\Models\AuditoriaEvento;
use App\Models\CicloEscolar;
use App\Models\DocumentoAcademico;
use App\Models\DocumentoPayload;
use App\Models\FirmanteAutorizado;
use App\Models\IntegracionLog;
use App\Services\Certificacion\CadenaOriginalBuilder;
use App\Services\Certificacion\DocumentoAcademicoPayloadBuilder;
use App\Services\Certificacion\DocumentStorageService;
use App\Services\Certificacion\EnsurePdfDocumentoService;
use App\Services\Certificacion\FirmarDocumentoAcademicoService;
use App\Services\Certificacion\XmlDocumentoAcademicoBuilder;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Str;
use Tests\TestCase;

class EnsurePdfDocumentoServiceTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Config::set('certificacion.sep_firma.enabled', false);
        Config::set('certificacion.sep_firma.simulada', true);
        Config::set('certificacion.pdf.generation_enabled', true);
        Config::set('certificacion.pdf.simulada', true);
        Config::set('certificacion.jasper.enabled', false);
        $this->seed(DatabaseSeeder::class);
    }

    public function test_genera_pdf_base_tras_firma_y_registra_logs_y_auditoria(): void
    {
        [$documento, $payload] = $this->crearDocumentoConPayloadCertificado();

        $cadena = app(CadenaOriginalBuilder::class)->generar($documento, $payload);
        app(XmlDocumentoAcademicoBuilder::class)->generar($documento->fresh(), $payload, $cadena);

        $firmante = FirmanteAutorizado::query()->create([
            'nombre' => 'Director',
            'primer_apellido' => 'Simulado',
            'cargo' => 'Director General',
            'estatus' => 'activo',
        ]);

        app(FirmarDocumentoAcademicoService::class)->firmarSimulado(
            $documento->fresh(),
            null,
            $firmante->id,
        );

        $versionPdf = app(EnsurePdfDocumentoService::class)->generarPdfBaseControlado($documento->fresh());

        $documento->refresh();

        $this->assertSame(EstadoPdf::GENERADO->value, $documento->estado_pdf);
        $this->assertSame('PDF_OFICIAL', $versionPdf->tipo);
        $this->assertStringStartsWith('%PDF', (string) $versionPdf->contenido);

        $this->assertSame(1, IntegracionLog::query()
            ->where('documento_academico_id', $documento->id)
            ->where('tipo', 'PDF_GENERATION')
            ->where('estado', 'SUCCESS')
            ->count());
        $this->assertSame(1, IntegracionLog::query()
            ->where('documento_academico_id', $documento->id)
            ->where('tipo', 'JASPER_RENDER')
            ->count());

        $this->assertTrue(AuditoriaEvento::query()
            ->where('evento', 'PDF_BASE_GENERADO')
            ->where('entidad_id', $documento->id)
            ->exists());
    }

    public function test_pdf_deshabilitado_en_config_lanza_excepcion(): void
    {
        Config::set('certificacion.pdf.generation_enabled', false);

        $this->expectException(PdfGeneracionDeshabilitadaException::class);

        app(EnsurePdfDocumentoService::class)->generarPdfBaseControlado(new DocumentoAcademico);
    }

    /**
     * @return array{0: DocumentoAcademico, 1: DocumentoPayload}
     */
    private function crearDocumentoConPayloadCertificado(): array
    {
        $ciclo = CicloEscolar::query()->create([
            'clave' => '2024-2025',
            'nombre' => 'Ciclo test',
            'fecha_inicio' => '2024-08-01',
            'fecha_fin' => '2025-07-31',
            'es_actual' => true,
            'activo' => true,
        ]);

        $alumno = Alumno::query()->create([
            'curp' => strtoupper(Str::random(10)).Str::random(8),
            'nombre' => 'Juan',
            'primer_apellido' => 'Pérez',
            'segundo_apellido' => 'López',
        ]);

        $documento = DocumentoAcademico::query()->create([
            'alumno_id' => $alumno->id,
            'matricula_id' => null,
            'oferta_academica_id' => null,
            'ciclo_escolar_id' => $ciclo->id,
            'subsistema_id' => null,
            'region_id' => null,
            'institucion_id' => null,
            'sede_id' => null,
            'tipo_documento' => 'certificado',
            'tipo_certificacion' => null,
            'folio_interno' => 'F-INT-001',
            'folio_digital_sep' => null,
            'token_consulta_publica' => 'tok-pub-'.Str::uuid()->toString(),
            'estado_workflow' => 'borrador',
            'estado_cadena' => EstadoCadena::NO_GENERADA->value,
            'estado_xml' => 'no_generado',
            'estado_firma' => EstadoFirma::NO_FIRMADO->value,
            'estado_pdf' => 'no_generado',
        ]);

        $payloadArr = array_merge(
            app(DocumentoAcademicoPayloadBuilder::class)->construir($documento, 'CERTIFICADO_XML'),
            [
                'programa' => ['nombre' => 'Licenciatura demo'],
                'plan' => ['clave' => 'PLAN-DEMO'],
                'trayectoria' => ['promedio' => '9.0'],
                'materias' => [
                    ['nombre' => 'Historia', 'calificacion' => '9'],
                ],
            ],
        );

        $payloadArr['documento_academico']['folio_interno'] = $documento->folio_interno;
        $payloadArr['documento_academico']['token_consulta_publica'] = $documento->token_consulta_publica;

        $payload = app(DocumentStorageService::class)->guardarPayloadVersionado(
            $documento,
            'CERTIFICADO_XML',
            $payloadArr,
        );

        return [$documento->fresh(), $payload];
    }
}
