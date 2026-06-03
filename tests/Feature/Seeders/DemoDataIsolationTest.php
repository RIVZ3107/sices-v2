<?php

declare(strict_types=1);

namespace Tests\Feature\Seeders;

use App\Models\Alumno;
use App\Models\User;
use App\Services\ControlEscolar\ResetDemoControlEscolarService;
use App\Services\Demo\DemoDataCleanupService;
use Database\Seeders\DatabaseSeeder;
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
}
