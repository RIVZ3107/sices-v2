<?php

declare(strict_types=1);

namespace Tests\Feature\Certificacion;

use App\Enums\Certificacion\EstadoWorkflow;
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
use App\Services\DocumentosAcademicos\DocumentoAcademicoWorkflowService;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class DocumentoAcademicoWorkflowTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    public function test_control_escolar_puede_enviar_solicitud_a_validacion(): void
    {
        $ctx = $this->crearContextoInstitucional();
        $doc = $this->crearDocumentoBorradorCe($ctx);
        $ce = $this->usuarioControlEscolar($ctx);

        $svc = app(DocumentoAcademicoWorkflowService::class);
        $this->assertTrue($svc->puedeTransicionar($doc, 'en_validacion_certificador', $ce));

        Sanctum::actingAs($ce);

        $resp = $this->getJson("/api/v1/certificacion/documentos-academicos/{$doc->id}");
        $resp->assertSuccessful();
        $acciones = collect($resp->json('data.workflow.acciones_permitidas'))->pluck('accion');
        $this->assertTrue($acciones->contains('enviar_validacion'));
    }

    public function test_certificador_puede_validar_documento(): void
    {
        $ctx = $this->crearContextoInstitucional();
        $doc = $this->documentoEnValidacionCertificador($ctx);

        Sanctum::actingAs($this->usuarioCertificador());

        $resp = $this->postJson("/api/v1/certificacion/documentos-academicos/{$doc->id}/validar-informacion", [
            'motivo' => 'Expediente conforme.',
        ]);

        $resp->assertSuccessful();
        $this->assertSame('validado_por_certificador', $resp->json('data.workflow.estado_actual'));
    }

    public function test_certificador_puede_devolver_con_observaciones(): void
    {
        $ctx = $this->crearContextoInstitucional();
        $doc = $this->documentoEnValidacionCertificador($ctx);

        Sanctum::actingAs($this->usuarioCertificador());

        $resp = $this->postJson("/api/v1/certificacion/documentos-academicos/{$doc->id}/rechazar", [
            'motivo' => 'Falta constancia de servicio social.',
        ]);

        $resp->assertSuccessful();
        $this->assertSame('observado_por_certificador', $resp->json('data.workflow.estado_actual'));
    }

    public function test_certificador_no_puede_aprobar_institucionalmente(): void
    {
        $ctx = $this->crearContextoInstitucional();
        $doc = $this->documentoValidadoPorCertificador($ctx);

        Sanctum::actingAs($this->usuarioCertificador());

        $this->postJson("/api/v1/certificacion/documentos-academicos/{$doc->id}/aprobar", [
            'motivo' => 'Intento no permitido.',
        ])->assertForbidden();
    }

    public function test_certificador_no_puede_procesar_ni_firmar(): void
    {
        $ctx = $this->crearContextoInstitucional();
        $doc = $this->documentoAprobadoEs($ctx);

        Sanctum::actingAs($this->usuarioCertificador());

        $this->postJson("/api/v1/certificacion/documentos-academicos/{$doc->id}/workflow/transicion", [
            'accion' => 'procesar_certificacion',
            'motivo' => 'Intento procesar.',
        ])->assertStatus(422);

        $this->postJson("/api/v1/certificacion/documentos-academicos/{$doc->id}/workflow/transicion", [
            'accion' => 'firmar_certificado',
        ])->assertStatus(422);
    }

    public function test_educacion_superior_puede_aprobar_documento_validado(): void
    {
        $ctx = $this->crearContextoInstitucional();
        $doc = $this->documentoValidadoPorCertificador($ctx);
        $es = $this->usuarioEducacionSuperior();

        $svc = app(DocumentoAcademicoWorkflowService::class);
        $this->assertTrue($svc->puedeTransicionar($doc, 'aprobado_educacion_superior', $es));

        Sanctum::actingAs($es);

        $show = $this->getJson("/api/v1/certificacion/documentos-academicos/{$doc->id}");
        $show->assertSuccessful();
        $acciones = collect($show->json('data.workflow.acciones_permitidas'))->pluck('accion');
        $this->assertTrue($acciones->contains('aprobar_expediente'));
    }

    public function test_educacion_superior_puede_avanzar_a_procesamiento(): void
    {
        $ctx = $this->crearContextoInstitucional();
        $doc = $this->documentoAprobadoEs($ctx);

        Sanctum::actingAs($this->usuarioEducacionSuperior());

        $resp = $this->postJson("/api/v1/certificacion/documentos-academicos/{$doc->id}/workflow/transicion", [
            'accion' => 'procesar_certificacion',
            'motivo' => 'Inicio procesamiento.',
        ]);

        $resp->assertSuccessful();
        $this->assertContains($resp->json('data.workflow.estado_actual'), [
            'en_procesamiento',
            'pendiente_firma',
        ]);
    }

    public function test_sistemas_puede_tomar_incidencia_tecnica(): void
    {
        $ctx = $this->crearContextoInstitucional();
        $doc = $this->documentoConIncidencia($ctx);

        Sanctum::actingAs($this->usuarioSistemas());

        $resp = $this->postJson("/api/v1/certificacion/documentos-academicos/{$doc->id}/workflow/transicion", [
            'accion' => 'tomar_incidencia',
            'motivo' => 'Diagnóstico iniciado.',
        ]);

        $resp->assertSuccessful();
        $this->assertSame('en_revision_sistemas', $resp->json('data.workflow.estado_actual'));
    }

    public function test_sistemas_no_puede_aprobar_academicamente(): void
    {
        $ctx = $this->crearContextoInstitucional();
        $doc = $this->documentoValidadoPorCertificador($ctx);

        Sanctum::actingAs($this->usuarioSistemas());

        $this->postJson("/api/v1/certificacion/documentos-academicos/{$doc->id}/aprobar", [
            'motivo' => 'Intento sistemas.',
        ])->assertForbidden();
    }

    public function test_transicion_invalida_devuelve_mensaje_institucional(): void
    {
        $ctx = $this->crearContextoInstitucional();
        $doc = $this->crearDocumentoBorradorCe($ctx);

        Sanctum::actingAs($this->usuarioControlEscolar($ctx));

        $resp = $this->postJson("/api/v1/certificacion/documentos-academicos/{$doc->id}/workflow/transicion", [
            'accion' => 'aprobar_expediente',
        ]);

        $resp->assertStatus(422);
        $this->assertStringContainsString(
            DocumentoAcademicoWorkflowService::MENSAJE_TRANSICION_INVALIDA,
            (string) ($resp->json('errors.workflow.0') ?? ''),
        );
    }

    public function test_devolver_observaciones_exige_motivo(): void
    {
        $ctx = $this->crearContextoInstitucional();
        $doc = $this->documentoEnValidacionCertificador($ctx);

        Sanctum::actingAs($this->usuarioCertificador());

        $resp = $this->postJson("/api/v1/certificacion/documentos-academicos/{$doc->id}/rechazar", []);

        $resp->assertStatus(422);
        $this->assertStringContainsString(
            DocumentoAcademicoWorkflowService::MENSAJE_MOTIVO_OBLIGATORIO,
            (string) ($resp->json('errors.motivo.0') ?? ''),
        );
    }

    public function test_show_incluye_workflow_y_acciones(): void
    {
        $ctx = $this->crearContextoInstitucional();
        $doc = $this->documentoEnValidacionCertificador($ctx);

        Sanctum::actingAs($this->usuarioCertificador());

        $resp = $this->getJson("/api/v1/certificacion/documentos-academicos/{$doc->id}");

        $resp->assertSuccessful();
        $this->assertIsArray($resp->json('data.workflow'));
        $this->assertNotEmpty($resp->json('data.workflow.acciones_permitidas'));
    }

    private function crearDocumentoBorradorCe(array $ctx): DocumentoAcademico
    {
        Sanctum::actingAs($this->usuarioSuperadmin());

        $alumno = Alumno::query()->create([
            'curp' => sprintf('WWWW000000HDF%05d', random_int(10000, 99999)),
            'nombre' => 'Alumno',
            'primer_apellido' => 'WF',
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
            'estado_workflow' => EstadoWorkflow::BORRADOR->value,
            'metadata' => [
                'etapa_institucional' => 'solicitado_control_escolar',
                'solicitado_control_escolar' => true,
            ],
        ]);
    }

    private function documentoEnValidacionCertificador(array $ctx): DocumentoAcademico
    {
        $doc = $this->crearDocumentoBorradorCe($ctx);
        $doc->forceFill([
            'estado_workflow' => EstadoWorkflow::EN_REVISION->value,
            'metadata' => array_merge($doc->metadata ?? [], [
                'etapa_institucional' => 'en_validacion_certificador',
            ]),
        ])->save();

        return $doc->refresh();
    }

    private function documentoValidadoPorCertificador(array $ctx): DocumentoAcademico
    {
        $doc = $this->documentoEnValidacionCertificador($ctx);
        $doc->forceFill([
            'metadata' => array_merge($doc->metadata ?? [], [
                'etapa_institucional' => 'validado_por_certificador',
            ]),
        ])->save();

        return $doc->refresh();
    }

    private function documentoAprobadoEs(array $ctx): DocumentoAcademico
    {
        $doc = $this->documentoValidadoPorCertificador($ctx);
        $doc->forceFill([
            'estado_workflow' => EstadoWorkflow::APROBADO->value,
            'fecha_aprobacion' => now(),
            'metadata' => array_merge($doc->metadata ?? [], [
                'etapa_institucional' => 'aprobado_educacion_superior',
            ]),
        ])->save();

        return $doc->refresh();
    }

    private function documentoConIncidencia(array $ctx): DocumentoAcademico
    {
        $doc = $this->documentoAprobadoEs($ctx);
        $doc->forceFill([
            'estado_firma' => 'error_firma',
            'metadata' => array_merge($doc->metadata ?? [], [
                'etapa_institucional' => 'incidencia_tecnica',
            ]),
        ])->save();

        return $doc->refresh();
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

    private function usuarioCertificador(): User
    {
        $u = User::factory()->create();
        Role::findOrCreate('responsable_certificacion_titulacion', 'web');
        $u->assignRole('responsable_certificacion_titulacion');

        return $u;
    }

    private function usuarioEducacionSuperior(): User
    {
        $u = User::factory()->create();
        Role::findOrCreate('educacion_superior', 'web');
        $u->assignRole('educacion_superior');

        return $u;
    }

    private function usuarioSistemas(): User
    {
        $u = User::factory()->create();
        Role::findOrCreate('sistemas', 'web');
        $u->assignRole('sistemas');

        return $u;
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
    private function crearContextoInstitucional(): array
    {
        $suf = substr(str_replace('.', '', uniqid('', true)), 0, 10);

        $subsistema = Subsistema::query()->updateOrCreate(
            ['clave' => 'NORMAL'],
            ['nombre' => 'Educación Normal', 'nombre_corto' => 'Normal', 'activo' => true],
        );

        $region = Region::query()->create([
            'subsistema_id' => $subsistema->id,
            'clave' => 'REG-WF-'.$suf,
            'nombre' => 'Región WF',
            'activo' => true,
        ]);

        $institucion = Institucion::query()->create([
            'subsistema_id' => $subsistema->id,
            'region_id' => $region->id,
            'clave' => 'INS-WF-'.$suf,
            'nombre' => 'Institución WF',
            'activo' => true,
        ]);

        $sede = Sede::query()->create([
            'institucion_id' => $institucion->id,
            'region_id' => $region->id,
            'clave' => 'SED-WF-'.$suf,
            'nombre' => 'Sede WF',
            'activo' => true,
        ]);

        $nivel = NivelAcademico::query()->where('clave', 'LIC')->firstOrFail();

        $programa = ProgramaEstudio::query()->create([
            'nivel_academico_id' => $nivel->id,
            'clave' => 'PROG-WF-'.$suf,
            'nombre' => 'Programa WF',
            'activo' => true,
        ]);

        $plan = PlanEstudio::query()->create([
            'programa_estudio_id' => $programa->id,
            'clave' => 'PLAN-WF-'.$suf,
            'nombre' => 'Plan WF',
            'activo' => true,
        ]);

        $ciclo = CicloEscolar::query()->create([
            'clave' => 'CIC-WF-'.$suf,
            'nombre' => 'Ciclo WF',
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
            'clave' => 'OFA-WF-'.$suf,
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
