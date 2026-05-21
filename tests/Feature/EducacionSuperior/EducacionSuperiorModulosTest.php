<?php

declare(strict_types=1);

namespace Tests\Feature\EducacionSuperior;

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

class EducacionSuperiorModulosTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    private function usuarioEducacionSuperior(): User
    {
        $u = User::factory()->create();
        $u->assignRole('educacion_superior');

        return $u;
    }

    public function test_educacion_superior_ve_catalogos_operativos_sin_legacy_en_sedes(): void
    {
        $u = $this->usuarioEducacionSuperior();
        Sanctum::actingAs($u);

        $this->getJson('/api/v1/certificacion/catalogos/instituciones')->assertOk();
        $this->getJson('/api/v1/certificacion/catalogos/sedes?search=U.P.N.')->assertOk();
        $this->getJson('/api/v1/certificacion/catalogos/programas')->assertOk();
        $this->getJson('/api/v1/certificacion/catalogos/planes-estudio')->assertOk();

        $row = collect($this->getJson('/api/v1/certificacion/catalogos/sedes?search=U.P.N.')->json('data'))->first();
        $this->assertNotNull($row);
        $this->assertArrayNotHasKey('legacy_kcve_subsede', $row);
        $this->assertArrayNotHasKey('legacy_rcve_institucion', $row);
        $this->assertArrayNotHasKey('legacy_rcvect', $row);
    }

    public function test_metricas_ligeras_educacion_superior(): void
    {
        $u = $this->usuarioEducacionSuperior();
        Sanctum::actingAs($u);

        $metricas = $this->getJson('/api/v1/educacion-superior/metricas')->assertOk()->json('data');
        $this->assertArrayHasKey('pendientes_revision', $metricas);
        $this->assertArrayHasKey('instituciones_activas', $metricas);
        $this->assertArrayHasKey('egresados_candidatos', $metricas);
        $this->assertArrayHasKey('solicitudes_matricula_pendientes', $metricas);
    }

    public function test_reportes_oficiales_desde_base_de_datos(): void
    {
        $u = $this->usuarioEducacionSuperior();
        Sanctum::actingAs($u);

        $data = $this->getJson('/api/v1/educacion-superior/reportes-oficiales')
            ->assertOk()
            ->json('data');

        $this->assertArrayHasKey('metricas', $data);
        $this->assertArrayHasKey('reportes', $data);
        $this->assertArrayHasKey('indicadores', $data);
        $this->assertNotEmpty($data['reportes']);
        $this->assertSame('911', $data['reportes'][0]['clave'] ?? null);
        $this->assertArrayHasKey('ultima_generacion', $data['reportes'][0]);
        $this->assertArrayHasKey('responsable', $data['reportes'][0]);
    }

    public function test_dashboard_y_solicitudes_accesibles(): void
    {
        $u = $this->usuarioEducacionSuperior();
        Sanctum::actingAs($u);

        $dash = $this->getJson('/api/v1/dashboard')->assertOk()->json('data');
        $this->assertSame('educacion_superior', $dash['role'] ?? null);
        $payload = $dash['payload'] ?? [];
        $this->assertArrayHasKey('contexto', $payload);
        $this->assertArrayHasKey('metricas', $payload);
        $this->assertArrayHasKey('tabla_solicitudes_matricula', $payload);
        $titles = array_column($payload['cards'] ?? [], 'title');
        $this->assertContains('Programas académicos vigentes', $titles);
        $this->assertContains('Planes de estudio vigentes', $titles);

        $this->getJson('/api/v1/certificacion/solicitudes-matricula')->assertOk();
    }

    public function test_puede_asignar_matricula_y_normativa_certificacion(): void
    {
        $u = $this->usuarioEducacionSuperior();
        $this->assertTrue($u->can('matriculas.asignar') || $u->can('asignar_matricula'));
        $this->assertTrue($u->can('validaciones_normativas.aprobar'));
        $this->assertTrue($u->can('certificacion.autorizar_emision'));
    }

    public function test_no_puede_operacion_tecnica_xml_ni_jobs_ni_menus(): void
    {
        $u = $this->usuarioEducacionSuperior();
        $this->assertFalse($u->can('generar_xml'));
        $this->assertFalse($u->can('xml.generar'));
        $this->assertFalse($u->can('firma.ejecutar'));
        $this->assertFalse($u->can('jobs.ver'));
        $this->assertFalse($u->can('logs.ver'));
        $this->assertFalse($u->can('menus.administrar'));
        $this->assertFalse($u->can('integraciones.configurar'));
    }

    public function test_no_puede_generar_xml_tecnico_sobre_documento(): void
    {
        $u = $this->usuarioEducacionSuperior();
        Sanctum::actingAs($u);

        $documento = $this->crearDocumentoAprobado();

        $this->postJson("/api/v1/certificacion/documentos-academicos/{$documento->id}/dec-normal/xml")
            ->assertForbidden();
    }

    public function test_puede_aprobar_documento_en_revision(): void
    {
        $u = $this->usuarioEducacionSuperior();
        Sanctum::actingAs($u);

        $documento = $this->crearDocumentoEnRevision();

        $res = $this->postJson("/api/v1/certificacion/documentos-academicos/{$documento->id}/aprobar", [
            'motivo' => 'Validación normativa — Educación Superior.',
        ]);
        $this->assertNotSame(403, $res->status(), 'Educación Superior debe poder aprobar con permisos normativos/certificación.');
    }

    public function test_menus_sin_rutas_tecnicas_ni_legacy_operativo(): void
    {
        $u = $this->usuarioEducacionSuperior();
        Sanctum::actingAs($u);

        $tree = $this->getJson('/api/v1/me/menus')->assertOk()->json('data') ?? [];
        $routes = [];
        $labels = [];
        $flatten = static function (array $nodes, array &$routes, array &$labels): void {
            foreach ($nodes as $n) {
                if (! empty($n['route']) && $n['route'] !== '#') {
                    $routes[] = (string) $n['route'];
                }
                if (! empty($n['label'])) {
                    $labels[] = (string) $n['label'];
                }
                if (! empty($n['children']) && is_array($n['children'])) {
                    $flatten($n['children'], $routes, $labels);
                }
            }
        };
        $flatten($tree, $routes, $labels);

        $this->assertContains('/app/educacion-superior/instituciones', $routes);
        $this->assertContains('/app/educacion-superior/sedes', $routes);
        $this->assertContains('Validaciones normativas', $labels);
        $this->assertContains('Sedes / Subsedes', $labels);

        foreach ($routes as $r) {
            $this->assertStringNotContainsString('/app/sistemas', $r);
            $this->assertStringNotContainsString('legacy-normativa', $r);
            $this->assertStringNotContainsString('/app/admin/menus', $r);
            $this->assertStringNotContainsString('/app/auditoria', $r);
        }

        $this->assertStringNotContainsString('Becas', implode('|', $labels));
        $this->assertStringNotContainsString('Infraestructura educativa', implode('|', $labels));
    }

    public function test_instituciones_sin_carreras_genericas_en_catalogo_sembrado(): void
    {
        $u = $this->usuarioEducacionSuperior();
        Sanctum::actingAs($u);

        $nombres = collect($this->getJson('/api/v1/certificacion/catalogos/instituciones')->json('data'))
            ->pluck('nombre')
            ->map(fn ($n) => mb_strtoupper((string) $n))
            ->all();

        $deny = ['UNIVERSIDAD TECNOLÓGICA', 'INSTITUTO TECNOLÓGICO DEL NORTE', 'MONTERREY', 'INGENIERÍA EN SISTEMAS', 'CONTADURÍA', 'DERECHO', 'MERCADOTECNIA'];
        foreach ($deny as $frag) {
            foreach ($nombres as $nom) {
                $this->assertStringNotContainsString($frag, $nom, "Nombre inesperado en catálogo: {$nom}");
            }
        }
    }

    /**
     * @return array{subsistema_id: int, region_id: int, institucion_id: int, sede_id: int, oferta_academica_id: int, ciclo_escolar_id: int}
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
            'subsistema_id' => $subsistema->id,
            'clave' => 'PROG-'.$suf,
            'nombre' => 'Programa prueba',
            'activo' => true,
        ]);

        $plan = PlanEstudio::query()->create([
            'programa_estudio_id' => $programa->id,
            'subsistema_id' => $subsistema->id,
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
}
