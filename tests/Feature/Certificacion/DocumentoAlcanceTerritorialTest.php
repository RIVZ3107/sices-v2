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

class DocumentoAlcanceTerritorialTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    public function test_educacion_superior_solo_ve_catalogos_de_su_region(): void
    {
        $ctxPermitido = $this->crearContextoInstitucional('A');
        $ctxFuera = $this->crearContextoInstitucional('B');

        $usuario = User::factory()->create();
        $usuario->assignRole('educacion_superior');
        $usuario->regiones()->attach($ctxPermitido['region_id']);
        Sanctum::actingAs($usuario);

        $resp = $this->getJson('/api/v1/certificacion/catalogos/instituciones');
        $resp->assertOk();

        $ids = collect($resp->json('data'))->pluck('id')->all();
        $this->assertContains($ctxPermitido['institucion_id'], $ids);
        $this->assertNotContains($ctxFuera['institucion_id'], $ids);
    }

    public function test_educacion_superior_no_puede_aprobar_documento_fuera_de_su_alcance(): void
    {
        $ctxPermitido = $this->crearContextoInstitucional('A');
        $ctxFuera = $this->crearContextoInstitucional('B');

        $usuario = User::factory()->create();
        $usuario->assignRole('educacion_superior');
        $usuario->regiones()->attach($ctxPermitido['region_id']);
        Sanctum::actingAs($usuario);

        $documentoPermitido = $this->crearDocumentoEnRevision($ctxPermitido);
        $documentoFuera = $this->crearDocumentoEnRevision($ctxFuera);

        $permitido = $this->postJson("/api/v1/certificacion/documentos-academicos/{$documentoPermitido->id}/aprobar", [
            'motivo' => 'Aprobación dentro de alcance.',
        ]);
        $this->assertNotSame(403, $permitido->status(), 'Documento en alcance no debe bloquear por autorización.');

        $this->postJson("/api/v1/certificacion/documentos-academicos/{$documentoFuera->id}/aprobar", [
            'motivo' => 'Aprobación fuera de alcance.',
        ])->assertForbidden();
    }

    public function test_control_escolar_escuela_con_alcance_por_sede_solo_ve_documentos_de_su_sede(): void
    {
        $ctxPermitido = $this->crearContextoInstitucional('A');
        $ctxFuera = $this->crearContextoInstitucional('B');

        $usuario = User::factory()->create();
        $usuario->assignRole('control_escolar_escuela');
        $usuario->sedes()->attach($ctxPermitido['sede_id']);
        Sanctum::actingAs($usuario);

        $documentoPermitido = $this->crearDocumentoEnRevision($ctxPermitido);
        $documentoFuera = $this->crearDocumentoEnRevision($ctxFuera);

        $this->getJson("/api/v1/certificacion/documentos-academicos/{$documentoPermitido->id}")
            ->assertOk();

        $this->getJson("/api/v1/certificacion/documentos-academicos/{$documentoFuera->id}")
            ->assertForbidden();
    }

    /**
     * @param  array{
     *     subsistema_id: int,
     *     region_id: int,
     *     institucion_id: int,
     *     sede_id: int,
     *     oferta_academica_id: int,
     *     ciclo_escolar_id: int
     * }  $ctx
     */
    private function crearDocumentoEnRevision(array $ctx): DocumentoAcademico
    {
        $alumno = Alumno::query()->create([
            'curp' => sprintf('AAAA000000HDF%05d', random_int(10000, 99999)),
            'nombre' => 'Alumno',
            'primer_apellido' => 'Territorial',
            'segundo_apellido' => 'Prueba',
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
    private function crearContextoInstitucional(string $prefijo): array
    {
        $suf = $prefijo.'-'.substr(str_replace('.', '', uniqid('', true)), 0, 8);

        $subsistema = Subsistema::query()->updateOrCreate(
            ['clave' => 'NORMAL'],
            ['nombre' => 'Educación Normal', 'nombre_corto' => 'Normal', 'activo' => true],
        );

        $region = Region::query()->create([
            'subsistema_id' => $subsistema->id,
            'clave' => 'REG-'.$suf,
            'nombre' => 'Región '.$prefijo,
            'activo' => true,
        ]);

        $institucion = Institucion::query()->create([
            'subsistema_id' => $subsistema->id,
            'region_id' => $region->id,
            'clave' => 'INS-'.$suf,
            'nombre' => 'Institución '.$prefijo,
            'activo' => true,
        ]);

        $sede = Sede::query()->create([
            'institucion_id' => $institucion->id,
            'region_id' => $region->id,
            'clave' => 'SED-'.$suf,
            'nombre' => 'Sede '.$prefijo,
            'activo' => true,
        ]);

        $nivel = NivelAcademico::query()->where('clave', 'LIC')->firstOrFail();

        $programa = ProgramaEstudio::query()->create([
            'nivel_academico_id' => $nivel->id,
            'clave' => 'PROG-'.$suf,
            'nombre' => 'Programa '.$prefijo,
            'activo' => true,
        ]);

        $plan = PlanEstudio::query()->create([
            'programa_estudio_id' => $programa->id,
            'clave' => 'PLAN-'.$suf,
            'nombre' => 'Plan '.$prefijo,
            'activo' => true,
        ]);

        $ciclo = CicloEscolar::query()->create([
            'clave' => 'CIC-'.$suf,
            'nombre' => 'Ciclo '.$prefijo,
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
