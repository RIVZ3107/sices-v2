<?php

declare(strict_types=1);

namespace Tests\Feature\Certificacion;

use App\Models\Alumno;
use App\Models\CicloEscolar;
use App\Models\Institucion;
use App\Models\NivelAcademico;
use App\Models\OfertaAcademica;
use App\Models\PlanEstudio;
use App\Models\ProgramaEstudio;
use App\Models\Region;
use App\Models\Sede;
use App\Models\Subsistema;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class MatriculaUnicaRestriccionFisicaTest extends TestCase
{
    use RefreshDatabase;

    public function test_no_permite_insertar_clave_matricula_duplicada_global(): void
    {
        $ctx = $this->crearContexto();

        $alumno = Alumno::query()->create([
            'curp' => 'AAAA000000HDFABC12',
            'nombre' => 'Ana',
            'primer_apellido' => 'Lopez',
        ]);

        DB::table('matriculas')->insert([
            'alumno_id' => $alumno->id,
            'oferta_academica_id' => $ctx['oferta']->id,
            'ciclo_escolar_id' => $ctx['ciclo']->id,
            'matricula' => 'MAT-1',
            'estado' => 'activa',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $otroAlumno = Alumno::query()->create([
            'curp' => 'BBBB000000HDFABC12',
            'nombre' => 'Beto',
            'primer_apellido' => 'Lopez',
        ]);

        $this->expectException(QueryException::class);
        DB::table('matriculas')->insert([
            'alumno_id' => $otroAlumno->id,
            'oferta_academica_id' => $ctx['oferta']->id,
            'ciclo_escolar_id' => $ctx['ciclo']->id,
            'matricula' => 'MAT-1',
            'estado' => 'activa',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * @return array{oferta:OfertaAcademica,ciclo:CicloEscolar}
     */
    private function crearContexto(): array
    {
        $suffix = substr(str_replace('.', '', uniqid('', true)), -6);
        $subsistema = Subsistema::query()->updateOrCreate(
            ['clave' => 'NORMAL'],
            ['nombre' => 'Educación Normal', 'nombre_corto' => 'Normal', 'activo' => true],
        );
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
            'clave' => 'N'.$suffix,
            'nombre' => 'Nivel Test',
            'activo' => true,
        ]);
        $programa = ProgramaEstudio::query()->create([
            'nivel_academico_id' => $nivel->id,
            'clave' => 'P'.$suffix,
            'nombre' => 'Programa Test',
            'activo' => true,
        ]);
        $plan = PlanEstudio::query()->create([
            'programa_estudio_id' => $programa->id,
            'clave' => 'L'.$suffix,
            'nombre' => 'Plan Test',
            'activo' => true,
        ]);
        $ciclo = CicloEscolar::query()->create([
            'clave' => 'C'.$suffix,
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
            'clave' => 'O'.$suffix,
            'modalidad' => 'escolarizada',
            'activo' => true,
        ]);

        return ['oferta' => $oferta, 'ciclo' => $ciclo];
    }
}
