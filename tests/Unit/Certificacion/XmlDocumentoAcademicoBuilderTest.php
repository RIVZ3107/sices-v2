<?php

declare(strict_types=1);

namespace Tests\Unit\Certificacion;

use App\Enums\Certificacion\EstadoCadena;
use App\Enums\Certificacion\EstadoXml;
use App\Models\Alumno;
use App\Models\CicloEscolar;
use App\Models\DocumentoAcademico;
use App\Models\DocumentoPayload;
use App\Models\DocumentoVersion;
use App\Services\Certificacion\CadenaOriginalBuilder;
use App\Services\Certificacion\DocumentoAcademicoPayloadBuilder;
use App\Services\Certificacion\DocumentStorageService;
use App\Services\Certificacion\XmlDocumentoAcademicoBuilder;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class XmlDocumentoAcademicoBuilderTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    public function test_genera_xml_base_versionado_y_actualiza_documento(): void
    {
        [$documento, $payload] = $this->crearDocumentoConPayloadCertificado();

        $cadena = app(CadenaOriginalBuilder::class)->generar($documento, $payload);

        $xmlBuilder = app(XmlDocumentoAcademicoBuilder::class);
        $version = $xmlBuilder->generar($documento->fresh(), $payload, $cadena);

        $documento->refresh();

        $this->assertSame('XML_ORIGINAL', $version->tipo);
        $this->assertSame(1, $version->version);
        $this->assertNotNull($version->contenido);
        $this->assertSame(hash('sha256', (string) $version->contenido), $version->sha256);
        $this->assertSame(EstadoXml::GENERADO->value, $documento->estado_xml);

        $meta = $version->metadata;
        $this->assertSame('base_controlada', $meta['modo']);
        $this->assertSame('pendiente_validacion_sep', $meta['estado_validacion']);

        $xml = (string) $version->contenido;
        $this->assertStringContainsString('<tipo_documento>certificado</tipo_documento>', $xml);
        $this->assertStringContainsString('<folio_interno>F-INT-001</folio_interno>', $xml);
        $this->assertStringContainsString('<token_consulta_publica>', $xml);
        $this->assertStringContainsString('<cadena_hash>', $xml);
        $this->assertStringContainsString('<cadena_original>', $xml);
        $this->assertStringContainsString((string) $cadena->cadena_hash, $xml);

        $payloadNuevo = app(DocumentStorageService::class)->guardarPayloadVersionado(
            $documento->fresh(),
            'CERTIFICADO_XML',
            array_merge(
                app(DocumentoAcademicoPayloadBuilder::class)->construir($documento->fresh(), 'CERTIFICADO_XML'),
                ['xml_segunda_version' => true],
            ),
        );

        $cadena2 = app(CadenaOriginalBuilder::class)->generar($documento->fresh(), $payloadNuevo);
        $version2 = $xmlBuilder->generar($documento->fresh(), $payloadNuevo, $cadena2);

        $this->assertSame(2, $version2->version);
        $this->assertSame(2, DocumentoVersion::query()->where('documento_academico_id', $documento->id)->where('tipo', 'XML_ORIGINAL')->count());

        $activos = DocumentoVersion::query()
            ->where('documento_academico_id', $documento->id)
            ->where('tipo', 'XML_ORIGINAL')
            ->where('activo', true)
            ->count();
        $this->assertSame(1, $activos);
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
            'nombre' => 'María',
            'primer_apellido' => 'García',
            'segundo_apellido' => null,
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
            'estado_firma' => 'no_firmado',
            'estado_pdf' => 'no_generado',
        ]);

        $payloadArr = array_merge(
            app(DocumentoAcademicoPayloadBuilder::class)->construir($documento, 'CERTIFICADO_XML'),
            [
                'programa' => ['nombre' => 'Licenciatura demo'],
                'plan' => ['clave' => 'PLAN-DEMO'],
                'trayectoria' => ['promedio' => '9.0'],
                'institucional' => ['subsistema_id' => null],
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
