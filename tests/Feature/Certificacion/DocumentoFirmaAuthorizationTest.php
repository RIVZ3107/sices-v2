<?php

declare(strict_types=1);

namespace Tests\Feature\Certificacion;

use App\Enums\Certificacion\EstadoCadena;
use App\Enums\Certificacion\EstadoFirma;
use App\Enums\Certificacion\EstadoXml;
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
use App\Policies\DocumentoAcademicoPolicy;
use App\Services\Certificacion\CertificacionAlcanceService;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Permission;
use Tests\Support\Since\FakeSinceFirmaClient;
use Tests\Support\SicesLegacy\InMemorySicesLegacyShadowRepository;
use Tests\TestCase;

class DocumentoFirmaAuthorizationTest extends TestCase
{
    use LazilyRefreshDatabase;

    protected bool $seed = true;

    protected string $seeder = RolesAndPermissionsSeeder::class;

    protected function setUp(): void
    {
        parent::setUp();

        $this->app->instance(
            \App\Infrastructure\Since\SinceFirmaClient::class,
            new FakeSinceFirmaClient,
        );
        $this->app->instance(
            \App\Contracts\SicesLegacy\SicesLegacyShadowRepositoryInterface::class,
            new InMemorySicesLegacyShadowRepository,
        );

        config([
            'since.firma.enabled' => true,
            'since.firma.simulated' => false,
            'sices_legacy.shadow_enabled' => true,
            'sices_legacy.writeback_enabled' => false,
        ]);
    }

    public function test_policy_solo_permite_firma_ejecutar_no_solicitar_firma(): void
    {
        $doc = $this->crearDocumentoFirmable();
        $policy = app(DocumentoAcademicoPolicy::class);

        $soloSolicitar = User::factory()->create();
        Permission::findOrCreate('solicitar_firma');
        $soloSolicitar->givePermissionTo('solicitar_firma');

        $conEjecutar = User::factory()->create();
        $conEjecutar->assignRole('sistemas');

        $this->assertFalse($policy->firmar($soloSolicitar, $doc));
        $this->assertTrue($policy->firmar($conEjecutar, $doc));
    }

    public function test_usuario_solo_solicitar_firma_no_puede_ejecutar_endpoint(): void
    {
        $usuario = User::factory()->create();
        Permission::findOrCreate('solicitar_firma');
        $usuario->givePermissionTo('solicitar_firma');
        Sanctum::actingAs($usuario);

        $doc = $this->crearDocumentoFirmable();

        $this->postJson("/api/v1/certificacion/documentos-academicos/{$doc->id}/firma/ejecutar")
            ->assertForbidden();
    }

    public function test_sistemas_con_firma_ejecutar_puede_intentar_firmar_documento_listo(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole('sistemas');
        Sanctum::actingAs($usuario);

        $doc = $this->crearDocumentoFirmable();

        $res = $this->postJson("/api/v1/certificacion/documentos-academicos/{$doc->id}/firma/ejecutar");

        $this->assertNotEquals(403, $res->status());
        $this->assertContains($res->status(), [200, 422]);
    }

    public function test_documento_fuera_de_alcance_institucional_no_puede_firmarse(): void
    {
        $ctxA = $this->crearContextoInstitucional();
        $ctxB = $this->crearContextoInstitucional();

        $usuario = User::factory()->create();
        $usuario->assignRole('sistemas');
        $usuario->instituciones()->sync([$ctxA['institucion_id']]);
        Sanctum::actingAs($usuario);

        $doc = $this->crearDocumentoFirmable($ctxB);

        $this->assertFalse(
            app(CertificacionAlcanceService::class)->documentoEnAlcance($usuario, $doc),
        );

        $this->postJson("/api/v1/certificacion/documentos-academicos/{$doc->id}/firma/ejecutar")
            ->assertForbidden();
    }

    public function test_no_refirma_documento_ya_firmado(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole('sistemas');
        Sanctum::actingAs($usuario);

        $doc = $this->crearDocumentoFirmable();
        $doc->forceFill(['estado_firma' => EstadoFirma::FIRMADO->value])->save();

        $this->postJson("/api/v1/certificacion/documentos-academicos/{$doc->id}/firma/ejecutar")
            ->assertStatus(422)
            ->assertJsonPath('error_code', 'prefirma_fallido');

        $this->assertSame(0, DocumentoFirma::query()->where('documento_academico_id', $doc->id)->count());
    }

    public function test_rechaza_segundo_intento_si_estado_firmando(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole('sistemas');
        Sanctum::actingAs($usuario);

        $doc = $this->crearDocumentoFirmable();
        $doc->forceFill(['estado_firma' => EstadoFirma::FIRMANDO->value])->save();

        $this->postJson("/api/v1/certificacion/documentos-academicos/{$doc->id}/firma/ejecutar")
            ->assertStatus(422)
            ->assertJsonPath('error_code', 'prefirma_fallido');

        $this->assertSame(EstadoFirma::FIRMANDO->value, $doc->fresh()->estado_firma);
    }

    public function test_responsable_certificacion_bloqueado_por_policy(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole('responsable_certificacion_titulacion');
        Sanctum::actingAs($usuario);

        $doc = $this->crearDocumentoFirmable();

        $this->assertFalse(app(DocumentoAcademicoPolicy::class)->firmar($usuario, $doc));

        $this->postJson("/api/v1/certificacion/documentos-academicos/{$doc->id}/firma/ejecutar")
            ->assertForbidden();
    }

    public function test_educacion_superior_no_puede_ejecutar_firma(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole('educacion_superior');
        Sanctum::actingAs($usuario);

        $doc = $this->crearDocumentoFirmable();

        $this->postJson("/api/v1/certificacion/documentos-academicos/{$doc->id}/firma/ejecutar")
            ->assertForbidden();
    }

    /**
     * @param  array<string, mixed>|null  $ctxOverride
     */
    private function crearDocumentoFirmable(?array $ctxOverride = null): DocumentoAcademico
    {
        $ctx = $ctxOverride ?? $this->crearContextoInstitucional();
        $urlShort = 'url-short-auth-'.substr(uniqid('', true), -6);

        $alumno = Alumno::query()->create([
            'curp' => sprintf('AUT000000HDF%05d', random_int(10000, 99999)),
            'nombre' => 'Firma',
            'primer_apellido' => 'Auth',
            'segundo_apellido' => 'Test',
        ]);

        $metadata = [
            'listo_para_firma' => true,
            'listo_para_firma_marcado_en' => now()->toIso8601String(),
            'sello_local' => 'SELLO-LOCAL-AUTH-TEST',
            'legacy_shadow' => [
                'exported' => true,
                'exported_at' => now()->toIso8601String(),
                'last_success_at' => now()->toIso8601String(),
                'url_short' => $urlShort,
            ],
        ];

        $doc = DocumentoAcademico::query()->create([
            'alumno_id' => $alumno->id,
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
            'token_consulta_publica' => $urlShort,
            'metadata' => $metadata,
            'snapshot_json' => ['promedio' => 9.0, 'creditos' => 6],
        ]);

        $matricula = \App\Models\Matricula::query()->create([
            'alumno_id' => $alumno->id,
            'oferta_academica_id' => $ctx['oferta_academica_id'],
            'ciclo_escolar_id' => $ctx['ciclo_escolar_id'],
            'matricula' => 'MAT-AUT-'.random_int(1000, 9999),
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
            ['codigo' => 'REGLA-FIRMA-AUTH'],
            [
                'tipo_documento' => 'certificado',
                'version' => 1,
                'descripcion' => 'Regla test firma auth',
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
            'cadena_original' => 'CADENA|AUTH|TEST',
            'cadena_hash' => hash('sha256', 'CADENA|AUTH|TEST'),
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

        $shadow = app(\App\Contracts\SicesLegacy\SicesLegacyShadowRepositoryInterface::class);
        if ($shadow instanceof InMemorySicesLegacyShadowRepository) {
            $shadow->upsertCertificado([
                'ourl_short' => $urlShort,
                'ocurp_completa' => $alumno->curp,
            ]);
        }

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
            'clave' => 'SED-'.$suf,
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
