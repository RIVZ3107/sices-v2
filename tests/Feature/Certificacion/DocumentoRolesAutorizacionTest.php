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
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DocumentoRolesAutorizacionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    public function test_control_escolar_escuela_no_puede_aprobar_documento(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole('control_escolar_escuela');
        Sanctum::actingAs($usuario);

        $documento = $this->crearDocumentoEnRevision();

        $this->postJson("/api/v1/certificacion/documentos-academicos/{$documento->id}/aprobar", [
            'motivo' => 'Intento no permitido por rol.',
        ])->assertForbidden();
    }

    public function test_educacion_superior_puede_ejecutar_aprobacion_sin_bloqueo_de_autorizacion(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole('educacion_superior');
        Sanctum::actingAs($usuario);

        $documento = $this->crearDocumentoEnRevision();

        $resp = $this->postJson("/api/v1/certificacion/documentos-academicos/{$documento->id}/aprobar", [
            'motivo' => 'Revisión institucional.',
        ]);

        $this->assertNotSame(403, $resp->status(), 'Educación Superior no debe ser bloqueado por autorización.');
    }

    public function test_sistemas_no_puede_capturar_materias_y_si_puede_preparar_documento_para_firma(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole('sistemas');
        Sanctum::actingAs($usuario);

        $documento = $this->crearDocumentoAprobado();

        $this->postJson('/api/v1/certificacion/materias-cursadas', [
            'alumno_id' => $documento->alumno_id,
            'matricula_id' => 999999,
            'ciclo_escolar_id' => $documento->ciclo_escolar_id,
            'clave' => 'MAT-ROL-01',
            'nombre' => 'Materia no permitida',
        ])->assertForbidden();

        $resp = $this->postJson("/api/v1/certificacion/documentos-academicos/{$documento->id}/listo-para-firma");
        $this->assertNotSame(403, $resp->status(), 'Sistemas debe tener acceso a preparar documento para firma.');
    }

    private function crearDocumentoEnRevision(): DocumentoAcademico
    {
        $ctx = $this->crearContextoInstitucional();

        $alumno = Alumno::query()->create([
            'curp' => sprintf('AAAA000000HDF%05d', random_int(10000, 99999)),
            'nombre' => 'Alumno',
            'primer_apellido' => 'Prueba',
            'segundo_apellido' => 'Rol',
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
            'estado_workflow' => 'en_revision',
        ]);
    }

    private function crearDocumentoAprobado(): DocumentoAcademico
    {
        $documento = $this->crearDocumentoEnRevision();
        $documento->forceFill(['estado_workflow' => 'aprobado'])->save();

        return $documento->refresh();
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

        $subsistema = Subsistema::query()->create([
            'clave' => 'SUB-'.$suf,
            'nombre' => 'Subsistema prueba',
            'activo' => true,
        ]);

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
}
