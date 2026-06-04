<?php

declare(strict_types=1);

namespace Tests\Feature\Seeders;

use App\Models\Alumno;
use App\Models\CicloEscolar;
use App\Models\NivelAcademico;
use App\Models\ProgramaEstudio;
use App\Models\User;
use App\Services\ControlEscolar\ResetDemoControlEscolarService;
use App\Services\Demo\DemoDataCleanupService;
use App\Services\Demo\DemoSoftDeletedPurgeService;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Support\Facades\DB;
use Database\Seeders\Demo\CertificacionControlEscolarDemoSeeder;
use Database\Seeders\Demo\DemoBundleSeeder;
use Database\Seeders\Demo\DemoUsuariosPorRolSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Tests\TestCase;

final class DemoDataIsolationTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        putenv('ALLOW_DEMO_SEEDERS');
        unset($_ENV['ALLOW_DEMO_SEEDERS'], $_SERVER['ALLOW_DEMO_SEEDERS']);
        parent::tearDown();
    }

    public function test_database_seeder_no_crea_demo_synthetic_sin_allow_demo(): void
    {
        putenv('ALLOW_DEMO_SEEDERS=false');
        $_ENV['ALLOW_DEMO_SEEDERS'] = 'false';

        $this->seed(DatabaseSeeder::class);

        $this->assertSame(0, Alumno::query()->where('nombre', 'DemoSynthetic')->count());
        $this->assertSame(0, User::query()->where('email', 'like', '%@sices.local')->count());
    }

    public function test_demo_seeder_aborta_sin_allow_demo(): void
    {
        putenv('ALLOW_DEMO_SEEDERS=false');
        $_ENV['ALLOW_DEMO_SEEDERS'] = 'false';

        $this->seed(DatabaseSeeder::class);

        $this->expectException(\RuntimeException::class);
        $this->expectExceptionMessage('Los seeders demo están deshabilitados');

        $this->seed(DemoUsuariosPorRolSeeder::class);
    }

    public function test_demo_bundle_solo_corre_con_allow_demo(): void
    {
        putenv('ALLOW_DEMO_SEEDERS=true');
        $_ENV['ALLOW_DEMO_SEEDERS'] = 'true';

        $this->seed(DatabaseSeeder::class);
        $this->seed(CertificacionControlEscolarDemoSeeder::class);

        $this->assertGreaterThan(0, Alumno::query()->where('metadata->origen', ResetDemoControlEscolarService::ORIGEN)->count());
        $this->assertNotNull(User::query()->where('email', 'control.escolar@sices.local')->first());
    }

    public function test_auditar_datos_no_borra_registros(): void
    {
        putenv('ALLOW_DEMO_SEEDERS=true');
        $_ENV['ALLOW_DEMO_SEEDERS'] = 'true';

        $this->seed(DatabaseSeeder::class);
        $this->seed(CertificacionControlEscolarDemoSeeder::class);

        $antes = Alumno::query()->where('metadata->origen', ResetDemoControlEscolarService::ORIGEN)->count();

        Artisan::call('sices:auditar-datos');

        $this->assertSame($antes, Alumno::query()->where('metadata->origen', ResetDemoControlEscolarService::ORIGEN)->count());
        $this->assertStringContainsString('demo_control_escolar', Artisan::output());
    }

    public function test_limpiar_demo_dry_run_no_borra(): void
    {
        putenv('ALLOW_DEMO_SEEDERS=true');
        $_ENV['ALLOW_DEMO_SEEDERS'] = 'true';

        $this->seed(DatabaseSeeder::class);
        $this->seed(CertificacionControlEscolarDemoSeeder::class);

        $antes = Alumno::query()->where('metadata->origen', ResetDemoControlEscolarService::ORIGEN)->count();
        $this->assertGreaterThan(0, $antes);

        Artisan::call('sices:limpiar-demo', ['--dry-run' => true]);

        $this->assertSame($antes, Alumno::query()->where('metadata->origen', ResetDemoControlEscolarService::ORIGEN)->count());
    }

    public function test_limpiar_demo_sin_confirm_no_borra(): void
    {
        putenv('ALLOW_DEMO_SEEDERS=true');
        $_ENV['ALLOW_DEMO_SEEDERS'] = 'true';

        $this->seed(DatabaseSeeder::class);
        $this->seed(CertificacionControlEscolarDemoSeeder::class);

        $antes = Alumno::query()->where('metadata->origen', ResetDemoControlEscolarService::ORIGEN)->count();

        Artisan::call('sices:limpiar-demo');

        $this->assertSame($antes, Alumno::query()->where('metadata->origen', ResetDemoControlEscolarService::ORIGEN)->count());
    }

    public function test_limpiar_demo_confirm_borra_solo_demo(): void
    {
        putenv('ALLOW_DEMO_SEEDERS=true');
        $_ENV['ALLOW_DEMO_SEEDERS'] = 'true';

        $this->seed(DatabaseSeeder::class);
        $this->seed(CertificacionControlEscolarDemoSeeder::class);

        $institucionesAntes = \App\Models\Institucion::query()->count();
        $subsistemasAntes = \App\Models\Subsistema::query()->count();

        Artisan::call('sices:limpiar-demo', ['--confirm' => true]);

        $this->assertSame(0, Alumno::query()->where('metadata->origen', ResetDemoControlEscolarService::ORIGEN)->count());
        $this->assertGreaterThanOrEqual($institucionesAntes, \App\Models\Institucion::query()->count());
        $this->assertGreaterThanOrEqual($subsistemasAntes, \App\Models\Subsistema::query()->count());
    }

    public function test_cleanup_service_plan_coincide_con_scope(): void
    {
        putenv('ALLOW_DEMO_SEEDERS=true');
        $_ENV['ALLOW_DEMO_SEEDERS'] = 'true';

        $this->seed(DatabaseSeeder::class);
        $this->seed(DemoBundleSeeder::class);

        $plan = (new DemoDataCleanupService)->plan(false);

        $this->assertGreaterThan(0, $plan['alumnos_demo']);
    }

    public function test_purge_soft_deleted_dry_run_no_borra(): void
    {
        putenv('ALLOW_DEMO_SEEDERS=true');
        $_ENV['ALLOW_DEMO_SEEDERS'] = 'true';

        $this->seed(DatabaseSeeder::class);
        $this->seed(CertificacionControlEscolarDemoSeeder::class);
        Artisan::call('sices:limpiar-demo', ['--confirm' => true]);

        $trashedAntes = CicloEscolar::onlyTrashed()->where('clave', 'SXCE-DEMO-CICLO-2026')->count();
        $this->assertGreaterThan(0, $trashedAntes);

        Artisan::call('sices:limpiar-demo', ['--purge-soft-deleted' => true, '--dry-run' => true]);

        $this->assertSame($trashedAntes, CicloEscolar::onlyTrashed()->where('clave', 'SXCE-DEMO-CICLO-2026')->count());
    }

    public function test_purge_soft_deleted_sin_confirm_no_borra(): void
    {
        putenv('ALLOW_DEMO_SEEDERS=true');
        $_ENV['ALLOW_DEMO_SEEDERS'] = 'true';

        $this->seed(DatabaseSeeder::class);
        $this->seed(CertificacionControlEscolarDemoSeeder::class);
        Artisan::call('sices:limpiar-demo', ['--confirm' => true]);

        $trashedAntes = CicloEscolar::onlyTrashed()->where('clave', 'SXCE-DEMO-CICLO-2026')->count();

        Artisan::call('sices:limpiar-demo', ['--purge-soft-deleted' => true]);

        $this->assertSame($trashedAntes, CicloEscolar::onlyTrashed()->where('clave', 'SXCE-DEMO-CICLO-2026')->count());
    }

    public function test_purge_soft_deleted_confirm_borra_solo_demo_trashed(): void
    {
        putenv('ALLOW_DEMO_SEEDERS=true');
        $_ENV['ALLOW_DEMO_SEEDERS'] = 'true';

        $this->seed(DatabaseSeeder::class);
        $this->seed(CertificacionControlEscolarDemoSeeder::class);
        Artisan::call('sices:limpiar-demo', ['--confirm' => true]);

        $this->assertGreaterThan(0, CicloEscolar::onlyTrashed()->where('clave', 'SXCE-DEMO-CICLO-2026')->count());

        Artisan::call('sices:limpiar-demo', ['--confirm' => true, '--purge-soft-deleted' => true]);

        $this->assertSame(0, DB::table('ciclos_escolares')->where('clave', 'SXCE-DEMO-CICLO-2026')->count());
        $this->assertSame(0, CicloEscolar::withTrashed()->where('clave', 'SXCE-DEMO-CICLO-2026')->count());
        $this->assertSame(0, Alumno::withTrashed()->where('nombre', 'DemoSynthetic')->count());
    }

    public function test_purge_no_borra_activos_ni_reales_soft_deleted(): void
    {
        putenv('ALLOW_DEMO_SEEDERS=true');
        $_ENV['ALLOW_DEMO_SEEDERS'] = 'true';

        $this->seed(DatabaseSeeder::class);

        $nivel = NivelAcademico::query()->where('clave', 'LIC')->firstOrFail();
        $real = ProgramaEstudio::query()->create([
            'nivel_academico_id' => $nivel->id,
            'clave' => 'PROG-REAL-INST-01',
            'nombre' => 'Licenciatura institucional real',
            'activo' => true,
        ]);
        $real->delete();

        $this->seed(CertificacionControlEscolarDemoSeeder::class);
        Artisan::call('sices:limpiar-demo', ['--confirm' => true]);
        Artisan::call('sices:limpiar-demo', ['--confirm' => true, '--purge-soft-deleted' => true]);

        $this->assertSame(1, ProgramaEstudio::onlyTrashed()->where('clave', 'PROG-REAL-INST-01')->count());
        $this->assertSame(0, ProgramaEstudio::query()->where('clave', 'PROG-REAL-INST-01')->count());
        $this->assertSame(0, ProgramaEstudio::onlyTrashed()->whereIn('clave', ResetDemoControlEscolarService::PROGRAMAS_DEMO_CLAVES)->count());
    }

    public function test_purge_plan_detecta_candidatos_trashed(): void
    {
        putenv('ALLOW_DEMO_SEEDERS=true');
        $_ENV['ALLOW_DEMO_SEEDERS'] = 'true';

        $this->seed(DatabaseSeeder::class);
        $this->seed(CertificacionControlEscolarDemoSeeder::class);
        Artisan::call('sices:limpiar-demo', ['--confirm' => true]);

        $plan = (new DemoSoftDeletedPurgeService)->plan(false);

        $this->assertGreaterThan(0, $plan['ciclos_escolares'] ?? 0);
        $this->assertGreaterThan(0, ($plan['programas_estudio'] ?? 0) + ($plan['planes_estudio'] ?? 0));
    }
}
