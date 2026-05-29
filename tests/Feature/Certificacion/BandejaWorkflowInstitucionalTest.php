<?php

declare(strict_types=1);

namespace Tests\Feature\Certificacion;

use App\Models\Alumno;
use App\Models\CicloEscolar;
use App\Models\DocumentoAcademico;
use App\Models\Institucion;
use App\Models\Matricula;
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
use Tests\TestCase;

class BandejaWorkflowInstitucionalTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    public function test_bandeja_control_escolar_no_muestra_incidencias_sistemas(): void
    {
        $ctx = $this->crearContexto();
        Sanctum::actingAs($this->usuarioCe($ctx));

        $this->crearDocumento($ctx, 'borrador', ['metadata' => ['etapa_institucional' => 'solicitado_control_escolar']]);
        $inc = $this->crearDocumento($ctx, 'aprobado', [
            'estado_firma' => 'error_firma',
            'metadata' => ['etapa_institucional' => 'incidencia_tecnica'],
        ]);

        $ids = collect($this->getJson('/api/v1/certificacion/bandejas/documentos-academicos/por-rol')->json('data'))
            ->pluck('id');
        $this->assertFalse($ids->contains($inc->id));
    }

    public function test_bandeja_certificador_solo_validacion(): void
    {
        $ctx = $this->crearContexto();
        Sanctum::actingAs($this->usuarioCertificador());

        $enVal = $this->crearDocumento($ctx, 'en_revision', ['metadata' => ['etapa_institucional' => 'en_validacion_certificador']]);
        $aprob = $this->crearDocumento($ctx, 'aprobado', ['metadata' => ['etapa_institucional' => 'aprobado_educacion_superior']]);

        $ids = collect($this->getJson('/api/v1/certificacion/bandejas/documentos-academicos/en-validacion-certificador')->json('data'))
            ->pluck('id');
        $this->assertTrue($ids->contains($enVal->id));
        $this->assertFalse($ids->contains($aprob->id));
    }

    public function test_bandeja_educacion_superior_muestra_validados(): void
    {
        $ctx = $this->crearContexto();
        Sanctum::actingAs($this->usuarioEs());

        $val = $this->crearDocumento($ctx, 'en_revision', ['metadata' => ['etapa_institucional' => 'validado_por_certificador']]);
        $inc = $this->crearDocumento($ctx, 'aprobado', [
            'estado_firma' => 'error_firma',
            'metadata' => ['etapa_institucional' => 'incidencia_tecnica'],
        ]);

        $ids = collect($this->getJson('/api/v1/certificacion/bandejas/documentos-academicos/validado-por-certificador')->json('data'))
            ->pluck('id');
        $this->assertTrue($ids->contains($val->id));
        $this->assertFalse($ids->contains($inc->id));
    }

    public function test_bandeja_sistemas_solo_incidencias(): void
    {
        $ctx = $this->crearContexto();
        Sanctum::actingAs($this->usuarioSistemas());

        $inc = $this->crearDocumento($ctx, 'aprobado', [
            'estado_firma' => 'error_firma',
            'metadata' => ['etapa_institucional' => 'incidencia_tecnica'],
        ]);
        $this->crearDocumento($ctx, 'en_revision', ['metadata' => ['etapa_institucional' => 'en_validacion_certificador']]);

        $ids = collect($this->getJson('/api/v1/certificacion/bandejas/documentos-academicos/incidencia-tecnica')->json('data'))
            ->pluck('id');
        $this->assertSame([$inc->id], $ids->all());
    }

    public function test_listado_incluye_workflow_resumen_coherente(): void
    {
        $ctx = $this->crearContexto();
        Sanctum::actingAs($this->usuarioCertificador());

        $doc = $this->crearDocumento($ctx, 'en_revision', ['metadata' => ['etapa_institucional' => 'en_validacion_certificador']]);

        $row = collect($this->getJson('/api/v1/certificacion/bandejas/documentos-academicos/en-validacion-certificador')->json('data'))
            ->firstWhere('id', $doc->id);
        $this->assertNotNull($row);
        $this->assertSame('en_validacion_certificador', $row['workflow_resumen']['etapa']);
        $acciones = collect($row['workflow_resumen']['acciones_permitidas'])->pluck('accion');
        $this->assertTrue($acciones->contains('validar_informacion'));
        $this->assertFalse($acciones->contains('aprobar_expediente'));
        $this->assertFalse($acciones->contains('procesar_certificacion'));
    }

    public function test_sistemas_workflow_sin_aprobacion_academica(): void
    {
        $ctx = $this->crearContexto();
        $sistemas = $this->usuarioSistemas();
        $doc = $this->crearDocumento($ctx, 'en_revision', ['metadata' => ['etapa_institucional' => 'validado_por_certificador']]);

        $wr = app(DocumentoAcademicoWorkflowService::class)->armarWorkflowResumen($doc->fresh(), $sistemas);
        $acciones = collect($wr['acciones_permitidas'])->pluck('accion');
        $this->assertFalse($acciones->contains('aprobar_expediente'));
        $this->assertFalse($acciones->contains('firmar_certificado'));
    }

    /**
     * @param  array<string, mixed>  $extra
     */
    private function crearDocumento(array $ctx, string $workflow, array $extra = []): DocumentoAcademico
    {
        $alumno = Alumno::query()->create([
            'curp' => sprintf('BW%05d000000HDF%04d', random_int(10000, 99999), random_int(1000, 9999)),
            'nombre' => 'Alumno',
            'primer_apellido' => 'WF',
            'segundo_apellido' => 'Bandeja',
        ]);
        $mat = Matricula::query()->create([
            'alumno_id' => $alumno->id,
            'oferta_academica_id' => $ctx['oferta_academica_id'],
            'ciclo_escolar_id' => $ctx['ciclo_escolar_id'],
            'matricula' => 'MAT-WF-'.random_int(1000, 9999),
            'estado' => 'activa',
        ]);

        return DocumentoAcademico::query()->create(array_merge([
            'alumno_id' => $alumno->id,
            'matricula_id' => $mat->id,
            'ciclo_escolar_id' => $ctx['ciclo_escolar_id'],
            'oferta_academica_id' => $ctx['oferta_academica_id'],
            'subsistema_id' => $ctx['subsistema_id'],
            'region_id' => $ctx['region_id'],
            'institucion_id' => $ctx['institucion_id'],
            'sede_id' => $ctx['sede_id'],
            'tipo_documento' => 'certificado',
            'estado_workflow' => $workflow,
            'estado_firma' => 'no_firmado',
            'metadata' => [],
        ], $extra));
    }

    /**
     * @return array<string, int>
     */
    private function crearContexto(): array
    {
        $suf = substr(uniqid('wf', true), 0, 8);
        $sub = Subsistema::query()->updateOrCreate(['clave' => 'NORMAL'], ['nombre' => 'Normal', 'nombre_corto' => 'N', 'activo' => true]);
        $reg = Region::query()->create(['subsistema_id' => $sub->id, 'clave' => "R-$suf", 'nombre' => 'R', 'activo' => true]);
        $ins = Institucion::query()->create(['subsistema_id' => $sub->id, 'region_id' => $reg->id, 'clave' => "I-$suf", 'nombre' => 'I', 'activo' => true]);
        $sede = Sede::query()->create(['institucion_id' => $ins->id, 'region_id' => $reg->id, 'clave' => "S-$suf", 'nombre' => 'S', 'activo' => true]);
        $nivel = NivelAcademico::query()->where('clave', 'LIC')->firstOrFail();
        $prog = ProgramaEstudio::query()->create(['nivel_academico_id' => $nivel->id, 'clave' => "P-$suf", 'nombre' => 'P', 'activo' => true]);
        $plan = PlanEstudio::query()->create(['programa_estudio_id' => $prog->id, 'clave' => "PL-$suf", 'nombre' => 'PL', 'activo' => true]);
        $ciclo = CicloEscolar::query()->create(['clave' => "C-$suf", 'nombre' => 'C', 'fecha_inicio' => '2024-08-01', 'fecha_fin' => '2025-07-31', 'es_actual' => true, 'activo' => true]);
        $oferta = OfertaAcademica::query()->create([
            'institucion_id' => $ins->id, 'sede_id' => $sede->id, 'programa_estudio_id' => $prog->id,
            'plan_estudio_id' => $plan->id, 'ciclo_escolar_id' => $ciclo->id, 'clave' => "O-$suf", 'modalidad' => 'escolarizada', 'activo' => true,
        ]);

        return [
            'subsistema_id' => $sub->id, 'region_id' => $reg->id, 'institucion_id' => $ins->id,
            'sede_id' => $sede->id, 'oferta_academica_id' => $oferta->id, 'ciclo_escolar_id' => $ciclo->id,
        ];
    }

    /** @param array{sede_id: int} $ctx */
    private function usuarioCe(array $ctx): User
    {
        $u = User::factory()->create();
        $u->assignRole('control_escolar_escuela');
        $u->sedes()->attach($ctx['sede_id']);

        return $u;
    }

    private function usuarioCertificador(): User
    {
        $u = User::factory()->create();
        $u->assignRole('responsable_certificacion_titulacion');

        return $u;
    }

    private function usuarioEs(): User
    {
        $u = User::factory()->create();
        $u->assignRole('educacion_superior');

        return $u;
    }

    private function usuarioSistemas(): User
    {
        $u = User::factory()->create();
        $u->assignRole('sistemas');

        return $u;
    }
}
