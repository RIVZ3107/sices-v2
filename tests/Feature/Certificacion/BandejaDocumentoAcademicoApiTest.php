<?php

declare(strict_types=1);

namespace Tests\Feature\Certificacion;

use App\Models\Alumno;
use App\Models\CicloEscolar;
use App\Models\DocumentoAcademico;
use App\Models\Institucion;
use App\Models\IntegracionLog;
use App\Models\Matricula;
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

class BandejaDocumentoAcademicoApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    public function test_1_control_escolar_ve_sus_borradores(): void
    {
        [$ctxA, $ctxB] = $this->crearDosContextos();
        $usuario = $this->usuarioConRolYAlcance('control_escolar_escuela', $ctxA);
        Sanctum::actingAs($usuario);

        $docA = $this->crearDocumento($ctxA, 'borrador');
        $this->crearDocumento($ctxB, 'borrador');

        $resp = $this->getJson('/api/v1/certificacion/bandejas/documentos-academicos/borradores');
        $resp->assertOk();
        $ids = collect($resp->json('data'))->pluck('id')->all();
        $this->assertContains($docA->id, $ids);
        $this->assertCount(1, $resp->json('data'));
    }

    public function test_2_control_escolar_no_ve_documentos_de_otra_sede(): void
    {
        [$ctxA, $ctxB] = $this->crearDosContextos();
        $usuario = $this->usuarioConRolYAlcance('control_escolar_escuela', $ctxA);
        Sanctum::actingAs($usuario);

        $docA = $this->crearDocumento($ctxA, 'en_revision', [
            'metadata' => ['etapa_institucional' => 'en_validacion_certificador'],
        ]);
        $this->crearDocumento($ctxB, 'en_revision', [
            'metadata' => ['etapa_institucional' => 'en_validacion_certificador'],
        ]);

        $resp = $this->getJson('/api/v1/certificacion/bandejas/documentos-academicos/en-validacion-certificador');
        $resp->assertOk();
        $ids = collect($resp->json('data'))->pluck('id')->all();
        $this->assertContains($docA->id, $ids);
        $this->assertCount(1, $resp->json('data'));
    }

    public function test_3_educacion_superior_ve_pendientes_revision_de_su_alcance(): void
    {
        [$ctxA, $ctxB] = $this->crearDosContextos();
        $usuario = User::factory()->create();
        $usuario->assignRole('educacion_superior');
        $usuario->regiones()->attach($ctxA['region_id']);
        Sanctum::actingAs($usuario);

        $docA = $this->crearDocumento($ctxA, 'en_revision');
        $this->crearDocumento($ctxB, 'en_revision');

        $resp = $this->getJson('/api/v1/certificacion/bandejas/documentos-academicos/pendientes-revision');
        $resp->assertOk();
        $this->assertSame([$docA->id], collect($resp->json('data'))->pluck('id')->all());
    }

    public function test_4_sistemas_ve_incidencias_tecnicas(): void
    {
        [$ctxA, $ctxB] = $this->crearDosContextos();
        $usuario = User::factory()->create();
        $usuario->assignRole('sistemas');
        Sanctum::actingAs($usuario);

        $incidencia = $this->crearDocumento($ctxA, 'aprobado', [
            'estado_firma' => 'error_firma',
            'metadata' => ['etapa_institucional' => 'incidencia_tecnica'],
        ]);
        $this->crearDocumento($ctxB, 'en_revision', [
            'metadata' => ['etapa_institucional' => 'en_validacion_certificador'],
        ]);

        $resp = $this->getJson('/api/v1/certificacion/bandejas/documentos-academicos/incidencia-tecnica');
        $resp->assertOk();
        $this->assertSame([$incidencia->id], collect($resp->json('data'))->pluck('id')->all());
    }

    public function test_5_sistemas_no_ve_borradores_academicos(): void
    {
        [$ctxA] = $this->crearDosContextos();
        $usuario = User::factory()->create();
        $usuario->assignRole('sistemas');
        Sanctum::actingAs($usuario);
        $this->crearDocumento($ctxA, 'borrador');

        $this->getJson('/api/v1/certificacion/bandejas/documentos-academicos/borradores')
            ->assertOk()
            ->assertJsonCount(0, 'data');
    }

    public function test_6_admin_ve_bandejas_generales(): void
    {
        [$ctxA] = $this->crearDosContextos();
        $usuario = User::factory()->create();
        $usuario->assignRole('admin');
        Sanctum::actingAs($usuario);
        $this->crearDocumento($ctxA, 'aprobado');

        $this->getJson('/api/v1/certificacion/bandejas/documentos-academicos/por-rol')
            ->assertOk()
            ->assertJsonPath('meta.bandejas_disponibles.0', 'borradores');
    }

    public function test_7_superadmin_ve_todo(): void
    {
        [$ctxA, $ctxB] = $this->crearDosContextos();
        $usuario = User::factory()->create();
        $usuario->assignRole('superadmin');
        Sanctum::actingAs($usuario);
        $d1 = $this->crearDocumento($ctxA, 'aprobado');
        $d2 = $this->crearDocumento($ctxB, 'aprobado');

        $resp = $this->getJson('/api/v1/certificacion/bandejas/documentos-academicos/aprobados');
        $resp->assertOk();
        $ids = collect($resp->json('data'))->pluck('id')->all();
        $this->assertContains($d1->id, $ids);
        $this->assertContains($d2->id, $ids);
    }

    public function test_8_filtro_curp_funciona(): void
    {
        [$ctxA] = $this->crearDosContextos();
        $usuario = $this->usuarioAdmin();
        Sanctum::actingAs($usuario);
        $this->crearDocumento($ctxA, 'aprobado', ['alumno_curp' => 'ABCD010101HDFRRR01']);
        $this->crearDocumento($ctxA, 'aprobado', ['alumno_curp' => 'EFGH010101HDFRRR02']);

        $resp = $this->getJson('/api/v1/certificacion/bandejas/documentos-academicos/aprobados?curp=ABCD010101');
        $resp->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_9_filtro_folio_interno_funciona(): void
    {
        [$ctxA] = $this->crearDosContextos();
        Sanctum::actingAs($this->usuarioAdmin());
        $this->crearDocumento($ctxA, 'aprobado', ['folio_interno' => 'FOL-TEST-001']);
        $this->crearDocumento($ctxA, 'aprobado', ['folio_interno' => 'FOL-TEST-999']);

        $this->getJson('/api/v1/certificacion/bandejas/documentos-academicos/aprobados?folio_interno=001')
            ->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_10_filtro_folio_digital_sep_funciona(): void
    {
        [$ctxA] = $this->crearDosContextos();
        Sanctum::actingAs($this->usuarioAdmin());
        $this->crearDocumento($ctxA, 'aprobado', ['folio_digital_sep' => 'SEP-AAA-123']);
        $this->crearDocumento($ctxA, 'aprobado', ['folio_digital_sep' => 'SEP-BBB-456']);

        $this->getJson('/api/v1/certificacion/bandejas/documentos-academicos/aprobados?folio_digital_sep=AAA')
            ->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_11_filtro_token_consulta_publica_funciona(): void
    {
        [$ctxA] = $this->crearDosContextos();
        Sanctum::actingAs($this->usuarioAdmin());
        $this->crearDocumento($ctxA, 'aprobado', ['token_consulta_publica' => 'TOK-ABC-001']);
        $this->crearDocumento($ctxA, 'aprobado', ['token_consulta_publica' => 'TOK-DEF-002']);

        $this->getJson('/api/v1/certificacion/bandejas/documentos-academicos/aprobados?token_consulta_publica=ABC')
            ->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_12_filtro_por_institucion_funciona(): void
    {
        [$ctxA, $ctxB] = $this->crearDosContextos();
        Sanctum::actingAs($this->usuarioAdmin());
        $this->crearDocumento($ctxA, 'aprobado');
        $this->crearDocumento($ctxB, 'aprobado');

        $url = '/api/v1/certificacion/bandejas/documentos-academicos/aprobados?institucion_id='.$ctxA['institucion_id'];
        $this->getJson($url)->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_13_filtro_por_sede_funciona(): void
    {
        [$ctxA, $ctxB] = $this->crearDosContextos();
        Sanctum::actingAs($this->usuarioAdmin());
        $this->crearDocumento($ctxA, 'aprobado');
        $this->crearDocumento($ctxB, 'aprobado');

        $url = '/api/v1/certificacion/bandejas/documentos-academicos/aprobados?sede_id='.$ctxA['sede_id'];
        $this->getJson($url)->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_14_filtro_por_ciclo_escolar_funciona(): void
    {
        [$ctxA, $ctxB] = $this->crearDosContextos();
        Sanctum::actingAs($this->usuarioAdmin());
        $this->crearDocumento($ctxA, 'aprobado');
        $this->crearDocumento($ctxB, 'aprobado');

        $url = '/api/v1/certificacion/bandejas/documentos-academicos/aprobados?ciclo_escolar_id='.$ctxA['ciclo_escolar_id'];
        $this->getJson($url)->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_15_paginacion_funciona(): void
    {
        [$ctxA] = $this->crearDosContextos();
        Sanctum::actingAs($this->usuarioAdmin());
        for ($i = 0; $i < 25; $i++) {
            $this->crearDocumento($ctxA, 'aprobado', ['folio_interno' => 'FOL-PAG-'.$i]);
        }

        $resp = $this->getJson('/api/v1/certificacion/bandejas/documentos-academicos/aprobados?per_page=10');
        $resp->assertOk()->assertJsonPath('meta.per_page', 10)->assertJsonPath('meta.total', 25);
        $this->assertCount(10, $resp->json('data'));
    }

    public function test_16_resumen_devuelve_conteos_correctos(): void
    {
        [$ctxA] = $this->crearDosContextos();
        Sanctum::actingAs($this->usuarioAdmin());
        $this->crearDocumento($ctxA, 'borrador');
        $this->crearDocumento($ctxA, 'aprobado');

        $resp = $this->getJson('/api/v1/certificacion/bandejas/documentos-academicos/resumen');
        $resp->assertOk();
        $this->assertGreaterThanOrEqual(1, (int) ($resp->json('data.borradores') ?? $resp->json('data.solicitado-control-escolar') ?? 0));
        $this->assertGreaterThanOrEqual(1, (int) ($resp->json('data.aprobados') ?? $resp->json('data.aprobado-educacion-superior') ?? 0));
    }

    public function test_17_usuario_sin_permiso_ver_documentos_recibe_403(): void
    {
        [$ctxA] = $this->crearDosContextos();
        $user = User::factory()->create();
        Sanctum::actingAs($user);
        $this->crearDocumento($ctxA, 'aprobado');

        $this->getJson('/api/v1/certificacion/bandejas/documentos-academicos/aprobados')
            ->assertForbidden();
    }

    public function test_18_no_se_llama_since_service_en_bandejas(): void
    {
        [$ctxA] = $this->crearDosContextos();
        Sanctum::actingAs($this->usuarioAdmin());
        $this->crearDocumento($ctxA, 'aprobado');

        $this->getJson('/api/v1/certificacion/bandejas/documentos-academicos/aprobados')->assertOk();
        $this->assertSame(0, IntegracionLog::query()->count());
    }

    public function test_19_no_se_genera_pdf_en_bandejas(): void
    {
        [$ctxA] = $this->crearDosContextos();
        Sanctum::actingAs($this->usuarioAdmin());
        $doc = $this->crearDocumento($ctxA, 'aprobado', ['estado_pdf' => 'no_generado']);

        $this->getJson('/api/v1/certificacion/bandejas/documentos-academicos/aprobados')->assertOk();
        $this->assertSame('no_generado', $doc->fresh()->estado_pdf);
    }

    public function test_20_no_se_toca_jasper_en_bandejas(): void
    {
        [$ctxA] = $this->crearDosContextos();
        Sanctum::actingAs($this->usuarioAdmin());
        $this->crearDocumento($ctxA, 'aprobado');

        $this->getJson('/api/v1/certificacion/bandejas/documentos-academicos/aprobados?q=JASPER')->assertOk();
        $this->assertSame(0, IntegracionLog::query()->count());
    }

    /**
     * @param  array<string, mixed>  $override
     */
    private function crearDocumento(array $ctx, string $estadoWorkflow, array $override = []): DocumentoAcademico
    {
        $alumno = Alumno::query()->create([
            'curp' => $override['alumno_curp'] ?? sprintf('AAAA000000HDF%05d', random_int(10000, 99999)),
            'nombre' => 'Alumno',
            'primer_apellido' => 'Bandeja',
            'segundo_apellido' => 'Test',
        ]);

        $matricula = Matricula::query()->create([
            'alumno_id' => $alumno->id,
            'oferta_academica_id' => $ctx['oferta_academica_id'],
            'ciclo_escolar_id' => $ctx['ciclo_escolar_id'],
            'matricula' => $override['matricula'] ?? 'MAT-'.strtoupper(bin2hex(random_bytes(6))),
            'estado' => 'activa',
        ]);

        return DocumentoAcademico::query()->create(array_merge([
            'alumno_id' => $alumno->id,
            'matricula_id' => $matricula->id,
            'ciclo_escolar_id' => $ctx['ciclo_escolar_id'],
            'oferta_academica_id' => $ctx['oferta_academica_id'],
            'subsistema_id' => $ctx['subsistema_id'],
            'region_id' => $ctx['region_id'],
            'institucion_id' => $ctx['institucion_id'],
            'sede_id' => $ctx['sede_id'],
            'tipo_documento' => 'certificado',
            'tipo_certificacion' => 'total',
            'estado_workflow' => $estadoWorkflow,
            'estado_firma' => 'no_firmado',
            'estado_xml' => 'no_generado',
            'metadata' => [],
        ], $override));
    }

    private function usuarioAdmin(): User
    {
        $u = User::factory()->create();
        $u->assignRole('admin');

        return $u;
    }

    private function usuarioConRolYAlcance(string $rol, array $ctx): User
    {
        $u = User::factory()->create();
        $u->assignRole($rol);
        $u->sedes()->attach($ctx['sede_id']);

        return $u;
    }

    /**
     * @return array{0: array<string, int>, 1: array<string, int>}
     */
    private function crearDosContextos(): array
    {
        return [$this->crearContextoInstitucional('A'), $this->crearContextoInstitucional('B')];
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
