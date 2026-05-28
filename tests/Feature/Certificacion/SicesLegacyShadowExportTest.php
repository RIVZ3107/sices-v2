<?php

declare(strict_types=1);

namespace Tests\Feature\Certificacion;

use App\Contracts\SicesLegacy\SicesLegacyShadowRepositoryInterface;
use App\Enums\Certificacion\EstadoCadena;
use App\Enums\Certificacion\EstadoXml;
use App\Models\Alumno;
use App\Models\CadenaOriginalGenerada;
use App\Models\CadenaOriginalRegla;
use App\Models\CicloEscolar;
use App\Models\DocumentoAcademico;
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
use Tests\Support\SicesLegacy\InMemorySicesLegacyShadowRepository;
use Tests\TestCase;

class SicesLegacyShadowExportTest extends TestCase
{
    use LazilyRefreshDatabase;

    protected bool $seed = true;

    protected string $seeder = RolesAndPermissionsSeeder::class;

    private InMemorySicesLegacyShadowRepository $shadowRepo;

    protected function setUp(): void
    {
        parent::setUp();

        $this->shadowRepo = new InMemorySicesLegacyShadowRepository;
        $this->app->instance(SicesLegacyShadowRepositoryInterface::class, $this->shadowRepo);

        config([
            'sices_legacy.enabled' => true,
            'sices_legacy.read_only' => false,
            'sices_legacy.write_enabled' => true,
            'sices_legacy.shadow_enabled' => true,
        ]);
    }

    public function test_sistemas_puede_exportar_si_preflight_ok(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole('sistemas');
        Sanctum::actingAs($usuario);

        $doc = $this->crearDocumentoExportable();

        $res = $this->postJson("/api/v1/certificacion/documentos-academicos/{$doc->id}/sices-legacy/shadow-export");

        $res->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.url_short', 'url-short-test-001')
            ->assertJsonPath('data.materias_exportadas', 1);

        $doc->refresh();
        $this->assertNotEmpty($doc->metadata['legacy_shadow']['exported_at'] ?? null);
        $this->assertNotNull($this->shadowRepo->findCertificadoByUrlShort('url-short-test-001'));
    }

    public function test_control_escolar_escuela_no_puede_exportar(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole('control_escolar_escuela');
        Sanctum::actingAs($usuario);

        $doc = $this->crearDocumentoExportable();

        $this->postJson("/api/v1/certificacion/documentos-academicos/{$doc->id}/sices-legacy/shadow-export")
            ->assertForbidden();
    }

    public function test_educacion_superior_no_puede_exportar(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole('educacion_superior');
        Sanctum::actingAs($usuario);

        $doc = $this->crearDocumentoExportable();

        $this->postJson("/api/v1/certificacion/documentos-academicos/{$doc->id}/sices-legacy/shadow-export")
            ->assertForbidden();
    }

    public function test_responsable_certificacion_no_puede_exportar(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole('responsable_certificacion_titulacion');
        Sanctum::actingAs($usuario);

        $doc = $this->crearDocumentoExportable();

        $this->postJson("/api/v1/certificacion/documentos-academicos/{$doc->id}/sices-legacy/shadow-export")
            ->assertForbidden();
    }

    public function test_auditor_no_puede_exportar(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole('auditor');
        Sanctum::actingAs($usuario);

        $doc = $this->crearDocumentoExportable();

        $this->postJson("/api/v1/certificacion/documentos-academicos/{$doc->id}/sices-legacy/shadow-export")
            ->assertForbidden();
    }

    public function test_no_exporta_si_shadow_deshabilitado(): void
    {
        config(['sices_legacy.shadow_enabled' => false]);

        $usuario = User::factory()->create();
        $usuario->assignRole('sistemas');
        Sanctum::actingAs($usuario);

        $doc = $this->crearDocumentoExportable();

        $this->postJson("/api/v1/certificacion/documentos-academicos/{$doc->id}/sices-legacy/shadow-export")
            ->assertStatus(422)
            ->assertJsonPath('success', false);
    }

    public function test_no_exporta_si_write_deshabilitado(): void
    {
        config(['sices_legacy.write_enabled' => false]);

        $usuario = User::factory()->create();
        $usuario->assignRole('sistemas');
        Sanctum::actingAs($usuario);

        $doc = $this->crearDocumentoExportable();

        $this->postJson("/api/v1/certificacion/documentos-academicos/{$doc->id}/sices-legacy/shadow-export")
            ->assertStatus(422)
            ->assertJsonPath('success', false);
    }

    public function test_no_exporta_si_falta_cadena_xml_sello(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole('sistemas');
        Sanctum::actingAs($usuario);

        $doc = $this->crearDocumentoExportable();
        CadenaOriginalGenerada::query()->where('documento_academico_id', $doc->id)->delete();
        DocumentoVersion::query()->where('documento_academico_id', $doc->id)->delete();
        $meta = $doc->metadata;
        unset($meta['sello_local']);
        $doc->forceFill(['metadata' => $meta])->save();

        $this->postJson("/api/v1/certificacion/documentos-academicos/{$doc->id}/sices-legacy/shadow-export")
            ->assertStatus(422)
            ->assertJsonPath('success', false);

        $this->assertNull($this->shadowRepo->findCertificadoByUrlShort('url-short-test-001'));
    }

    public function test_no_exporta_si_preflight_falla_por_no_listo(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole('sistemas');
        Sanctum::actingAs($usuario);

        $doc = $this->crearDocumentoExportable();
        $meta = $doc->metadata;
        $meta['listo_para_firma'] = false;
        $doc->forceFill(['metadata' => $meta])->save();

        $this->postJson("/api/v1/certificacion/documentos-academicos/{$doc->id}/sices-legacy/shadow-export")
            ->assertStatus(422)
            ->assertJsonPath('success', false);
    }

    public function test_no_exporta_documento_firmado(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole('sistemas');
        Sanctum::actingAs($usuario);

        $doc = $this->crearDocumentoExportable();
        $doc->forceFill(['estado_firma' => 'firmado'])->save();

        $this->postJson("/api/v1/certificacion/documentos-academicos/{$doc->id}/sices-legacy/shadow-export")
            ->assertStatus(422)
            ->assertJsonPath('success', false);
    }

    public function test_no_sobrescribe_certificado_legacy_timbrado(): void
    {
        $this->shadowRepo->upsertCertificado([
            'ourl_short' => 'url-short-test-001',
            'osituac' => 'F',
            'ofoliodigitalsep' => 'FOLIO-SEP-999',
            'ocurp_completa' => 'CURPTEST000000HDF00100',
        ]);

        $usuario = User::factory()->create();
        $usuario->assignRole('sistemas');
        Sanctum::actingAs($usuario);

        $doc = $this->crearDocumentoExportable();

        $this->postJson("/api/v1/certificacion/documentos-academicos/{$doc->id}/sices-legacy/shadow-export")
            ->assertStatus(422)
            ->assertJsonPath('success', false);
    }

    public function test_exporta_materias_idempotentemente(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole('sistemas');
        Sanctum::actingAs($usuario);

        $doc = $this->crearDocumentoExportable();

        $this->postJson("/api/v1/certificacion/documentos-academicos/{$doc->id}/sices-legacy/shadow-export")
            ->assertOk();

        $count1 = count($this->shadowRepo->allMaterias());

        $this->postJson("/api/v1/certificacion/documentos-academicos/{$doc->id}/sices-legacy/shadow-export")
            ->assertOk();

        $count2 = count($this->shadowRepo->allMaterias());
        $this->assertSame($count1, $count2);
        $this->assertSame(1, $count2);
    }

    private function crearDocumentoExportable(): DocumentoAcademico
    {
        $ctx = $this->crearContextoInstitucional();
        $alumno = Alumno::query()->create([
            'curp' => sprintf('SHAD000000HDF%05d', random_int(10000, 99999)),
            'nombre' => 'Shadow',
            'primer_apellido' => 'Test',
            'segundo_apellido' => 'Export',
        ]);

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
            'estado_firma' => 'no_firmado',
            'token_consulta_publica' => 'url-short-test-001',
            'metadata' => [
                'listo_para_firma' => true,
                'listo_para_firma_marcado_en' => now()->toIso8601String(),
                'sello_local' => 'SELLO-LOCAL-TEST',
            ],
            'snapshot_json' => ['promedio' => 9.1, 'creditos' => 6],
        ]);

        $matricula = \App\Models\Matricula::query()->create([
            'alumno_id' => $alumno->id,
            'oferta_academica_id' => $ctx['oferta_academica_id'],
            'ciclo_escolar_id' => $ctx['ciclo_escolar_id'],
            'matricula' => 'MAT-SHAD-'.random_int(1000, 9999),
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
            ['codigo' => 'REGLA-SHADOW-TEST'],
            [
                'tipo_documento' => 'certificado',
                'version' => 1,
                'descripcion' => 'Regla test shadow export',
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
            'cadena_original' => 'CADENA|TEST|SHADOW',
            'cadena_hash' => hash('sha256', 'CADENA|TEST|SHADOW'),
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
