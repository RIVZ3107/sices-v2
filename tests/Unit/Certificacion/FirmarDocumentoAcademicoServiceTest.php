<?php

declare(strict_types=1);

namespace Tests\Unit\Certificacion;

use App\Enums\Certificacion\EstadoCadena;
use App\Enums\Certificacion\EstadoFirma;
use App\Enums\Certificacion\EstadoXml;
use App\Models\Alumno;
use App\Models\CicloEscolar;
use App\Models\DocumentoAcademico;
use App\Models\DocumentoFirma;
use App\Models\DocumentoPayload;
use App\Models\DocumentoVersion;
use App\Models\FirmanteAutorizado;
use App\Services\Certificacion\CadenaOriginalBuilder;
use App\Services\Certificacion\DocumentoAcademicoPayloadBuilder;
use App\Services\Certificacion\DocumentStorageService;
use App\Services\Certificacion\FirmarDocumentoAcademicoService;
use App\Services\Certificacion\XmlDocumentoAcademicoBuilder;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Str;
use Tests\TestCase;

class FirmarDocumentoAcademicoServiceTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Config::set('certificacion.sep_firma.enabled', false);
        Config::set('certificacion.sep_firma.simulada', true);
        $this->seed(DatabaseSeeder::class);
    }

    public function test_flujo_firma_simulada_actualiza_estados_y_persistencia(): void
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

        $firma = app(FirmarDocumentoAcademicoService::class)->firmarSimulado(
            $documento->fresh(),
            null,
            $firmante->id,
        );

        $documento->refresh();

        $this->assertSame(EstadoFirma::FIRMADO->value, $documento->estado_firma);
        $this->assertSame(EstadoXml::SELLADO->value, $documento->estado_xml);
        $this->assertSame('firmado', $firma->estado);
        $this->assertStringContainsString('DocumentoFirmaSEP_Simulado', (string) $firma->xml_firmado);
        $this->assertNotNull($firma->folio_digital_sep);
        $this->assertTrue($firma->response_payload['no_es_firma_valida_sep']);

        $this->assertSame(1, DocumentoFirma::query()->where('documento_academico_id', $documento->id)->count());
        $this->assertSame(
            1,
            DocumentoVersion::query()
                ->where('documento_academico_id', $documento->id)
                ->where('tipo', 'XML_FIRMADO_SEP')
                ->where('activo', true)
                ->count(),
        );
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
                    ['nombre' => 'Álgebra', 'calificacion' => '10'],
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
