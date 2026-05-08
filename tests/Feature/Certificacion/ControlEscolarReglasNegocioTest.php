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

class ControlEscolarReglasNegocioTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    public function test_no_permite_segunda_matricula_mismo_alumno(): void
    {
        $usuario = User::factory()->create();
        Role::findOrCreate('superadmin', 'web');
        $usuario->assignRole('superadmin');
        Sanctum::actingAs($usuario);

        $ctx = $this->crearContextoInstitucional();
        $curp = sprintf('AAAA000000HDF%05d', random_int(10000, 99999));

        $alumnoId = $this->postJson('/api/v1/certificacion/alumnos', [
            'curp' => $curp,
            'nombre' => 'Ana',
            'primer_apellido' => 'López',
        ])->assertCreated()->json('data.id');

        $payloadBase = [
            'alumno_id' => $alumnoId,
            'oferta_academica_id' => $ctx['oferta_academica_id'],
            'ciclo_escolar_id' => $ctx['ciclo_escolar_id'],
            'matricula' => 'MAT-'.substr(str_replace('.', '', uniqid('', true)), 0, 10),
            'estado' => 'activa',
        ];

        $this->postJson('/api/v1/certificacion/matriculas', $payloadBase)->assertCreated();

        $this->postJson('/api/v1/certificacion/matriculas', array_merge($payloadBase, [
            'matricula' => 'MAT-'.substr(str_replace('.', '', uniqid('', true)), 0, 10),
        ]))->assertStatus(422);
    }

    public function test_curp_normalizada_expone_raiz_y_digito_verificador(): void
    {
        $usuario = User::factory()->create();
        Role::findOrCreate('superadmin', 'web');
        $usuario->assignRole('superadmin');
        Sanctum::actingAs($usuario);

        $curp = sprintf('AAAA000000HDF%05d', random_int(10000, 99999));

        $id = $this->postJson('/api/v1/certificacion/alumnos', [
            'curp' => strtolower($curp),
            'nombre' => 'Ana',
            'primer_apellido' => 'López',
        ])->assertCreated()->json('data.id');

        $this->getJson('/api/v1/certificacion/alumnos/'.$id)
            ->assertOk()
            ->assertJsonPath('data.curp', strtoupper($curp))
            ->assertJsonPath('data.curp_raiz', substr(strtoupper($curp), 0, 16))
            ->assertJsonPath('data.curp_digito', substr(strtoupper($curp), 16, 2));
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
