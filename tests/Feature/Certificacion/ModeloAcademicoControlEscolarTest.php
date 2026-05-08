<?php

declare(strict_types=1);

namespace Tests\Feature\Certificacion;

use App\Models\Alumno;
use App\Models\CicloEscolar;
use App\Models\Institucion;
use App\Models\MateriaCursada;
use App\Models\Matricula;
use App\Models\NivelAcademico;
use App\Models\OfertaAcademica;
use App\Models\PlanEstudio;
use App\Models\PlanMateria;
use App\Models\ProgramaEstudio;
use App\Models\Region;
use App\Models\Sede;
use App\Models\Subsistema;
use App\Models\User;
use App\Services\Certificacion\TrayectoriaAcademicaService;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ModeloAcademicoControlEscolarTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    public function test_matricula_puede_tener_varias_inscripciones_por_periodo_semestre(): void
    {
        [$alumno, $oferta, $ciclo] = $this->crearBase();
        $matricula = Matricula::query()->create([
            'alumno_id' => $alumno->id,
            'oferta_academica_id' => $oferta->id,
            'ciclo_escolar_id' => $ciclo->id,
            'matricula' => 'MAT-INS-1',
            'estado' => 'activa',
        ]);

        $a = \App\Models\InscripcionPeriodo::query()->create([
            'matricula_id' => $matricula->id,
            'ciclo_escolar_id' => $ciclo->id,
            'semestre' => 1,
            'estatus' => 'inscrita',
        ]);
        $b = \App\Models\InscripcionPeriodo::query()->create([
            'matricula_id' => $matricula->id,
            'ciclo_escolar_id' => $ciclo->id,
            'semestre' => 2,
            'estatus' => 'inscrita',
        ]);

        $this->assertNotNull($a->id);
        $this->assertNotNull($b->id);
        $this->assertSame(2, \App\Models\InscripcionPeriodo::query()->where('matricula_id', $matricula->id)->count());
    }

    public function test_genera_carga_academica_desde_plan_materias_al_inscribir(): void
    {
        [$alumno, $oferta, $ciclo] = $this->crearBase();
        $this->crearPlanMaterias((int) $oferta->plan_estudio_id, 1, 3);

        $user = User::factory()->create();
        Role::findOrCreate('superadmin', 'web');
        $user->assignRole('superadmin');
        Sanctum::actingAs($user);

        $matricula = Matricula::query()->create([
            'alumno_id' => $alumno->id,
            'oferta_academica_id' => $oferta->id,
            'ciclo_escolar_id' => $ciclo->id,
            'matricula' => 'MAT-CARGA-1',
            'estado' => 'activa',
        ]);

        $res = $this->postJson('/api/v1/certificacion/inscripciones-periodo', [
            'matricula_id' => $matricula->id,
            'ciclo_escolar_id' => $ciclo->id,
            'semestre' => 1,
            'generar_carga' => true,
        ])->assertCreated();

        $this->assertSame(3, (int) $res->json('carga_academica.total'));
    }

    public function test_control_escolar_no_captura_materia_libre_si_existe_plan_materia(): void
    {
        [$alumno, $oferta, $ciclo] = $this->crearBase();
        $this->crearPlanMaterias((int) $oferta->plan_estudio_id, 1, 1);

        $user = User::factory()->create();
        Role::findOrCreate('superadmin', 'web');
        $user->assignRole('superadmin');
        Sanctum::actingAs($user);

        $matricula = Matricula::query()->create([
            'alumno_id' => $alumno->id,
            'oferta_academica_id' => $oferta->id,
            'ciclo_escolar_id' => $ciclo->id,
            'matricula' => 'MAT-NOFREE-1',
            'estado' => 'activa',
        ]);

        $this->postJson('/api/v1/certificacion/materias-cursadas', [
            'alumno_id' => $alumno->id,
            'matricula_id' => $matricula->id,
            'ciclo_escolar_id' => $ciclo->id,
            'semestre' => 1,
            'clave' => 'FREE001',
            'nombre' => 'Captura Libre',
            'calificacion' => 8,
        ])->assertStatus(422);
    }

    public function test_materias_cursadas_hereda_datos_de_plan_materia(): void
    {
        [$alumno, $oferta, $ciclo] = $this->crearBase();
        $planMateria = $this->crearPlanMaterias((int) $oferta->plan_estudio_id, 1, 1)->first();

        $user = User::factory()->create();
        Role::findOrCreate('superadmin', 'web');
        $user->assignRole('superadmin');
        Sanctum::actingAs($user);

        $matricula = Matricula::query()->create([
            'alumno_id' => $alumno->id,
            'oferta_academica_id' => $oferta->id,
            'ciclo_escolar_id' => $ciclo->id,
            'matricula' => 'MAT-HEREDA-1',
            'estado' => 'activa',
        ]);

        $this->postJson('/api/v1/certificacion/materias-cursadas', [
            'alumno_id' => $alumno->id,
            'matricula_id' => $matricula->id,
            'ciclo_escolar_id' => $ciclo->id,
            'plan_materia_id' => $planMateria->id,
            'calificacion' => 9,
        ])->assertCreated();

        $materia = MateriaCursada::query()->latest('id')->firstOrFail();
        $this->assertSame($planMateria->clave_materia, $materia->clave);
        $this->assertSame($planMateria->nombre_materia, $materia->nombre);
        $this->assertSame($planMateria->semestre, $materia->semestre);
        $this->assertSame($planMateria->creditos, $materia->creditos);
        $this->assertSame($planMateria->orden, $materia->orden);
    }

    public function test_trayectoria_se_calcula_contra_plan_materias(): void
    {
        [$alumno, $oferta, $ciclo] = $this->crearBase();
        $this->crearPlanMaterias((int) $oferta->plan_estudio_id, 1, 2);

        $matricula = Matricula::query()->create([
            'alumno_id' => $alumno->id,
            'oferta_academica_id' => $oferta->id,
            'ciclo_escolar_id' => $ciclo->id,
            'matricula' => 'MAT-TRAY-1',
            'estado' => 'activa',
        ]);

        MateriaCursada::query()->create([
            'alumno_id' => $alumno->id,
            'matricula_id' => $matricula->id,
            'ciclo_escolar_id' => $ciclo->id,
            'clave' => 'PM101',
            'nombre' => 'Materia 1',
            'semestre' => 1,
            'creditos' => 5,
            'calificacion' => 8,
            'estado' => 'acreditada',
        ]);

        $srv = app(TrayectoriaAcademicaService::class);
        $res = $srv->sincronizarDesdeMaterias($matricula);
        $tray = $res['trayectoria'];
        $this->assertSame(2, (int) $tray->asignaturas_total);
        $this->assertSame(1, (int) $tray->asignaturas_cursadas);
    }

    /**
     * @return array{0: Alumno, 1: OfertaAcademica, 2: CicloEscolar}
     */
    protected function crearBase(): array
    {
        $suffix = substr(str_replace('.', '', uniqid('', true)), -6);
        $subsistema = Subsistema::query()->where('clave', 'NORMAL')->firstOrFail();
        $region = Region::query()->create([
            'subsistema_id' => $subsistema->id,
            'clave' => 'REG'.$suffix,
            'nombre' => 'Region Test',
            'activo' => true,
        ]);
        $institucion = Institucion::query()->create([
            'subsistema_id' => $subsistema->id,
            'region_id' => $region->id,
            'clave' => 'INS'.$suffix,
            'nombre' => 'Institucion Test',
            'activo' => true,
        ]);
        $sede = Sede::query()->create([
            'institucion_id' => $institucion->id,
            'region_id' => $region->id,
            'clave' => 'SED'.$suffix,
            'nombre' => 'Sede Test',
            'activo' => true,
        ]);
        $nivel = NivelAcademico::query()->create([
            'clave' => 'NIV'.$suffix,
            'nombre' => 'Nivel Test',
            'activo' => true,
        ]);
        $programa = ProgramaEstudio::query()->create([
            'nivel_academico_id' => $nivel->id,
            'clave' => 'PRO'.$suffix,
            'nombre' => 'Programa Test',
            'activo' => true,
        ]);
        $plan = PlanEstudio::query()->create([
            'programa_estudio_id' => $programa->id,
            'clave' => 'PLA'.$suffix,
            'nombre' => 'Plan Test',
            'activo' => true,
        ]);
        $ciclo = CicloEscolar::query()->create([
            'clave' => 'CIC'.$suffix,
            'nombre' => 'Ciclo test',
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
            'clave' => 'OFE'.$suffix,
            'modalidad' => 'escolarizada',
            'activo' => true,
        ]);
        $alumno = Alumno::query()->create([
            'curp' => 'AAAA000000HDFABC12',
            'nombre' => 'Ana',
            'primer_apellido' => 'Lopez',
        ]);

        return [$alumno, $oferta, $ciclo];
    }

    /**
     * @return \Illuminate\Support\Collection<int, PlanMateria>
     */
    protected function crearPlanMaterias(int $planId, int $semestre, int $cuantas)
    {
        $items = collect();
        for ($i = 1; $i <= $cuantas; $i++) {
            $items->push(
                PlanMateria::query()->create([
                    'plan_estudio_id' => $planId,
                    'clave_materia' => 'PM'.$semestre.$i.'01',
                    'nombre_materia' => 'Materia '.$i,
                    'semestre' => $semestre,
                    'orden' => $i,
                    'creditos' => 5,
                    'obligatoria' => true,
                    'estatus' => 'activa',
                ])
            );
        }

        return $items;
    }
}
