<?php

declare(strict_types=1);

namespace Tests\Feature\Certificacion;

use App\Models\Alumno;
use App\Models\CicloEscolar;
use App\Models\Institucion;
use App\Models\Matricula;
use App\Models\NivelAcademico;
use App\Models\OfertaAcademica;
use App\Models\PlanEstudio;
use App\Models\ProgramaEstudio;
use App\Models\Region;
use App\Models\Sede;
use App\Models\Subsistema;
use App\Services\Certificacion\AcademicRulesResolver;
use App\Services\Certificacion\MatriculaUpnService;
use App\Services\Certificacion\NormalesControlEscolar2022RulesService;
use App\Services\Certificacion\UpnLicenciaturaRulesService;
use App\Support\Certificacion\Profiles\UpnDecProfile;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

final class UpnLicenciaturaRulesTest extends TestCase
{
    use RefreshDatabase;

    private UpnLicenciaturaRulesService $upn;

    private NormalesControlEscolar2022RulesService $normal;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
        $this->upn = app(UpnLicenciaturaRulesService::class);
        $this->normal = app(NormalesControlEscolar2022RulesService::class);
    }

    public function test_upn_no_usa_reglas_normal_2022_en_flags(): void
    {
        $this->assertFalse($this->upn->usaPatronMatriculaEducacionNormal2022());
        $this->assertFalse($this->upn->usaReferenciaInscripcionAnualNormal());
        $this->assertTrue($this->normal->usaPatronMatriculaEducacionNormal2022());
        $this->assertTrue($this->normal->usaReferenciaInscripcionAnualNormal());
    }

    public function test_upn_no_declara_generador_normal_2022(): void
    {
        $this->assertFalse($this->upn->usaPatronMatriculaEducacionNormal2022());
    }

    public function test_upn_modalidades_presencial_semipresencial_en_linea(): void
    {
        $mods = $this->upn->modalidadesOperacionPermitidas();
        $this->assertContains(UpnLicenciaturaRulesService::MOD_PRESENCIAL, $mods);
        $this->assertContains(UpnLicenciaturaRulesService::MOD_SEMIPRESENCIAL, $mods);
        $this->assertContains(UpnLicenciaturaRulesService::MOD_EN_LINEA, $mods);
    }

    public function test_upn_valida_calificacion_entera(): void
    {
        $mat = $this->matriculaUpnMinima();
        $this->expectException(ValidationException::class);
        $this->upn->validarCapturaCalificacion($mat, ['calificacion' => 7.5]);
    }

    public function test_upn_aprueba_con_minimo_6(): void
    {
        $this->assertTrue($this->upn->esCalificacionAcreditada(6));
        $this->assertTrue($this->upn->esCalificacionAcreditada(10));
    }

    public function test_upn_5_no_acreditada(): void
    {
        $this->assertTrue($this->upn->esCalificacionNoAcreditada(5));
        $this->assertFalse($this->upn->esCalificacionAcreditada(5));
    }

    public function test_upn_np_es_no_presentada_sin_error(): void
    {
        $mat = $this->matriculaUpnMinima();
        $this->upn->validarCapturaCalificacion($mat, ['calificacion_texto' => 'N.P.']);
        $this->upn->validarCapturaCalificacion($mat, ['calificacion_texto' => 'NP']);
        $this->assertTrue(true);
    }

    public function test_upn_extraordinarios_maximo_2_sin_autorizacion(): void
    {
        $meta = [
            ['tipo_evaluacion_upn' => 'extraordinaria'],
            ['tipo_evaluacion_upn' => 'extraordinaria'],
            ['tipo_evaluacion_upn' => 'extraordinaria'],
        ];
        $this->expectException(ValidationException::class);
        $this->upn->validarTopeExtraordinarios($meta, false);
    }

    public function test_upn_extraordinarios_hasta_4_con_autorizacion(): void
    {
        $meta = array_fill(0, 4, ['tipo_evaluacion_upn' => 'extraordinaria']);
        $this->upn->validarTopeExtraordinarios($meta, true);
        $this->assertTrue(true);
    }

    public function test_upn_extraordinarios_mas_de_4_siempre_invalido(): void
    {
        $meta = array_fill(0, 5, ['tipo_evaluacion_upn' => 'extraordinaria']);
        $this->expectException(ValidationException::class);
        $this->upn->validarTopeExtraordinarios($meta, true);
    }

    public function test_upn_baja_temporal_maximo_dos_anios(): void
    {
        $this->expectException(ValidationException::class);
        $this->upn->validarBajaTemporalAcumulada(2.1);
    }

    public function test_upn_permanencia_maxima_doble_del_plan(): void
    {
        $ingreso = new \DateTimeImmutable('2020-01-01');
        $ahora = new \DateTimeImmutable('2099-01-01');
        $this->expectException(ValidationException::class);
        $this->upn->validarPermanenciaLicenciatura($ingreso, $ahora, 8);
    }

    public function test_upn_emision_oficial_bloqueada_por_profile(): void
    {
        $this->assertFalse(app(UpnDecProfile::class)->oficialDisponible());
        $msg = $this->upn->mensajeEmisionDocumentalNoDisponible();
        $this->assertNotNull($msg);
        $this->assertStringContainsString('no está configurada', (string) $msg);
    }

    public function test_normal_mantiene_servicio_normales_2022(): void
    {
        $resolved = app(AcademicRulesResolver::class)->forSubsistema('NORMAL');
        $this->assertInstanceOf(NormalesControlEscolar2022RulesService::class, $resolved);
        $this->assertSame('NORMAL', $resolved->claveSubsistema());
    }

    public function test_reglas_globales_matricula_unica_curp_db(): void
    {
        $this->assertTrue(\Illuminate\Support\Facades\Schema::hasColumn('alumnos', 'curp'));
        $this->assertTrue(\Illuminate\Support\Facades\Schema::hasColumn('matriculas', 'matricula'));

        $ctx = $this->crearContextoUpn();
        $alumno = Alumno::query()->create([
            'curp' => sprintf('HINU900101HDF%05d', random_int(10000, 99999)),
            'nombre' => 'Uni',
            'primer_apellido' => 'Prueba',
        ]);
        Matricula::query()->create([
            'alumno_id' => $alumno->id,
            'oferta_academica_id' => $ctx['oferta_id'],
            'ciclo_escolar_id' => $ctx['ciclo_id'],
            'subsistema_id' => $ctx['subsistema_id'],
            'matricula' => 'UPN-UNIC-90001',
            'estado' => 'activa',
        ]);

        $this->expectException(ValidationException::class);
        app(MatriculaUpnService::class)->validarUnicidadGlobal('UPN-UNIC-90001');
    }

    /**
     * @return array{subsistema_id:int, oferta_id:int, ciclo_id:int}
     */
    private function crearContextoUpn(): array
    {
        $subsistema = Subsistema::query()->where('clave', 'UPN')->firstOrFail();
        $suf = substr(str_replace('.', '', uniqid('', true)), -6);
        $region = Region::query()->create([
            'subsistema_id' => $subsistema->id,
            'clave' => 'REGUPN'.$suf,
            'nombre' => 'Region '.$suf,
            'activo' => true,
        ]);
        $institucion = Institucion::query()->create([
            'subsistema_id' => $subsistema->id,
            'region_id' => $region->id,
            'clave' => 'INSUPN'.$suf,
            'nombre' => 'Institucion '.$suf,
            'activo' => true,
        ]);
        $sede = Sede::query()->create([
            'institucion_id' => $institucion->id,
            'region_id' => $region->id,
            'clave' => 'SEDUPN'.$suf,
            'nombre' => 'Sede '.$suf,
            'activo' => true,
        ]);
        $nivel = NivelAcademico::query()->where('clave', 'LIC')->firstOrFail();
        $programa = ProgramaEstudio::query()->create([
            'nivel_academico_id' => $nivel->id,
            'subsistema_id' => $subsistema->id,
            'clave' => 'PROGUPN'.$suf,
            'nombre' => 'Programa '.$suf,
            'activo' => true,
        ]);
        $plan = PlanEstudio::query()->create([
            'programa_estudio_id' => $programa->id,
            'subsistema_id' => $subsistema->id,
            'clave' => 'PLANUPN'.$suf,
            'nombre' => 'Plan '.$suf,
            'activo' => true,
        ]);
        $ciclo = CicloEscolar::query()->create([
            'clave' => 'CICUPN'.$suf,
            'nombre' => 'Ciclo '.$suf,
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
            'clave' => 'OFAUPN'.$suf,
            'modalidad' => 'escolarizada',
            'metadata' => ['modalidad_upn' => 'presencial'],
            'activo' => true,
        ]);

        return ['subsistema_id' => $subsistema->id, 'oferta_id' => $oferta->id, 'ciclo_id' => $ciclo->id];
    }

    private function matriculaUpnMinima(): Matricula
    {
        $ctx = $this->crearContextoUpn();
        $alumno = Alumno::query()->create([
            'curp' => sprintf('HINU900101HDF%05d', random_int(20000, 29999)),
            'nombre' => 'Min',
            'primer_apellido' => 'Mat',
        ]);

        return Matricula::query()->create([
            'alumno_id' => $alumno->id,
            'oferta_academica_id' => $ctx['oferta_id'],
            'ciclo_escolar_id' => $ctx['ciclo_id'],
            'subsistema_id' => $ctx['subsistema_id'],
            'matricula' => 'UPN-MIN-'.random_int(80000, 89999),
            'estado' => 'activa',
        ]);
    }
}
