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
use Tests\TestCase;

class DocumentoObservacionesApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    public function test_ciclo_observacion_devolucion_correccion_y_reenvio(): void
    {
        $ctx = $this->crearContextoInstitucional();

        $control = User::factory()->create();
        $control->assignRole('control_escolar_escuela');
        $control->sedes()->attach($ctx['sede_id']);

        $revision = User::factory()->create();
        $revision->assignRole('educacion_superior');
        $revision->regiones()->attach($ctx['region_id']);

        Sanctum::actingAs($control);
        $alumno = $this->postJson('/api/v1/certificacion/alumnos', [
            'curp' => sprintf('AAAA000000HDF%05d', random_int(10000, 99999)),
            'nombre' => 'Ana',
            'primer_apellido' => 'López',
        ])->assertCreated()->json('data.id');

        $matricula = $this->postJson('/api/v1/certificacion/matriculas', [
            'alumno_id' => $alumno,
            'oferta_academica_id' => $ctx['oferta_academica_id'],
            'ciclo_escolar_id' => $ctx['ciclo_escolar_id'],
            'matricula' => 'MAT-OBS-'.substr(str_replace('.', '', uniqid('', true)), 0, 8),
            'estado' => 'activa',
        ])->assertCreated()->json('data.id');

        $this->postJson('/api/v1/certificacion/materias-cursadas', [
            'alumno_id' => $alumno,
            'matricula_id' => $matricula,
            'ciclo_escolar_id' => $ctx['ciclo_escolar_id'],
            'clave' => 'MAT101',
            'nombre' => 'Matemáticas',
            'calificacion' => 7.0,
            'semestre' => 1,
            'creditos' => 6,
        ])->assertCreated();

        $this->putJson('/api/v1/certificacion/trayectorias-academicas', [
            'alumno_id' => $alumno,
            'matricula_id' => $matricula,
            'promedio' => 7.0,
            'total_materias' => 1,
            'materias_aprobadas' => 1,
            'estado' => 'activa',
        ])->assertSuccessful();

        $documento = $this->postJson('/api/v1/certificacion/documentos-academicos', [
            'alumno_id' => $alumno,
            'matricula_id' => $matricula,
            'ciclo_escolar_id' => $ctx['ciclo_escolar_id'],
            'subsistema_id' => $ctx['subsistema_id'],
            'region_id' => $ctx['region_id'],
            'institucion_id' => $ctx['institucion_id'],
            'sede_id' => $ctx['sede_id'],
            'tipo_documento' => 'certificado',
        ])->assertCreated()->json('data.id');

        $this->postJson("/api/v1/certificacion/documentos-academicos/{$documento}/enviar-revision")->assertOk();

        Sanctum::actingAs($revision);
        $obs = $this->postJson("/api/v1/certificacion/documentos-academicos/{$documento}/observaciones", [
            'tipo' => 'materias',
            'seccion' => 'calificacion',
            'observacion' => 'Verificar calificación final.',
            'prioridad' => 'alta',
        ])->assertOk()->json('data.id');

        $this->postJson("/api/v1/certificacion/documentos-academicos/{$documento}/devolver-correccion", [
            'motivo' => 'Devuelto por observaciones.',
        ])->assertOk()->assertJsonPath('data.estado_workflow', 'rechazado');

        Sanctum::actingAs($control);
        $this->postJson("/api/v1/certificacion/documentos-academicos/{$documento}/observaciones/{$obs}/atender", [
            'estado' => 'atendida',
            'respuesta' => 'Ajuste realizado y validado.',
        ])->assertOk()->assertJsonPath('data.estado', 'atendida');

        $this->postJson("/api/v1/certificacion/documentos-academicos/{$documento}/enviar-revision")->assertOk();

        Sanctum::actingAs($revision);
        $this->postJson("/api/v1/certificacion/documentos-academicos/{$documento}/aprobar", [
            'motivo' => 'Corrección aprobada.',
        ])->assertOk()->assertJsonPath('data.estado_workflow', 'aprobado');
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
