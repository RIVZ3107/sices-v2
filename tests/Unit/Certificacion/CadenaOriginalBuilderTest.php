<?php

declare(strict_types=1);

namespace Tests\Unit\Certificacion;

use App\Enums\Certificacion\EstadoCadena;
use App\Exceptions\Certificacion\ReglaCadenaNoEncontradaException;
use App\Models\Alumno;
use App\Models\CadenaOriginalGenerada;
use App\Models\CadenaOriginalRegla;
use App\Models\CicloEscolar;
use App\Models\DocumentoAcademico;
use App\Models\DocumentoPayload;
use App\Services\Certificacion\CadenaOriginalBuilder;
use App\Services\Certificacion\DocumentoAcademicoPayloadBuilder;
use App\Services\Certificacion\DocumentStorageService;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class CadenaOriginalBuilderTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    public function test_genera_cadena_desde_payload_hash_version_y_estado(): void
    {
        [$documento, $payload] = $this->crearDocumentoConPayloadCertificado();

        $builder = app(CadenaOriginalBuilder::class);

        $gen = $builder->generar($documento, $payload);

        $documento->refresh();

        $this->assertSame(1, $gen->version);
        $this->assertSame($payload->payload_hash, $gen->payload_hash);
        $this->assertSame($builder->calcularHash($gen->cadena_original), $gen->cadena_hash);
        $this->assertSame(EstadoCadena::GENERADA->value, $documento->estado_cadena);

        $meta = $gen->metadata;
        $this->assertSame('base_controlada', $meta['modo']);
        $this->assertSame('pendiente_validacion_sep', $meta['estado_validacion']);
        $this->assertTrue($meta['requiere_revision_senior']);

        $payloadNuevo = app(DocumentStorageService::class)->guardarPayloadVersionado(
            $documento->fresh(),
            'CERTIFICADO_XML',
            array_merge(
                app(DocumentoAcademicoPayloadBuilder::class)->construir($documento->fresh(), 'CERTIFICADO_XML'),
                ['extra_version' => 2],
            ),
        );

        $gen2 = $builder->generar($documento->fresh(), $payloadNuevo);

        $this->assertSame(2, $gen2->version);
        $this->assertSame(2, CadenaOriginalGenerada::query()->where('documento_academico_id', $documento->id)->count());
        $this->assertNotSame($gen->cadena_original, $gen2->cadena_original);
    }

    public function test_sin_regla_activa_lanza_excepcion_controlada(): void
    {
        [$documento, $payload] = $this->crearDocumentoConPayloadCertificado();

        CadenaOriginalRegla::query()->where('tipo_documento', 'certificado')->update(['activo' => false]);

        $this->expectException(ReglaCadenaNoEncontradaException::class);

        app(CadenaOriginalBuilder::class)->generar($documento->fresh(), $payload);
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
            'estado_firma' => 'no_firmado',
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
