<?php

declare(strict_types=1);

namespace Tests\Feature\Certificacion;

use App\Models\Alumno;
use App\Models\CicloEscolar;
use App\Models\DocumentoAcademico;
use App\Models\DocumentoObservacion;
use App\Models\Institucion;
use App\Models\NivelAcademico;
use App\Models\OfertaAcademica;
use App\Models\PlanEstudio;
use App\Models\ProgramaEstudio;
use App\Models\Region;
use App\Models\Sede;
use App\Models\Subsistema;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RevisionInstitucionalCertificacionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    public function test_educacion_superior_ve_bandeja_documentos_en_revision(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole('educacion_superior');
        Sanctum::actingAs($usuario);

        $doc = $this->crearDocumentoEnRevision();

        $this->getJson('/api/v1/certificacion/bandejas/documentos-academicos/en-revision')
            ->assertOk()
            ->assertJsonFragment(['id' => $doc->id]);
    }

    public function test_educacion_superior_puede_consultar_revision_institucional(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole('educacion_superior');
        Sanctum::actingAs($usuario);

        $doc = $this->crearDocumentoEnRevision();

        $this->getJson("/api/v1/certificacion/documentos-academicos/{$doc->id}/revision-institucional")
            ->assertOk()
            ->assertJsonPath('data.documento.id', $doc->id)
            ->assertJsonMissingPath('data.cadena_original')
            ->assertJsonMissingPath('data.xml');
    }

    public function test_educacion_superior_puede_crear_observacion(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole('educacion_superior');
        Sanctum::actingAs($usuario);

        $doc = $this->crearDocumentoEnRevision();

        $this->postJson("/api/v1/certificacion/documentos-academicos/{$doc->id}/observaciones", [
            'tipo' => 'documental',
            'seccion' => 'documento',
            'observacion' => 'Falta acta de examen profesional.',
            'prioridad' => 'alta',
            'metadata' => ['requiere_correccion' => true],
        ])->assertOk();
    }

    public function test_educacion_superior_puede_devolver_a_correccion_con_observacion_pendiente(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole('educacion_superior');
        Sanctum::actingAs($usuario);

        $doc = $this->crearDocumentoEnRevision();
        DocumentoObservacion::query()->create([
            'documento_academico_id' => $doc->id,
            'tipo' => 'academica',
            'observacion' => 'Corregir promedio.',
            'estado' => 'pendiente',
            'prioridad' => 'media',
        ]);

        $this->postJson("/api/v1/certificacion/documentos-academicos/{$doc->id}/devolver-correccion", [
            'motivo' => 'Devuelto a Control Escolar.',
        ])->assertOk();

        $this->assertSame('rechazado', $doc->fresh()->estado_workflow);
    }

    public function test_educacion_superior_puede_aprobar_si_tiene_permiso_sin_ser_403(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole('educacion_superior');
        Sanctum::actingAs($usuario);

        $doc = $this->crearDocumentoEnRevision();

        $res = $this->postJson("/api/v1/certificacion/documentos-academicos/{$doc->id}/aprobar", [
            'motivo' => 'Aprobación institucional.',
        ]);

        $this->assertNotSame(403, $res->status());
    }

    public function test_educacion_superior_no_puede_generar_cadena(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole('educacion_superior');
        Sanctum::actingAs($usuario);

        $doc = $this->crearDocumentoAprobado();

        $this->postJson("/api/v1/certificacion/documentos-academicos/{$doc->id}/dec-normal/cadena")
            ->assertForbidden();
    }

    public function test_educacion_superior_no_puede_firmar_sep(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole('educacion_superior');
        Sanctum::actingAs($usuario);

        $doc = $this->crearDocumentoAprobado();

        $this->postJson("/api/v1/certificacion/documentos-academicos/{$doc->id}/firma/ejecutar")
            ->assertForbidden();
    }

    public function test_responsable_certificacion_puede_ver_documentos_y_revision(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole('responsable_certificacion_titulacion');
        Sanctum::actingAs($usuario);

        $doc = $this->crearDocumentoEnRevision();

        $this->getJson('/api/v1/certificacion/bandejas/documentos-academicos/pendientes-revision')
            ->assertOk();

        $this->getJson("/api/v1/certificacion/documentos-academicos/{$doc->id}/revision-institucional")
            ->assertOk();
    }

    public function test_responsable_certificacion_puede_liberar_a_proceso_tecnico_si_aprobado(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole('responsable_certificacion_titulacion');
        $this->assertTrue(
            $usuario->can('documentos.liberar_proceso_tecnico') || $usuario->can('preparar_documento_firma'),
        );
        Sanctum::actingAs($usuario);

        $doc = $this->crearDocumentoAprobado();
        $doc->forceFill([
            'folio_interno' => 'FOL-TEST-001',
            'token_consulta_publica' => 'tok-test-001',
        ])->save();

        $res = $this->postJson("/api/v1/certificacion/documentos-academicos/{$doc->id}/listo-para-firma", [
            'motivo' => 'Liberado a proceso técnico.',
        ]);

        $this->assertNotSame(403, $res->status());
    }

    public function test_responsable_certificacion_no_puede_firmar_sep(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole('responsable_certificacion_titulacion');
        Sanctum::actingAs($usuario);

        $doc = $this->crearDocumentoAprobado();

        $this->postJson("/api/v1/certificacion/documentos-academicos/{$doc->id}/firma/ejecutar")
            ->assertForbidden();
    }

    public function test_control_escolar_escuela_no_puede_aprobar_institucionalmente(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole('control_escolar_escuela');
        Sanctum::actingAs($usuario);

        $doc = $this->crearDocumentoEnRevision();

        $this->postJson("/api/v1/certificacion/documentos-academicos/{$doc->id}/aprobar", [
            'motivo' => 'No debe aprobar',
        ])->assertForbidden();
    }

    public function test_auditor_solo_puede_ver_sin_aprobar(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole('auditor');
        Sanctum::actingAs($usuario);

        $doc = $this->crearDocumentoEnRevision();

        $this->getJson("/api/v1/certificacion/documentos-academicos/{$doc->id}/revision-institucional")
            ->assertOk();

        $this->postJson("/api/v1/certificacion/documentos-academicos/{$doc->id}/aprobar", [
            'motivo' => 'No debe aprobar',
        ])->assertForbidden();
    }

    public function test_documento_con_observaciones_pendientes_no_puede_liberarse(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole('responsable_certificacion_titulacion');
        Sanctum::actingAs($usuario);

        $doc = $this->crearDocumentoAprobado();
        $doc->forceFill([
            'folio_interno' => 'FOL-OBS-001',
            'token_consulta_publica' => 'tok-obs-001',
        ])->save();

        DocumentoObservacion::query()->create([
            'documento_academico_id' => $doc->id,
            'tipo' => 'materias',
            'observacion' => 'Pendiente de atención.',
            'estado' => 'pendiente',
            'prioridad' => 'alta',
        ]);

        $this->postJson("/api/v1/certificacion/documentos-academicos/{$doc->id}/listo-para-firma", [
            'motivo' => 'Intento liberar con obs pendientes',
        ])->assertStatus(422);
    }

    public function test_documento_firmado_no_permite_nueva_observacion(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole('educacion_superior');
        Sanctum::actingAs($usuario);

        $doc = $this->crearDocumentoEnRevision();
        $doc->forceFill(['estado_firma' => 'firmado'])->save();

        $this->postJson("/api/v1/certificacion/documentos-academicos/{$doc->id}/observaciones", [
            'tipo' => 'academica',
            'observacion' => 'No debe permitirse',
            'prioridad' => 'baja',
        ])->assertStatus(422);
    }

    private function crearDocumentoEnRevision(): DocumentoAcademico
    {
        $ctx = $this->crearContextoInstitucional();
        $alumno = Alumno::query()->create([
            'curp' => sprintf('REVI000000HDF%05d', random_int(10000, 99999)),
            'nombre' => 'Alumno',
            'primer_apellido' => 'Revision',
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

    private function crearDocumentoAprobado(): DocumentoAcademico
    {
        $doc = $this->crearDocumentoEnRevision();
        $doc->forceFill(['estado_workflow' => 'aprobado', 'fecha_aprobacion' => now()])->save();

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

        $nivel = NivelAcademico::query()->where('clave', 'LIC')->firstOrFail();

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
