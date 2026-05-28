<?php

declare(strict_types=1);

namespace Tests\Feature\Certificacion;

use App\Models\Alumno;
use App\Models\CicloEscolar;
use App\Models\DocumentoAcademico;
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
use Tests\TestCase;

class ProcesoTecnicoCertificacionTest extends TestCase
{
    use LazilyRefreshDatabase;

    protected bool $seed = true;

    protected string $seeder = RolesAndPermissionsSeeder::class;

    public function test_sistemas_ve_bandeja_listos_para_firma(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole('sistemas');
        Sanctum::actingAs($usuario);

        $doc = $this->crearDocumentoListoTecnico();

        $this->getJson('/api/v1/certificacion/bandejas/documentos-academicos/listos-para-firma')
            ->assertOk()
            ->assertJsonFragment(['id' => $doc->id]);
    }

    public function test_sistemas_puede_generar_payload(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole('sistemas');
        Sanctum::actingAs($usuario);

        $doc = $this->crearDocumentoListoTecnico();

        $res = $this->postJson("/api/v1/certificacion/documentos-academicos/{$doc->id}/dec-normal/payload");

        $this->assertNotSame(403, $res->status());
    }

    public function test_sistemas_puede_generar_cadena(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole('sistemas');
        Sanctum::actingAs($usuario);

        $doc = $this->crearDocumentoListoTecnico();

        $res = $this->postJson("/api/v1/certificacion/documentos-academicos/{$doc->id}/dec-normal/cadena");

        $this->assertNotSame(403, $res->status());
    }

    public function test_sistemas_puede_generar_xml(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole('sistemas');
        Sanctum::actingAs($usuario);

        $doc = $this->crearDocumentoListoTecnico();

        $res = $this->postJson("/api/v1/certificacion/documentos-academicos/{$doc->id}/dec-normal/xml");

        $this->assertNotSame(403, $res->status());
    }

    public function test_sistemas_puede_validar_xml(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole('sistemas');
        Sanctum::actingAs($usuario);

        $doc = $this->crearDocumentoListoTecnico();

        $res = $this->postJson("/api/v1/certificacion/documentos-academicos/{$doc->id}/dec-normal/validar-xml");

        $this->assertNotSame(403, $res->status());
    }

    public function test_sistemas_puede_ver_errores_y_preflight(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole('sistemas');
        Sanctum::actingAs($usuario);

        $doc = $this->crearDocumentoListoTecnico();

        $this->getJson("/api/v1/certificacion/documentos-academicos/{$doc->id}/dec-normal/errores")
            ->assertOk();

        $pref = $this->postJson("/api/v1/certificacion/documentos-academicos/{$doc->id}/dec-normal/preflight");
        $this->assertNotSame(403, $pref->status());
    }

    public function test_control_escolar_escuela_no_puede_generar_cadena(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole('control_escolar_escuela');
        Sanctum::actingAs($usuario);

        $doc = $this->crearDocumentoListoTecnico();

        $this->postJson("/api/v1/certificacion/documentos-academicos/{$doc->id}/dec-normal/cadena")
            ->assertForbidden();
    }

    public function test_educacion_superior_no_puede_generar_xml(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole('educacion_superior');
        Sanctum::actingAs($usuario);

        $doc = $this->crearDocumentoListoTecnico();

        $this->postJson("/api/v1/certificacion/documentos-academicos/{$doc->id}/dec-normal/xml")
            ->assertForbidden();
    }

    public function test_responsable_certificacion_no_puede_generar_cadena_ni_xml(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole('responsable_certificacion_titulacion');
        Sanctum::actingAs($usuario);

        $doc = $this->crearDocumentoListoTecnico();

        $this->postJson("/api/v1/certificacion/documentos-academicos/{$doc->id}/dec-normal/cadena")
            ->assertForbidden();
        $this->postJson("/api/v1/certificacion/documentos-academicos/{$doc->id}/dec-normal/xml")
            ->assertForbidden();
    }

    public function test_auditor_no_puede_ejecutar_acciones_tecnicas(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole('auditor');
        Sanctum::actingAs($usuario);

        $doc = $this->crearDocumentoListoTecnico();

        $this->getJson("/api/v1/certificacion/documentos-academicos/{$doc->id}")
            ->assertOk();

        $this->postJson("/api/v1/certificacion/documentos-academicos/{$doc->id}/dec-normal/cadena")
            ->assertForbidden();
        $this->postJson("/api/v1/certificacion/documentos-academicos/{$doc->id}/dec-normal/payload")
            ->assertForbidden();
    }

    public function test_documento_no_liberado_no_permite_ver_a_sistemas(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole('sistemas');
        Sanctum::actingAs($usuario);

        $doc = $this->crearDocumentoEnRevision();

        $this->getJson("/api/v1/certificacion/documentos-academicos/{$doc->id}")
            ->assertForbidden();

        $this->postJson("/api/v1/certificacion/documentos-academicos/{$doc->id}/dec-normal/cadena")
            ->assertForbidden();
    }

    public function test_documento_firmado_sigue_consultable_pero_preflight_puede_fallar(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole('sistemas');
        Sanctum::actingAs($usuario);

        $doc = $this->crearDocumentoListoTecnico();
        $doc->forceFill(['estado_firma' => 'firmado'])->save();

        $this->getJson("/api/v1/certificacion/documentos-academicos/{$doc->id}")
            ->assertOk();

        $this->getJson("/api/v1/certificacion/documentos-academicos/{$doc->id}/dec-normal/errores")
            ->assertOk();
    }

    public function test_errores_tecnicos_respuesta_controlada_sin_excepcion_cruda(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole('sistemas');
        Sanctum::actingAs($usuario);

        $doc = $this->crearDocumentoListoTecnico();

        $res = $this->getJson("/api/v1/certificacion/documentos-academicos/{$doc->id}/dec-normal/errores");

        $res->assertOk()
            ->assertJsonStructure(['data' => ['documento_id', 'estado_cadena', 'estado_xml', 'errores_xml']]);
    }

    private function crearDocumentoEnRevision(): DocumentoAcademico
    {
        $ctx = $this->crearContextoInstitucional();
        $alumno = Alumno::query()->create([
            'curp' => sprintf('PTEC000000HDF%05d', random_int(10000, 99999)),
            'nombre' => 'Alumno',
            'primer_apellido' => 'Tecnico',
            'segundo_apellido' => 'Test',
        ]);

        return DocumentoAcademico::query()->create([
            'alumno_id' => $alumno->id,
            'ciclo_escolar_id' => $ctx['ciclo_escolar_id'],
            'oferta_academica_id' => $ctx['oferta_academica_id'],
            'subsistema_id' => $ctx['subsistema_id'],
            'region_id' => $ctx['region_id'],
            'institucion_id' => $ctx['institucion_id'],
            'sede_id' => $ctx['sede_id'],
            'tipo_documento' => 'certificado',
            'tipo_certificacion' => 'total',
            'estado_workflow' => 'en_revision',
        ]);
    }

    private function crearDocumentoListoTecnico(): DocumentoAcademico
    {
        $doc = $this->crearDocumentoEnRevision();
        $doc->forceFill([
            'estado_workflow' => 'aprobado',
            'fecha_aprobacion' => now(),
            'folio_interno' => 'FOL-PT-'.random_int(1000, 9999),
            'token_consulta_publica' => 'tok-pt-'.random_int(1000, 9999),
            'metadata' => [
                'listo_para_firma' => true,
                'listo_para_firma_marcado_en' => now()->toIso8601String(),
                'sello_local' => 'SELLO-TEST-LOCAL',
            ],
        ])->save();

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
