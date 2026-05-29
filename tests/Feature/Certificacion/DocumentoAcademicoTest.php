<?php

declare(strict_types=1);

namespace Tests\Feature\Certificacion;

use App\Enums\Certificacion\EstadoWorkflow;
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
use App\Services\DocumentosAcademicos\DocumentoAcademicoSolicitudActivaService;
use App\Services\DocumentosAcademicos\DocumentoAcademicoTipoService;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class DocumentoAcademicoTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    public function test_control_escolar_puede_solicitar_documento_permitido_normal(): void
    {
        $ctx = $this->crearContextoInstitucional();
        $ids = $this->crearAlumnoMatriculaTrayectoria($ctx);
        Sanctum::actingAs($this->usuarioControlEscolar($ctx));

        $resp = $this->postDocumento($ctx, $ids, 'certificado');
        $resp->assertCreated();
        $this->assertSame('borrador', $resp->json('data.estado_workflow'));
        $this->assertSame('solicitado_control_escolar', $resp->json('data.metadata.etapa_institucional'));
    }

    public function test_control_escolar_puede_solicitar_documento_permitido_upn(): void
    {
        $ctx = $this->crearContextoInstitucionalUpn();
        $ids = $this->crearAlumnoMatriculaTrayectoria($ctx);
        Sanctum::actingAs($this->usuarioControlEscolar($ctx));

        $this->postDocumento($ctx, $ids, 'certificado')->assertCreated();
    }

    public function test_rechaza_tipo_documental_inexistente(): void
    {
        Sanctum::actingAs($this->usuarioSuperadmin());
        $ctx = $this->crearContextoInstitucional();
        $ids = $this->crearAlumnoMatriculaTrayectoria($ctx);

        $resp = $this->postDocumento($ctx, $ids, 'diploma_falso_xyz');
        $resp->assertStatus(422);
        $this->assertStringContainsString('catálogo institucional', (string) ($resp->json('errors.tipo_documento.0') ?? ''));
    }

    public function test_rechaza_tipo_no_permitido_para_subsistema(): void
    {
        Sanctum::actingAs($this->usuarioSuperadmin());
        $ctx = $this->crearContextoInstitucionalUpn();
        $ids = $this->crearAlumnoMatriculaTrayectoria($ctx);

        $resp = $this->postDocumento($ctx, $ids, 'certificado_terminal');
        $resp->assertStatus(422);
        $this->assertStringContainsString('no está permitido para este subsistema', (string) ($resp->json('errors.tipo_documento.0') ?? ''));
    }

    public function test_rechaza_duplicado_activo_mismo_alumno_matricula_tipo_ciclo(): void
    {
        Sanctum::actingAs($this->usuarioSuperadmin());
        $ctx = $this->crearContextoInstitucional();
        $ids = $this->crearAlumnoMatriculaTrayectoria($ctx);

        $this->postDocumento($ctx, $ids, 'certificado')->assertCreated();
        $dup = $this->postDocumento($ctx, $ids, 'certificado');
        $dup->assertStatus(422);
        $mensaje = (string) ($dup->json('errors.documento.0') ?? '');
        $this->assertStringContainsString('documento activo', $mensaje);
    }

    public function test_permite_nueva_solicitud_si_anterior_esta_rechazado(): void
    {
        Sanctum::actingAs($this->usuarioSuperadmin());
        $ctx = $this->crearContextoInstitucional();
        $ids = $this->crearAlumnoMatriculaTrayectoria($ctx);

        $primero = $this->postDocumento($ctx, $ids, 'certificado')->assertCreated();
        DocumentoAcademico::query()->whereKey($primero->json('data.id'))->update([
            'estado_workflow' => EstadoWorkflow::RECHAZADO->value,
        ]);

        $this->postDocumento($ctx, $ids, 'certificado')->assertCreated();
    }

    public function test_respuesta_incluye_capacidades_documento(): void
    {
        Sanctum::actingAs($this->usuarioSuperadmin());
        $ctx = $this->crearContextoInstitucional();
        $ids = $this->crearAlumnoMatriculaTrayectoria($ctx);

        $resp = $this->postDocumento($ctx, $ids, 'certificado');
        $resp->assertCreated();
        $cap = $resp->json('data.capacidades_documento');
        $this->assertIsArray($cap);
        $this->assertArrayHasKey('requiere_payload_json', $cap);
        $this->assertArrayHasKey('pipeline_key', $cap);
        $this->assertTrue($cap['requiere_payload_json']);
    }

    public function test_no_permite_cambio_tipo_fuera_de_captura_inicial(): void
    {
        $tipos = app(DocumentoAcademicoTipoService::class);

        $this->assertTrue($tipos->documentoPermiteCambioTipoDocumento(
            new DocumentoAcademico(['estado_workflow' => EstadoWorkflow::BORRADOR->value]),
        ));
        $this->assertFalse($tipos->documentoPermiteCambioTipoDocumento(
            new DocumentoAcademico(['estado_workflow' => EstadoWorkflow::PENDIENTE->value]),
        ));
        $this->assertFalse($tipos->documentoPermiteCambioTipoDocumento(
            new DocumentoAcademico(['estado_workflow' => EstadoWorkflow::EN_REVISION->value]),
        ));
    }

    public function test_servicio_duplicados_expone_mensaje_institucional(): void
    {
        $this->assertStringContainsString(
            'expediente',
            DocumentoAcademicoSolicitudActivaService::MENSAJE_DUPLICADO_ACTIVO,
        );
    }

    /**
     * @param  array<string, int>  $ctx
     * @param  array{alumno_id: int, matricula_id: int}  $ids
     */
    private function postDocumento(array $ctx, array $ids, string $tipo): \Illuminate\Testing\TestResponse
    {
        return $this->postJson('/api/v1/certificacion/documentos-academicos', array_merge($ids, [
            'ciclo_escolar_id' => $ctx['ciclo_escolar_id'],
            'subsistema_id' => $ctx['subsistema_id'],
            'region_id' => $ctx['region_id'],
            'institucion_id' => $ctx['institucion_id'],
            'sede_id' => $ctx['sede_id'],
            'oferta_academica_id' => $ctx['oferta_academica_id'],
            'tipo_documento' => $tipo,
        ]));
    }

    private function usuarioSuperadmin(): User
    {
        $u = User::factory()->create();
        Role::findOrCreate('superadmin', 'web');
        $u->assignRole('superadmin');

        return $u;
    }

    /**
     * @param  array{sede_id: int}  $ctx
     */
    private function usuarioControlEscolar(array $ctx): User
    {
        $u = User::factory()->create();
        Role::findOrCreate('control_escolar_escuela', 'web');
        $u->assignRole('control_escolar_escuela');
        $u->sedes()->attach($ctx['sede_id']);

        return $u;
    }

    /**
     * @param  array<string, int>  $ctx
     * @return array{alumno_id: int, matricula_id: int}
     */
    private function crearAlumnoMatriculaTrayectoria(array $ctx): array
    {
        Sanctum::actingAs($this->usuarioSuperadmin());

        $curp = sprintf('CCCC000000HDF%05d', random_int(10000, 99999));
        $alumnoId = $this->postJson('/api/v1/certificacion/alumnos', [
            'curp' => $curp,
            'nombre' => 'Test',
            'primer_apellido' => 'Catalogo',
        ])->assertCreated()->json('data.id');

        $matriculaId = $this->postJson('/api/v1/certificacion/matriculas', [
            'alumno_id' => $alumnoId,
            'oferta_academica_id' => $ctx['oferta_academica_id'],
            'ciclo_escolar_id' => $ctx['ciclo_escolar_id'],
            'matricula' => 'MAT-CAT-'.substr(str_replace('.', '', uniqid('', true)), 0, 10),
            'estado' => 'activa',
        ])->assertCreated()->json('data.id');

        $this->postJson('/api/v1/certificacion/materias-cursadas', [
            'alumno_id' => $alumnoId,
            'matricula_id' => $matriculaId,
            'ciclo_escolar_id' => $ctx['ciclo_escolar_id'],
            'clave' => 'MATCAT',
            'nombre' => 'Materia catálogo',
            'calificacion' => 8,
            'creditos' => 4,
            'semestre' => 1,
            'tipo_periodo_curricular' => 'semestre',
            'numero_periodo_curricular' => 1,
            'periodo' => '2024-2025',
        ])->assertCreated();

        $this->putJson('/api/v1/certificacion/trayectorias-academicas', [
            'alumno_id' => $alumnoId,
            'matricula_id' => $matriculaId,
            'promedio' => 8.5,
            'total_materias' => 1,
            'materias_aprobadas' => 1,
            'estado' => 'activa',
        ])->assertSuccessful();

        return ['alumno_id' => $alumnoId, 'matricula_id' => $matriculaId];
    }

    /**
     * @return array{
     *     subsistema_id: int,
     *     region_id: int,
     *     institucion_id: int,
     *     sede_id: int,
     *     oferta_academica_id: int,
     *     ciclo_escolar_id: int
     * }
     */
    protected function crearContextoInstitucional(): array
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

    /**
     * @return array{
     *     subsistema_id: int,
     *     region_id: int,
     *     institucion_id: int,
     *     sede_id: int,
     *     oferta_academica_id: int,
     *     ciclo_escolar_id: int
     * }
     */
    protected function crearContextoInstitucionalUpn(): array
    {
        $suf = substr(str_replace('.', '', uniqid('', true)), 0, 10);

        $subsistema = Subsistema::query()->updateOrCreate(
            ['clave' => 'UPN'],
            ['nombre' => 'UPN', 'nombre_corto' => 'UPN', 'activo' => true],
        );

        $region = Region::query()->create([
            'subsistema_id' => $subsistema->id,
            'clave' => 'REG-UPN-'.$suf,
            'nombre' => 'Región UPN',
            'activo' => true,
        ]);

        $institucion = Institucion::query()->create([
            'subsistema_id' => $subsistema->id,
            'region_id' => $region->id,
            'clave' => 'INS-UPN-'.$suf,
            'nombre' => 'Institución UPN',
            'activo' => true,
        ]);

        $sede = Sede::query()->create([
            'institucion_id' => $institucion->id,
            'region_id' => $region->id,
            'clave' => 'SED-UPN-'.$suf,
            'nombre' => 'Sede UPN',
            'activo' => true,
        ]);

        $nivel = NivelAcademico::query()->where('clave', 'LIC')->firstOrFail();

        $programa = ProgramaEstudio::query()->create([
            'nivel_academico_id' => $nivel->id,
            'subsistema_id' => $subsistema->id,
            'clave' => 'PROG-UPN-'.$suf,
            'nombre' => 'Programa UPN',
            'activo' => true,
        ]);

        $plan = PlanEstudio::query()->create([
            'programa_estudio_id' => $programa->id,
            'subsistema_id' => $subsistema->id,
            'clave' => 'PLAN-UPN-'.$suf,
            'nombre' => 'Plan UPN',
            'activo' => true,
        ]);

        $ciclo = CicloEscolar::query()->create([
            'clave' => 'CIC-UPN-'.$suf,
            'nombre' => 'Ciclo UPN',
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
            'clave' => 'OFA-UPN-'.$suf,
            'modalidad' => 'escolarizada',
            'metadata' => ['modalidad_upn' => 'presencial'],
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
