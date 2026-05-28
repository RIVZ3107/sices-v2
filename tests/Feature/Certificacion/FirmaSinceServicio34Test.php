<?php

declare(strict_types=1);

namespace Tests\Feature\Certificacion;

use App\Contracts\SicesLegacy\SicesLegacyShadowRepositoryInterface;
use App\Data\Firma\SinceFirmaResponse;
use App\Enums\Certificacion\EstadoCadena;
use App\Enums\Certificacion\EstadoFirma;
use App\Enums\Certificacion\EstadoXml;
use App\Infrastructure\Since\SinceFirmaClient;
use App\Models\Alumno;
use App\Models\CadenaOriginalGenerada;
use App\Models\CadenaOriginalRegla;
use App\Models\CicloEscolar;
use App\Models\DocumentoAcademico;
use App\Models\DocumentoFirma;
use App\Models\DocumentoMateriaSnapshot;
use App\Models\DocumentoPayload;
use App\Models\DocumentoVersion;
use App\Models\Institucion;
use App\Models\NivelAcademico;
use App\Models\OfertaAcademica;
use App\Models\PlanEstudio;
use App\Models\ProgramaEstudio;
use App\Models\Region;
use App\Models\Sede;
use App\Models\Subsistema;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\Support\Since\FakeSinceFirmaClient;
use Tests\Support\SicesLegacy\InMemorySicesLegacyShadowRepository;
use Tests\TestCase;

class FirmaSinceServicio34Test extends TestCase
{
    use LazilyRefreshDatabase;

    protected bool $seed = true;

    protected string $seeder = RolesAndPermissionsSeeder::class;

    private FakeSinceFirmaClient $fakeSince;

    private InMemorySicesLegacyShadowRepository $shadowRepo;

    protected function setUp(): void
    {
        parent::setUp();

        $this->fakeSince = new FakeSinceFirmaClient;
        $this->app->instance(SinceFirmaClient::class, $this->fakeSince);

        $this->shadowRepo = new InMemorySicesLegacyShadowRepository;
        $this->app->instance(SicesLegacyShadowRepositoryInterface::class, $this->shadowRepo);

        config([
            'since.firma.enabled' => true,
            'since.firma.simulated' => false,
            'sices_legacy.enabled' => true,
            'sices_legacy.read_only' => false,
            'sices_legacy.write_enabled' => true,
            'sices_legacy.shadow_enabled' => true,
            'sices_legacy.writeback_enabled' => false,
        ]);
    }

    public function test_sistemas_puede_firmar_si_preflight_y_shadow_ok(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole('sistemas');
        Sanctum::actingAs($usuario);

        $doc = $this->crearDocumentoFirmable();
        $this->shadowRepo->upsertCertificado(['ourl_short' => 'url-short-firma-001', 'ocurp_completa' => 'CURPFIRMA000000HDF00100']);

        $res = $this->postJson("/api/v1/certificacion/documentos-academicos/{$doc->id}/firma/ejecutar");

        $res->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('message', 'Documento firmado correctamente.')
            ->assertJsonPath('data.url_short', 'url-short-firma-001')
            ->assertJsonPath('data.folio_digital_sep', 'FOLIO-FAKE-001')
            ->assertJsonPath('data.estado_firma', 'firmado');

        $doc->refresh();
        $this->assertSame('firmado', $doc->estado_firma);
        $this->assertSame('timbrado', $doc->estado_xml);
        $this->assertSame('FOLIO-FAKE-001', $doc->folio_digital_sep);
        $this->assertCount(1, $this->fakeSince->calls);
        $this->assertSame('url-short-firma-001', $this->fakeSince->calls[0]['url_short']);

        $firma = DocumentoFirma::query()->where('documento_academico_id', $doc->id)->latest('id')->first();
        $this->assertNotNull($firma);
        $this->assertSame('firmado', $firma->estado);
        $this->assertNotEmpty($firma->xml_firmado);

        $this->assertDatabaseHas('documento_versiones', [
            'documento_academico_id' => $doc->id,
            'tipo' => 'XML_FIRMADO_SEP',
        ]);
        $this->assertDatabaseMissing('documento_versiones', [
            'documento_academico_id' => $doc->id,
            'tipo' => 'PDF_OFICIAL',
        ]);
    }

    public function test_no_firma_si_since_deshabilitado(): void
    {
        config(['since.firma.enabled' => false]);

        $usuario = User::factory()->create();
        $usuario->assignRole('sistemas');
        Sanctum::actingAs($usuario);

        $doc = $this->crearDocumentoFirmable();

        $this->postJson("/api/v1/certificacion/documentos-academicos/{$doc->id}/firma/ejecutar")
            ->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonPath('error_code', 'since_firma_disabled');

        $this->assertCount(0, $this->fakeSince->calls);
    }

    public function test_no_firma_si_shadow_no_exportado(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole('sistemas');
        Sanctum::actingAs($usuario);

        $doc = $this->crearDocumentoFirmable(conShadow: false);

        $this->postJson("/api/v1/certificacion/documentos-academicos/{$doc->id}/firma/ejecutar")
            ->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonPath('error_code', 'shadow_no_exportado');

        $this->assertCount(0, $this->fakeSince->calls);
    }

    public function test_no_firma_si_preflight_falla(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole('sistemas');
        Sanctum::actingAs($usuario);

        $doc = $this->crearDocumentoFirmable();
        CadenaOriginalGenerada::query()->where('documento_academico_id', $doc->id)->delete();

        $this->postJson("/api/v1/certificacion/documentos-academicos/{$doc->id}/firma/ejecutar")
            ->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonPath('error_code', 'preflight_fallido');

        $this->assertCount(0, $this->fakeSince->calls);
    }

    public function test_no_firma_documento_ya_firmado(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole('sistemas');
        Sanctum::actingAs($usuario);

        $doc = $this->crearDocumentoFirmable();
        $doc->forceFill(['estado_firma' => 'firmado'])->save();

        $this->postJson("/api/v1/certificacion/documentos-academicos/{$doc->id}/firma/ejecutar")
            ->assertStatus(422)
            ->assertJsonPath('error_code', 'prefirma_fallido');

        $this->assertCount(0, $this->fakeSince->calls);
    }

    public function test_control_escolar_escuela_no_puede_firmar(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole('control_escolar_escuela');
        Sanctum::actingAs($usuario);

        $doc = $this->crearDocumentoFirmable();

        $this->postJson("/api/v1/certificacion/documentos-academicos/{$doc->id}/firma/ejecutar")
            ->assertForbidden();
    }

    public function test_educacion_superior_no_puede_firmar(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole('educacion_superior');
        Sanctum::actingAs($usuario);

        $doc = $this->crearDocumentoFirmable();

        $this->postJson("/api/v1/certificacion/documentos-academicos/{$doc->id}/firma/ejecutar")
            ->assertForbidden();
    }

    public function test_responsable_certificacion_no_puede_firmar(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole('responsable_certificacion_titulacion');
        Sanctum::actingAs($usuario);

        $doc = $this->crearDocumentoFirmable();

        $this->postJson("/api/v1/certificacion/documentos-academicos/{$doc->id}/firma/ejecutar")
            ->assertForbidden();
    }

    public function test_auditor_no_puede_firmar(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole('auditor');
        Sanctum::actingAs($usuario);

        $doc = $this->crearDocumentoFirmable();

        $this->postJson("/api/v1/certificacion/documentos-academicos/{$doc->id}/firma/ejecutar")
            ->assertForbidden();
    }

    public function test_error_sep_cadena_autenticar_guarda_error_firma(): void
    {
        $this->fakeSince->nextResponse = new SinceFirmaResponse(
            success: false,
            message: 'Error al autenticar la cadena',
            errorCode: 'sep_cadena_invalida',
            httpStatus: 200,
            rawSanitized: ['error' => 'Error al autenticar la cadena'],
        );

        $usuario = User::factory()->create();
        $usuario->assignRole('sistemas');
        Sanctum::actingAs($usuario);

        $doc = $this->crearDocumentoFirmable();
        $this->shadowRepo->upsertCertificado(['ourl_short' => 'url-short-firma-001']);

        $this->postJson("/api/v1/certificacion/documentos-academicos/{$doc->id}/firma/ejecutar")
            ->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonPath('data.estado_firma', 'error_firma');

        $this->assertSame('error_firma', $doc->fresh()->estado_firma);
        $this->assertCount(1, $this->fakeSince->calls);
    }

    public function test_respuesta_exitosa_guarda_folio_y_xml_firmado(): void
    {
        $this->fakeSince->nextResponse = new SinceFirmaResponse(
            success: true,
            message: 'OK SEP',
            xmlFirmado: '<?xml version="1.0"?><DecSEP firmado="1"/>',
            folioDigital: 'FD-SEP-999888',
            selloSep: 'SELLO-SEP-LARGO',
            httpStatus: 200,
            rawSanitized: ['folioDigital' => 'FD-SEP-999888'],
        );

        $usuario = User::factory()->create();
        $usuario->assignRole('sistemas');
        Sanctum::actingAs($usuario);

        $doc = $this->crearDocumentoFirmable();
        $this->shadowRepo->upsertCertificado(['ourl_short' => 'url-short-firma-001']);

        $this->postJson("/api/v1/certificacion/documentos-academicos/{$doc->id}/firma/ejecutar")
            ->assertOk()
            ->assertJsonPath('data.folio_digital_sep', 'FD-SEP-999888');

        $firma = DocumentoFirma::query()->where('documento_academico_id', $doc->id)->latest('id')->first();
        $this->assertStringContainsString('DecSEP', (string) $firma?->xml_firmado);
        $this->assertSame('FD-SEP-999888', $doc->fresh()->folio_digital_sep);
    }

    public function test_writeback_informix_solo_si_habilitado(): void
    {
        config(['sices_legacy.writeback_enabled' => true]);

        $this->fakeSince->nextResponse = new SinceFirmaResponse(
            success: true,
            message: 'OK',
            xmlFirmado: '<?xml version="1.0"?><Dec/>',
            folioDigital: 'WB-FOLIO-1',
            selloSep: 'WB-SELLO',
            httpStatus: 200,
        );

        $usuario = User::factory()->create();
        $usuario->assignRole('sistemas');
        Sanctum::actingAs($usuario);

        $doc = $this->crearDocumentoFirmable();
        $this->shadowRepo->upsertCertificado(['ourl_short' => 'url-short-firma-001', 'osituac' => 'P']);

        $this->postJson("/api/v1/certificacion/documentos-academicos/{$doc->id}/firma/ejecutar")
            ->assertOk();

        $legacy = $this->shadowRepo->findCertificadoByUrlShort('url-short-firma-001');
        $this->assertSame('F', $legacy['osituac'] ?? null);
        $this->assertSame('WB-FOLIO-1', $legacy['ofoliodigitalsep'] ?? null);
        $this->assertSame('M', $legacy['istatus'] ?? null);
    }

    public function test_sin_writeback_no_actualiza_legacy(): void
    {
        config(['sices_legacy.writeback_enabled' => false]);

        $usuario = User::factory()->create();
        $usuario->assignRole('sistemas');
        Sanctum::actingAs($usuario);

        $doc = $this->crearDocumentoFirmable();
        $this->shadowRepo->upsertCertificado(['ourl_short' => 'url-short-firma-001', 'osituac' => 'P']);

        $this->postJson("/api/v1/certificacion/documentos-academicos/{$doc->id}/firma/ejecutar")
            ->assertOk();

        $legacy = $this->shadowRepo->findCertificadoByUrlShort('url-short-firma-001');
        $this->assertSame('P', $legacy['osituac'] ?? null);
        $this->assertEmpty($legacy['ofoliodigitalsep'] ?? null);
    }

    private function crearDocumentoFirmable(bool $conShadow = true): DocumentoAcademico
    {
        $ctx = $this->crearContextoInstitucional();
        $alumno = Alumno::query()->create([
            'curp' => sprintf('FIRM000000HDF%05d', random_int(10000, 99999)),
            'nombre' => 'Firma',
            'primer_apellido' => 'Test',
            'segundo_apellido' => 'SEP',
        ]);

        $metadata = [
            'listo_para_firma' => true,
            'listo_para_firma_marcado_en' => now()->toIso8601String(),
            'sello_local' => 'SELLO-LOCAL-FIRMA-TEST',
        ];

        if ($conShadow) {
            $metadata['legacy_shadow'] = [
                'exported' => true,
                'exported_at' => now()->toIso8601String(),
                'last_success_at' => now()->toIso8601String(),
                'url_short' => 'url-short-firma-001',
            ];
        }

        $doc = DocumentoAcademico::query()->create([
            'alumno_id' => $alumno->id,
            'matricula_id' => null,
            'ciclo_escolar_id' => $ctx['ciclo_escolar_id'],
            'oferta_academica_id' => $ctx['oferta_academica_id'],
            'subsistema_id' => $ctx['subsistema_id'],
            'region_id' => $ctx['region_id'],
            'institucion_id' => $ctx['institucion_id'],
            'sede_id' => $ctx['sede_id'],
            'tipo_documento' => 'certificado',
            'tipo_certificacion' => 'total',
            'estado_workflow' => 'aprobado',
            'estado_cadena' => EstadoCadena::GENERADA->value,
            'estado_xml' => EstadoXml::GENERADO->value,
            'estado_firma' => EstadoFirma::NO_FIRMADO->value,
            'token_consulta_publica' => 'url-short-firma-001',
            'metadata' => $metadata,
            'snapshot_json' => ['promedio' => 9.0, 'creditos' => 6],
        ]);

        $matricula = \App\Models\Matricula::query()->create([
            'alumno_id' => $alumno->id,
            'oferta_academica_id' => $ctx['oferta_academica_id'],
            'ciclo_escolar_id' => $ctx['ciclo_escolar_id'],
            'matricula' => 'MAT-FIR-'.random_int(1000, 9999),
            'estado' => 'activa',
        ]);
        $doc->forceFill(['matricula_id' => $matricula->id])->save();

        $payloadJson = ['alumno' => ['curp' => $alumno->curp], 'spec' => 'dec-normal-2025'];
        $payloadHash = hash('sha256', json_encode($payloadJson, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
        $payload = DocumentoPayload::query()->create([
            'documento_academico_id' => $doc->id,
            'tipo' => 'CERTIFICADO_XML',
            'version' => 1,
            'payload_json' => $payloadJson,
            'payload_hash' => $payloadHash,
            'activo' => true,
        ]);

        $regla = CadenaOriginalRegla::query()->firstOrCreate(
            ['codigo' => 'REGLA-FIRMA-TEST'],
            [
                'tipo_documento' => 'certificado',
                'version' => 1,
                'descripcion' => 'Regla test firma',
                'activo' => true,
                'estructura_campos' => [],
            ],
        );

        CadenaOriginalGenerada::query()->create([
            'documento_academico_id' => $doc->id,
            'documento_payload_id' => $payload->id,
            'cadena_original_regla_id' => $regla->id,
            'version' => 1,
            'payload_hash' => $payloadHash,
            'cadena_original' => 'CADENA|FIRMA|TEST',
            'cadena_hash' => hash('sha256', 'CADENA|FIRMA|TEST'),
            'estado' => 'generada',
        ]);

        DocumentoVersion::query()->create([
            'documento_academico_id' => $doc->id,
            'tipo' => 'XML_ORIGINAL',
            'version' => 1,
            'contenido' => '<?xml version="1.0"?><Dec/>',
            'sha256' => hash('sha256', '<?xml version="1.0"?><Dec/>'),
            'activo' => true,
        ]);

        DocumentoMateriaSnapshot::query()->create([
            'documento_academico_id' => $doc->id,
            'clave' => 'MAT101',
            'nombre' => 'Matemáticas',
            'calificacion_final' => 9.5,
            'semestre' => 1,
            'periodo' => '2024-2025',
            'creditos' => 6,
            'orden' => 1,
        ]);

        return $doc->refresh();
    }

    /**
     * @return array{subsistema_id: int, region_id: int, institucion_id: int, sede_id: int, oferta_academica_id: int, ciclo_escolar_id: int}
     */
    private function crearContextoInstitucional(): array
    {
        $suf = substr(str_replace('.', '', uniqid('', true)), 0, 10);

        $subsistema = Subsistema::query()->updateOrCreate(
            ['clave' => 'NORMAL'],
            ['nombre' => 'Educación Normal', 'nombre_corto' => 'Normal', 'activo' => true],
        );

        $region = Region::query()->create([
            'subsistema_id' => $subsistema->id,
            'clave' => 'REG-'.$suf,
            'nombre' => 'Región prueba',
            'activo' => true,
        ]);

        $institucion = Institucion::query()->create([
            'subsistema_id' => $subsistema->id,
            'region_id' => $region->id,
            'clave' => 'INS-'.$suf,
            'nombre' => 'Institución prueba',
            'activo' => true,
        ]);

        $sede = Sede::query()->create([
            'institucion_id' => $institucion->id,
            'region_id' => $region->id,
            'clave' => 'CCT'.$suf,
            'nombre' => 'Sede prueba',
            'activo' => true,
        ]);

        $nivel = NivelAcademico::query()->firstOrCreate(
            ['clave' => 'LIC'],
            ['nombre' => 'Licenciatura', 'activo' => true],
        );

        $programa = ProgramaEstudio::query()->create([
            'nivel_academico_id' => $nivel->id,
            'subsistema_id' => $subsistema->id,
            'clave' => 'PROG-'.$suf,
            'nombre' => 'Programa prueba',
            'activo' => true,
        ]);

        $plan = PlanEstudio::query()->create([
            'programa_estudio_id' => $programa->id,
            'subsistema_id' => $subsistema->id,
            'clave' => 'PLAN-'.$suf,
            'nombre' => 'Plan prueba',
            'activo' => true,
        ]);

        $ciclo = CicloEscolar::query()->create([
            'clave' => 'CIC-'.$suf,
            'nombre' => 'Ciclo prueba',
            'fecha_inicio' => '2024-08-01',
            'fecha_fin' => '2025-07-31',
            'es_actual' => true,
            'activo' => true,
        ]);

        $oferta = OfertaAcademica::query()->create([
            'institucion_id' => $institucion->id,
            'sede_id' => $sede->id,
            'programa_estudio_id' => $programa->id,
            'plan_estudio_id' => $plan->id,
            'ciclo_escolar_id' => $ciclo->id,
            'clave' => 'OFA-'.$suf,
            'modalidad' => 'escolarizada',
            'activo' => true,
        ]);

        return [
            'subsistema_id' => $subsistema->id,
            'region_id' => $region->id,
            'institucion_id' => $institucion->id,
            'sede_id' => $sede->id,
            'oferta_academica_id' => $oferta->id,
            'ciclo_escolar_id' => $ciclo->id,
        ];
    }
}
