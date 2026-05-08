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
use App\Services\Certificacion\ValidacionAcademicaDocumentoService;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class SubsistemasNormalUpnReglasAcademicasTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
        $u = User::factory()->create();
        Role::findOrCreate('superadmin', 'web');
        $u->assignRole('superadmin');
        Sanctum::actingAs($u);
    }

    public function test_permite_historial_normal_luego_upn_si_anterior_esta_baja(): void
    {
        $normal = $this->crearContexto('NORMAL');
        $upn = $this->crearContexto('UPN');
        $alumno = Alumno::query()->create([
            'curp' => sprintf('HINU900101HDF%05d', random_int(10000, 99999)),
            'nombre' => 'Ana',
            'primer_apellido' => 'Prueba',
        ]);

        $primera = $this->postJson('/api/v1/certificacion/matriculas', [
            'alumno_id' => $alumno->id,
            'oferta_academica_id' => $normal['oferta_id'],
            'ciclo_escolar_id' => $normal['ciclo_id'],
            'matricula' => 'M-HIS-'.random_int(1000, 9999),
            'estado' => 'baja',
        ])->assertCreated();

        $this->assertNotNull($primera->json('data.id'));

        $this->postJson('/api/v1/certificacion/matriculas', [
            'alumno_id' => $alumno->id,
            'oferta_academica_id' => $upn['oferta_id'],
            'ciclo_escolar_id' => $upn['ciclo_id'],
            'matricula' => 'M-HIS-'.random_int(10000, 19999),
            'estado' => 'activa',
        ])->assertCreated();
    }

    public function test_no_permite_dos_matriculas_activas_para_mismo_alumno(): void
    {
        $normal = $this->crearContexto('NORMAL');
        $upn = $this->crearContexto('UPN');
        $alumno = Alumno::query()->create([
            'curp' => sprintf('HINU900101HDF%05d', random_int(10000, 99999)),
            'nombre' => 'Luis',
            'primer_apellido' => 'Prueba',
        ]);

        $this->postJson('/api/v1/certificacion/matriculas', [
            'alumno_id' => $alumno->id,
            'oferta_academica_id' => $normal['oferta_id'],
            'ciclo_escolar_id' => $normal['ciclo_id'],
            'matricula' => 'M-ACT-'.random_int(20000, 29999),
            'estado' => 'activa',
        ])->assertCreated();

        $this->postJson('/api/v1/certificacion/matriculas', [
            'alumno_id' => $alumno->id,
            'oferta_academica_id' => $upn['oferta_id'],
            'ciclo_escolar_id' => $upn['ciclo_id'],
            'matricula' => 'M-ACT-'.random_int(30000, 39999),
            'estado' => 'suspendida',
        ])->assertStatus(422);
    }

    public function test_no_permite_inscripcion_activa_simultanea_mismo_ciclo(): void
    {
        $normal = $this->crearContexto('NORMAL');
        $upn = $this->crearContexto('UPN');
        $alumno = Alumno::query()->create([
            'curp' => sprintf('HINU900101HDF%05d', random_int(10000, 99999)),
            'nombre' => 'Mario',
            'primer_apellido' => 'Prueba',
        ]);

        $matNormal = Matricula::query()->create([
            'alumno_id' => $alumno->id,
            'oferta_academica_id' => $normal['oferta_id'],
            'ciclo_escolar_id' => $normal['ciclo_id'],
            'subsistema_id' => $normal['subsistema_id'],
            'matricula' => 'M-INS-'.random_int(40000, 49999),
            'estado' => 'activa',
        ]);
        $matUpn = Matricula::query()->create([
            'alumno_id' => $alumno->id,
            'oferta_academica_id' => $upn['oferta_id'],
            'ciclo_escolar_id' => $normal['ciclo_id'],
            'subsistema_id' => $upn['subsistema_id'],
            'matricula' => 'M-INS-'.random_int(50000, 59999),
            'estado' => 'activa',
        ]);

        $this->postJson('/api/v1/certificacion/inscripciones-periodo', [
            'matricula_id' => $matNormal->id,
            'ciclo_escolar_id' => $normal['ciclo_id'],
            'semestre' => 1,
            'estatus' => 'inscrita',
        ])->assertCreated();

        $this->postJson('/api/v1/certificacion/inscripciones-periodo', [
            'matricula_id' => $matUpn->id,
            'ciclo_escolar_id' => $normal['ciclo_id'],
            'semestre' => 1,
            'estatus' => 'cursando',
        ])->assertStatus(422);
    }

    public function test_upn_bloquea_emision_oficial_xml(): void
    {
        $upn = $this->crearContexto('UPN');
        $alumno = Alumno::query()->create([
            'curp' => sprintf('HINU900101HDF%05d', random_int(10000, 99999)),
            'nombre' => 'Eva',
            'primer_apellido' => 'Prueba',
        ]);
        $mat = Matricula::query()->create([
            'alumno_id' => $alumno->id,
            'oferta_academica_id' => $upn['oferta_id'],
            'ciclo_escolar_id' => $upn['ciclo_id'],
            'subsistema_id' => $upn['subsistema_id'],
            'matricula' => 'M-UPN-'.random_int(60000, 69999),
            'estado' => 'activa',
        ]);
        $doc = DocumentoAcademico::query()->create([
            'alumno_id' => $alumno->id,
            'matricula_id' => $mat->id,
            'oferta_academica_id' => $upn['oferta_id'],
            'ciclo_escolar_id' => $upn['ciclo_id'],
            'subsistema_id' => $upn['subsistema_id'],
            'tipo_documento' => 'certificado',
            'estado_workflow' => 'aprobado',
        ]);

        $res = app(ValidacionAcademicaDocumentoService::class)->validarParaGenerarXml($doc);
        $this->assertFalse($res['ok']);
        $joined = implode(' ', $res['errores']);
        $this->assertTrue(
            str_contains($joined, 'UPN') && str_contains($joined, 'configurad'),
            $joined,
        );
    }

    /**
     * @return array{subsistema_id:int, oferta_id:int, ciclo_id:int}
     */
    private function crearContexto(string $claveSubsistema): array
    {
        $subsistema = Subsistema::query()->where('clave', $claveSubsistema)->firstOrFail();
        $suf = substr(str_replace('.', '', uniqid('', true)), -6);
        $region = Region::query()->create([
            'subsistema_id' => $subsistema->id,
            'clave' => 'REG'.$suf,
            'nombre' => 'Region '.$suf,
            'activo' => true,
        ]);
        $institucion = Institucion::query()->create([
            'subsistema_id' => $subsistema->id,
            'region_id' => $region->id,
            'clave' => 'INS'.$suf,
            'nombre' => 'Institucion '.$suf,
            'activo' => true,
        ]);
        $sede = Sede::query()->create([
            'institucion_id' => $institucion->id,
            'region_id' => $region->id,
            'clave' => 'SED'.$suf,
            'nombre' => 'Sede '.$suf,
            'activo' => true,
        ]);
        $nivel = NivelAcademico::query()->where('clave', 'LIC')->firstOrFail();
        $programa = ProgramaEstudio::query()->create([
            'nivel_academico_id' => $nivel->id,
            'subsistema_id' => $subsistema->id,
            'clave' => 'PROG'.$suf,
            'nombre' => 'Programa '.$suf,
            'activo' => true,
        ]);
        $plan = PlanEstudio::query()->create([
            'programa_estudio_id' => $programa->id,
            'subsistema_id' => $subsistema->id,
            'clave' => 'PLAN'.$suf,
            'nombre' => 'Plan '.$suf,
            'activo' => true,
        ]);
        $ciclo = CicloEscolar::query()->create([
            'clave' => 'CIC'.$suf,
            'nombre' => 'Ciclo '.$suf,
            'fecha_inicio' => '2024-08-01',
            'fecha_fin' => '2025-07-31',
            'es_actual' => true,
            'activo' => true,
        ]);
        $ofertaAttrs = [
            'institucion_id' => $institucion->id,
            'sede_id' => $sede->id,
            'programa_estudio_id' => $programa->id,
            'plan_estudio_id' => $plan->id,
            'ciclo_escolar_id' => $ciclo->id,
            'clave' => 'OFA'.$suf,
            'modalidad' => 'escolarizada',
            'activo' => true,
        ];
        if ($claveSubsistema === 'UPN') {
            $ofertaAttrs['metadata'] = ['modalidad_upn' => 'presencial'];
        }
        $oferta = OfertaAcademica::query()->create($ofertaAttrs);

        return ['subsistema_id' => $subsistema->id, 'oferta_id' => $oferta->id, 'ciclo_id' => $ciclo->id];
    }
}
