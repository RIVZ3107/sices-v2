<?php

declare(strict_types=1);

namespace Tests\Feature\Certificacion;

use App\Models\CicloEscolar;
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
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class DocumentoCapturaApiFlujoTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    public function test_flujo_api_desde_alumno_hasta_listo_para_firma(): void
    {
        $usuario = User::factory()->create();
        Role::findOrCreate('superadmin', 'web');
        $usuario->assignRole('superadmin');
        Sanctum::actingAs($usuario);

        $ctx = $this->crearContextoInstitucional();
        $curp = sprintf('AAAA000000HDF%05d', random_int(10000, 99999));
        $claveMatricula = 'MAT-CAPTURA-'.substr(str_replace('.', '', uniqid('', true)), 0, 12);

        $createAlumno = $this->postJson('/api/v1/certificacion/alumnos', [
            'curp' => $curp,
            'nombre' => 'Ana',
            'primer_apellido' => 'López',
            'segundo_apellido' => 'Ruiz',
        ]);
        $createAlumno->assertCreated();
        $alumnoId = $createAlumno->json('data.id');

        $matriculaResp = $this->postJson('/api/v1/certificacion/matriculas', [
            'alumno_id' => $alumnoId,
            'oferta_academica_id' => $ctx['oferta_academica_id'],
            'ciclo_escolar_id' => $ctx['ciclo_escolar_id'],
            'matricula' => $claveMatricula,
            'estado' => 'activa',
        ]);
        $matriculaResp->assertCreated();
        $matriculaId = $matriculaResp->json('data.id');

        $this->postJson('/api/v1/certificacion/materias-cursadas', [
            'alumno_id' => $alumnoId,
            'matricula_id' => $matriculaId,
            'ciclo_escolar_id' => $ctx['ciclo_escolar_id'],
            'clave' => 'MAT101',
            'nombre' => 'Matemáticas I',
            'calificacion' => 9.5,
            'creditos' => 6,
        ])->assertCreated();

        $this->putJson('/api/v1/certificacion/trayectorias-academicas', [
            'alumno_id' => $alumnoId,
            'matricula_id' => $matriculaId,
            'promedio' => 9.2,
            'total_materias' => 1,
            'materias_aprobadas' => 1,
            'estado' => 'activa',
        ])->assertSuccessful();

        $docResp = $this->postJson('/api/v1/certificacion/documentos-academicos', [
            'alumno_id' => $alumnoId,
            'matricula_id' => $matriculaId,
            'ciclo_escolar_id' => $ctx['ciclo_escolar_id'],
            'subsistema_id' => $ctx['subsistema_id'],
            'region_id' => $ctx['region_id'],
            'institucion_id' => $ctx['institucion_id'],
            'sede_id' => $ctx['sede_id'],
            'tipo_documento' => 'certificado',
        ]);
        $docResp->assertCreated();
        $documentoId = $docResp->json('data.id');

        $this->postJson("/api/v1/certificacion/documentos-academicos/{$documentoId}/validar")
            ->assertOk()
            ->assertJsonPath('data.valido', true);

        $this->postJson("/api/v1/certificacion/documentos-academicos/{$documentoId}/enviar-revision", [
            'motivo' => 'Solicitud de revisión.',
        ])->assertOk();

        $this->postJson("/api/v1/certificacion/documentos-academicos/{$documentoId}/aprobar", [
            'motivo' => 'Datos correctos.',
        ])->assertOk()->assertJsonPath('data.estado_workflow', 'aprobado');

        $folioResp = $this->postJson("/api/v1/certificacion/documentos-academicos/{$documentoId}/folio-interno");
        $folioResp->assertOk();
        $this->assertNotEmpty($folioResp->json('data.folio_interno'));

        $tok = $this->postJson("/api/v1/certificacion/documentos-academicos/{$documentoId}/token-consulta-publica");
        $tok->assertOk();
        $this->assertNotEmpty($tok->json('data.token'));

        $listo = $this->postJson("/api/v1/certificacion/documentos-academicos/{$documentoId}/listo-para-firma");
        $listo->assertOk()->assertJsonPath('data.listo_para_firma', true);
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
