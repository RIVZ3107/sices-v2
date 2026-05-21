<?php

declare(strict_types=1);

namespace Tests\Feature\Certificacion;

use App\Models\Alumno;
use App\Models\DocumentoObservacion;
use App\Models\ImportacionHistoricaMaterias;
use App\Models\Institucion;
use App\Models\Matricula;
use App\Models\Municipio;
use App\Models\Sede;
use App\Models\Subsistema;
use App\Models\TrayectoriaAcademica;
use App\Models\User;
use App\Services\ControlEscolar\ResetDemoControlEscolarService;
use Database\Seeders\CertificacionControlEscolarDemoSeeder;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

final class ControlEscolarDemoSeederTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
        $this->seed(CertificacionControlEscolarDemoSeeder::class);
    }

    public function test_seeder_crea_al_menos_50_alumnos_demo_y_curp_unicas(): void
    {
        $this->assertGreaterThanOrEqual(50, Alumno::query()->where('metadata->origen', ResetDemoControlEscolarService::ORIGEN)->count());
        $duplicadosCurp = Alumno::query()
            ->selectRaw('curp, COUNT(*) as c')
            ->where('metadata->origen', ResetDemoControlEscolarService::ORIGEN)
            ->groupBy('curp')
            ->having('c', '>', 1)
            ->count();
        $this->assertSame(0, $duplicadosCurp);
    }

    public function test_matriculas_demo_unicas_y_una_activa_por_alumno(): void
    {
        $dupGlobal = Matricula::query()
            ->whereNull('deleted_at')
            ->whereNotNull('matricula')
            ->whereRaw("TRIM(matricula) <> ''")
            ->groupBy('matricula')
            ->havingRaw('COUNT(*) > 1')
            ->count();
        $this->assertSame(0, $dupGlobal);

        $dupActivas = Matricula::query()
            ->whereNull('deleted_at')
            ->whereIn('estado', ['activa', 'suspendida'])
            ->whereHas('alumno', fn ($q) => $q->where('metadata->origen', ResetDemoControlEscolarService::ORIGEN))
            ->groupBy('alumno_id')
            ->havingRaw('COUNT(*) > 1')
            ->count();
        $this->assertSame(0, $dupActivas);
    }

    public function test_dashboard_y_expedientes_api(): void
    {
        $user = User::query()->where('email', 'control.escolar@sices.local')->firstOrFail();
        Sanctum::actingAs($user);

        $dash = $this->getJson('/api/v1/control-escolar/dashboard');
        $dash->assertOk();
        $metricas = $dash->json('data.metricas');
        $this->assertGreaterThan(0, (int) ($metricas['alumnos_activos'] ?? 0));
        foreach ([
            'matriculas_incompletas',
            'inscripciones_pendientes',
            'cargas_academicas_pendientes',
            'calificaciones_pendientes',
            'importaciones_con_errores',
            'trayectorias_listas_para_certificar',
            'documentos_con_observaciones',
            'solicitudes_en_revision',
        ] as $k) {
            $this->assertGreaterThan(0, (int) ($metricas[$k] ?? 0), 'Métrica '.$k.' debe ser > 0');
        }

        $dist = $dash->json('data.alumnos_distribucion');
        $this->assertSame('escenario_demo', $dist['tipo'] ?? null);
        $this->assertGreaterThanOrEqual(50, (int) ($dist['total'] ?? 0));
        $this->assertNotEmpty($dist['segmentos'] ?? []);
        $this->assertNotEmpty($dash->json('data.procesos_recientes'));

        $alumno = Alumno::query()->where('metadata->origen', ResetDemoControlEscolarService::ORIGEN)->firstOrFail();
        $curp = (string) $alumno->curp;
        $mat = Matricula::query()->where('alumno_id', $alumno->id)->whereNotNull('matricula')->first();

        $r1 = $this->getJson('/api/v1/control-escolar/expedientes?search='.urlencode($curp));
        $r1->assertOk();
        $this->assertNotEmpty($r1->json('data'));

        if ($mat !== null) {
            $r2 = $this->getJson('/api/v1/control-escolar/expedientes?search='.urlencode((string) $mat->matricula));
            $r2->assertOk();
            $this->assertNotEmpty($r2->json('data.listado.data'));
        }

        $ins = $this->getJson('/api/v1/control-escolar/inscripciones');
        $ins->assertOk();
        $this->assertGreaterThan(0, (int) ($ins->json('data.metricas.nuevas') ?? 0));
        $this->assertNotEmpty($ins->json('data.listado.data'));

        $rei = $this->getJson('/api/v1/control-escolar/reinscripciones');
        $rei->assertOk();
        $this->assertArrayHasKey('en_proceso', $rei->json('data.metricas') ?? []);
        $this->assertArrayHasKey('motivos_bloqueo', $rei->json('data') ?? []);

        $tray = $this->getJson('/api/v1/control-escolar/trayectoria');
        $tray->assertOk();
        $this->assertArrayHasKey('historial', $tray->json('data') ?? []);

        $cal = $this->getJson('/api/v1/control-escolar/calificaciones');
        $cal->assertOk();
        $this->assertArrayHasKey('metricas', $cal->json('data') ?? []);
        $this->assertArrayHasKey('grupos', $cal->json('data') ?? []);
        $this->assertArrayHasKey('listado', $cal->json('data') ?? []);

        $doc = $this->getJson('/api/v1/control-escolar/documentos');
        $doc->assertOk();
        $this->assertArrayHasKey('metricas', $doc->json('data') ?? []);
        $this->assertArrayHasKey('plantillas_frecuentes', $doc->json('data') ?? []);
        $this->assertArrayHasKey('listado', $doc->json('data') ?? []);

        $bajas = $this->getJson('/api/v1/control-escolar/bajas-cambios');
        $bajas->assertOk();
        $this->assertArrayHasKey('metricas', $bajas->json('data') ?? []);
        $this->assertArrayHasKey('listado', $bajas->json('data') ?? []);
        $this->assertArrayHasKey('motivos_frecuentes', $bajas->json('data') ?? []);
        $this->assertArrayHasKey('cambios_recientes', $bajas->json('data') ?? []);

        $sol = $this->getJson('/api/v1/control-escolar/solicitudes');
        $sol->assertOk();
        $this->assertArrayHasKey('metricas', $sol->json('data') ?? []);
        $this->assertArrayHasKey('listado', $sol->json('data') ?? []);
        $this->assertArrayHasKey('tipos_solicitud', $sol->json('data') ?? []);
        $this->assertArrayHasKey('comentarios_recientes', $sol->json('data') ?? []);

        $obs = $this->getJson('/api/v1/control-escolar/observaciones');
        $obs->assertOk();
        $this->assertArrayHasKey('metricas', $obs->json('data') ?? []);
        $this->assertArrayHasKey('listado', $obs->json('data') ?? []);
        $this->assertGreaterThan(0, (int) ($obs->json('data.metricas.pendientes') ?? 0));
        $this->assertNotEmpty($obs->json('data.listado.data'));

        $imp = $this->getJson('/api/v1/control-escolar/importaciones');
        $imp->assertOk();
        $this->assertArrayHasKey('metricas', $imp->json('data') ?? []);
        $this->assertArrayHasKey('listado', $imp->json('data') ?? []);
        $this->assertArrayHasKey('errores_frecuentes', $imp->json('data') ?? []);

        $not = $this->getJson('/api/v1/control-escolar/notificaciones');
        $not->assertOk();
        $this->assertArrayHasKey('metricas', $not->json('data') ?? []);
        $this->assertArrayHasKey('listado', $not->json('data') ?? []);
        $this->assertArrayHasKey('categorias', $not->json('data') ?? []);

        $rep = $this->getJson('/api/v1/control-escolar/reportes');
        $rep->assertOk();
        $this->assertArrayHasKey('metricas', $rep->json('data') ?? []);
        $this->assertArrayHasKey('matricula_por_programa', $rep->json('data') ?? []);
        $this->assertArrayHasKey('reportes_frecuentes', $rep->json('data') ?? []);
    }

    public function test_existe_al_menos_un_listo_para_certificar_observacion_e_importacion_error(): void
    {
        $this->assertGreaterThanOrEqual(
            1,
            TrayectoriaAcademica::query()
                ->where('metadata->origen', ResetDemoControlEscolarService::ORIGEN)
                ->whereIn('estado', ['lista_certificacion', 'consolidada'])
                ->count()
        );

        $this->assertGreaterThanOrEqual(
            1,
            DocumentoObservacion::query()
                ->whereHas('documentoAcademico', fn ($q) => $q->where('metadata->origen', ResetDemoControlEscolarService::ORIGEN))
                ->where('estado', 'pendiente')
                ->count()
        );

        $this->assertGreaterThanOrEqual(
            1,
            ImportacionHistoricaMaterias::query()
                ->where('metadata->origen', ResetDemoControlEscolarService::ORIGEN)
                ->where(function ($q): void {
                    $q->where('estado', 'error')
                        ->orWhere('validacion_payload->tiene_bloqueos', true);
                })
                ->count()
        );
    }

    public function test_reset_demo_borra_solo_demo_y_conserva_catalogos(): void
    {
        $nMuni = Municipio::query()->count();
        $nInst = Institucion::query()->count();
        $nSede = Sede::query()->count();
        $nSub = Subsistema::query()->count();

        app(ResetDemoControlEscolarService::class)->ejecutar();

        $this->assertSame(0, Alumno::query()->where('metadata->origen', ResetDemoControlEscolarService::ORIGEN)->count());
        $this->assertSame($nMuni, Municipio::query()->count());
        $this->assertSame($nInst, Institucion::query()->count());
        $this->assertSame($nSede, Sede::query()->count());
        $this->assertSame($nSub, Subsistema::query()->count());
    }

    public function test_comando_reset_en_production_exige_force(): void
    {
        $prev = $this->app['env'];
        try {
            $this->app['env'] = 'production';
            $this->artisan('sices:reset-demo-control-escolar')->assertExitCode(1);
        } finally {
            $this->app['env'] = $prev;
        }
    }
}
