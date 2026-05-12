<?php

declare(strict_types=1);

namespace Tests\Feature\Certificacion;

use App\Models\Alumno;
use App\Models\Institucion;
use App\Models\Matricula;
use App\Models\Municipio;
use App\Models\Sede;
use App\Models\Subsistema;
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

        $alumno = Alumno::query()->where('metadata->origen', ResetDemoControlEscolarService::ORIGEN)->firstOrFail();
        $curp = (string) $alumno->curp;
        $mat = Matricula::query()->where('alumno_id', $alumno->id)->whereNotNull('matricula')->first();

        $r1 = $this->getJson('/api/v1/control-escolar/expedientes?search='.urlencode($curp));
        $r1->assertOk();
        $this->assertNotEmpty($r1->json('data'));

        if ($mat !== null) {
            $r2 = $this->getJson('/api/v1/control-escolar/expedientes?search='.urlencode((string) $mat->matricula));
            $r2->assertOk();
            $this->assertNotEmpty($r2->json('data'));
        }
    }

    public function test_existe_al_menos_un_listo_para_certificar_observacion_e_importacion_error(): void
    {
        $this->assertGreaterThanOrEqual(
            1,
            \App\Models\TrayectoriaAcademica::query()
                ->where('metadata->origen', ResetDemoControlEscolarService::ORIGEN)
                ->whereIn('estado', ['lista_certificacion', 'consolidada'])
                ->count()
        );

        $this->assertGreaterThanOrEqual(
            1,
            \App\Models\DocumentoObservacion::query()
                ->whereHas('documentoAcademico', fn ($q) => $q->where('metadata->origen', ResetDemoControlEscolarService::ORIGEN))
                ->where('estado', 'pendiente')
                ->count()
        );

        $this->assertGreaterThanOrEqual(
            1,
            \App\Models\ImportacionHistoricaMaterias::query()
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
