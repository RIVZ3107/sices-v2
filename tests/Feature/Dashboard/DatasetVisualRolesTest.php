<?php

declare(strict_types=1);

namespace Tests\Feature\Dashboard;

use App\Models\Alumno;
use App\Models\Institucion;
use App\Models\Materia;
use App\Models\Menu;
use App\Models\NivelAcademico;
use App\Models\PlanEstudio;
use App\Models\PlanMateria;
use App\Models\ProgramaEstudio;
use App\Models\SolicitudMatricula;
use App\Models\Subsistema;
use App\Models\User;
use App\Services\DatasetVisualRoles\ResetDatasetVisualRolesService;
use App\Services\DatasetVisualRoles\SeedDatasetVisualRolesService;
use App\Support\DatasetVisualRolesMetadata;
use Database\Seeders\EntidadFederativaSeeder;
use Database\Seeders\MunicipioSeeder;
use Database\Seeders\NivelAcademicoSeeder;
use Database\Seeders\RolesAndPermissionsSeeder;
use Database\Seeders\SubsistemasSeeder;
use Database\Seeders\SystemMenusSeeder;
use Database\Seeders\Catalogos\InstitucionesLegacyBaseSeeder;
use Database\Seeders\Catalogos\InstitucionesSedesInicialSeeder;
use Database\Seeders\Catalogos\InstitucionesSubsedesLegacySeeder;
use Database\Seeders\Sistema\ConfiguracionVisualSistemaSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Symfony\Component\Process\Process;
use Tests\TestCase;

class DatasetVisualRolesTest extends TestCase
{
    use RefreshDatabase;

    /** @var array<string, string> rol => email (debe coincidir con SeedDatasetVisualRolesService) */
    private const DATASET_ROLE_EMAILS = [
        'superadmin' => 'superadmin.dataset@sices.local',
        'sistemas' => 'sistemas@sices.local',
        'educacion_superior' => 'superior@sices.local',
        'director_escuela' => 'direccion@sices.local',
        'control_escolar_escuela' => 'control.escolar@sices.local',
        'responsable_admision' => 'admision@sices.local',
        'responsable_evaluacion' => 'evaluacion@sices.local',
        'responsable_certificacion_titulacion' => 'certificacion@sices.local',
        'docente' => 'docente@sices.local',
        'auditor' => 'auditor@sices.local',
        'alumno_egresado' => 'alumno@sices.local',
        'aspirante_preinscrito' => 'aspirante@sices.local',
    ];

    private function seedCatalogoParaDataset(): void
    {
        $json = database_path('data/e11instituciones_subsedes.json');
        if (! is_file($json)) {
            $this->markTestSkipped('Falta catálogo legacy de subsedes: '.$json);
        }

        $this->seed([
            EntidadFederativaSeeder::class,
            MunicipioSeeder::class,
            SubsistemasSeeder::class,
            NivelAcademicoSeeder::class,
            RolesAndPermissionsSeeder::class,
            SystemMenusSeeder::class,
            ConfiguracionVisualSistemaSeeder::class,
            InstitucionesSedesInicialSeeder::class,
            InstitucionesLegacyBaseSeeder::class,
            InstitucionesSubsedesLegacySeeder::class,
        ]);

        $this->seedPlanesMinimosNormalUpn();
    }

    private function seedPlanesMinimosNormalUpn(): void
    {
        $nivel = NivelAcademico::query()->firstOrFail();
        $normal = Subsistema::query()->where('clave', 'NORMAL')->firstOrFail();
        $upn = Subsistema::query()->where('clave', 'UPN')->firstOrFail();

        $defs = [
            [$normal, 'TEST-VIS-N', 'LICENCIATURA EN EDUCACIÓN PRIMARIA'],
            [$upn, 'TEST-VIS-U', 'LICENCIATURA EN EDUCACIÓN SECUNDARIA CON ESPECIALIDAD EN MATEMÁTICAS'],
        ];

        foreach ($defs as [$sub, $claveProg, $nombreProg]) {
            /** @var Subsistema $sub */
            $prog = ProgramaEstudio::query()->updateOrCreate(
                ['subsistema_id' => $sub->id, 'clave' => $claveProg],
                [
                    'nivel_academico_id' => $nivel->id,
                    'nombre' => $nombreProg,
                    'area_conocimiento' => 'Educación',
                    'creditos_minimos' => 240,
                    'duracion_periodos' => 8,
                    'activo' => true,
                    'metadata' => ['origen' => 'test_dataset_visual_catalogo'],
                ],
            );

            $plan = PlanEstudio::query()->updateOrCreate(
                ['programa_estudio_id' => $prog->id, 'clave' => 'PLAN-'.$claveProg],
                [
                    'subsistema_id' => $sub->id,
                    'nombre' => 'Plan prueba '.$claveProg,
                    'activo' => true,
                ],
            );

            $mat = Materia::query()->updateOrCreate(
                ['plan_estudio_id' => $plan->id, 'clave' => 'MAT-'.$claveProg],
                [
                    'nombre' => 'Fundamentos pedagógicos (prueba dataset)',
                    'creditos' => 6,
                    'semestre' => 1,
                    'orden' => 1,
                    'tipo' => 'obligatoria',
                    'estatus' => 'activo',
                ],
            );

            PlanMateria::query()->updateOrCreate(
                [
                    'plan_estudio_id' => $plan->id,
                    'clave_materia' => 'MAT-'.$claveProg,
                    'tipo_periodo_curricular' => 'semestre',
                    'numero_periodo_curricular' => 1,
                ],
                [
                    'materia_id' => $mat->id,
                    'nombre_materia' => $mat->nombre,
                    'semestre' => 1,
                    'etiqueta_periodo_curricular' => 'P1',
                    'orden' => 1,
                    'creditos' => 6,
                    'obligatoria' => true,
                    'estatus' => 'activa',
                ],
            );
        }
    }

    public function test_metadatos_dataset_visual_roles(): void
    {
        $m = DatasetVisualRolesMetadata::mark();
        $this->assertSame(DatasetVisualRolesMetadata::ORIGEN, $m['origen']);
        $this->assertSame(DatasetVisualRolesMetadata::DATASET, $m['dataset']);
        $this->assertTrue($m['no_productivo']);
    }

    public function test_flujo_integral_dataset_visual_roles_y_reset_seguro(): void
    {
        $this->seedCatalogoParaDataset();

        $instBefore = Institucion::query()->count();
        $rolesBefore = Role::query()->count();
        $menusBefore = Menu::query()->count();
        $this->assertGreaterThan(0, $instBefore);
        $this->assertGreaterThan(0, $rolesBefore);
        $this->assertGreaterThan(0, $menusBefore);

        app(SeedDatasetVisualRolesService::class)->seed(false, true);

        $this->assertSame(12, User::query()->whereIn('email', array_values(self::DATASET_ROLE_EMAILS))->count());

        foreach (self::DATASET_ROLE_EMAILS as $rol => $email) {
            $u = User::query()->where('email', $email)->firstOrFail();
            $this->assertTrue($u->hasRole($rol), "Rol {$rol} para {$email}");
        }

        $this->assertGreaterThanOrEqual(80, Alumno::query()->where('metadata->dataset', DatasetVisualRolesMetadata::DATASET)->where('estatus', 'activo')->count());
        $this->assertGreaterThanOrEqual(12, SolicitudMatricula::query()->where('metadata->dataset', DatasetVisualRolesMetadata::DATASET)->count());

        $ce = User::query()->where('email', 'control.escolar@sices.local')->firstOrFail();
        $this->assertFalse($ce->can('matriculas.asignar'));
        $es = User::query()->where('email', 'superior@sices.local')->firstOrFail();
        $this->assertTrue($es->can('matriculas.asignar'));

        Sanctum::actingAs($ce);
        $this->getJson('/api/v1/me/menus')->assertOk();
        $this->getJson('/api/v1/me/apariencia')->assertOk();

        foreach (self::DATASET_ROLE_EMAILS as $rol => $email) {
            $user = User::query()->where('email', $email)->firstOrFail();
            Sanctum::actingAs($user);
            $dash = $this->getJson('/api/v1/dashboard');
            $dash->assertOk();
            $data = $dash->json('data');
            $this->assertSame($rol, $data['role'] ?? null, 'Rol primario en dashboard');
            $payload = $data['payload'] ?? [];
            $this->assertNotSame([], $payload);
            $tieneCards = isset($payload['cards']) && is_array($payload['cards']) && $payload['cards'] !== [];
            $tieneMetricas = isset($payload['metricas']) && is_array($payload['metricas']) && $payload['metricas'] !== [];
            $tieneContexto = isset($payload['contexto']);
            $this->assertTrue($tieneCards || $tieneMetricas || $tieneContexto, "Dashboard con contenido para {$rol}");
        }

        Sanctum::actingAs($es);
        $esDash = $this->getJson('/api/v1/dashboard')->json('data.payload');
        $this->assertArrayHasKey('tabla_solicitudes_matricula', $esDash);
        $this->assertGreaterThanOrEqual(1, count($esDash['tabla_solicitudes_matricula']['filas'] ?? []));

        Sanctum::actingAs($ce);
        $ceDash = $this->getJson('/api/v1/dashboard')->json('data.payload');
        $this->assertGreaterThanOrEqual(20, (int) ($ceDash['metricas']['alumnos_activos'] ?? 0));
        $mSol = ($ceDash['metricas']['solicitudes_matricula_borrador'] ?? 0)
            + ($ceDash['metricas']['solicitudes_matricula_enviadas'] ?? 0)
            + ($ceDash['metricas']['solicitudes_matricula_con_observaciones'] ?? 0);
        $this->assertGreaterThanOrEqual(8, $mSol);

        Sanctum::actingAs(User::query()->where('email', 'sistemas@sices.local')->firstOrFail());
        $sys = $this->getJson('/api/v1/dashboard')->json('data.payload');
        $this->assertArrayHasKey('telemetria_visual', $sys);
        $this->assertNotSame([], $sys['telemetria_visual']['recientes'] ?? []);

        Sanctum::actingAs(User::query()->where('email', 'certificacion@sices.local')->firstOrFail());
        $cert = $this->getJson('/api/v1/dashboard')->json('data.payload');
        $this->assertContains('Generar XML', $cert['acciones_no_disponibles'] ?? []);
        $this->assertContains('Revisar expediente', $cert['acciones_permitidas'] ?? []);

        Sanctum::actingAs(User::query()->where('email', 'alumno@sices.local')->firstOrFail());
        $alJson = strtolower(json_encode($this->getJson('/api/v1/dashboard')->json('data'), JSON_THROW_ON_ERROR));
        $this->assertStringNotContainsString('colegiatura', $alJson);
        $this->assertStringNotContainsString('pago de', $alJson);

        Sanctum::actingAs(User::query()->where('email', 'aspirante@sices.local')->firstOrFail());
        $asJson = strtolower(json_encode($this->getJson('/api/v1/dashboard')->json('data'), JSON_THROW_ON_ERROR));
        $this->assertStringNotContainsString('colegiatura', $asJson);

        Sanctum::actingAs(User::query()->where('email', 'auditor@sices.local')->firstOrFail());
        $au = $this->getJson('/api/v1/dashboard')->json('data.payload');
        $this->assertTrue($au['solo_lectura'] ?? false);
        $this->assertNotEmpty($au['acciones_solo_lectura'] ?? []);

        Sanctum::actingAs(User::query()->where('email', 'docente@sices.local')->firstOrFail());
        $doc = $this->getJson('/api/v1/dashboard')->json('data.payload');
        $this->assertTrue($doc['solo_vista_docente'] ?? false);

        app(ResetDatasetVisualRolesService::class)->ejecutar();

        $this->assertSame(0, Alumno::query()->where('metadata->dataset', DatasetVisualRolesMetadata::DATASET)->count());
        $this->assertSame($instBefore, Institucion::query()->count());
        $this->assertSame($rolesBefore, Role::query()->count());
        $this->assertSame($menusBefore, Menu::query()->count());

        app(SeedDatasetVisualRolesService::class)->seed(false, false);
        $this->assertGreaterThan(0, Alumno::query()->where('metadata->dataset', DatasetVisualRolesMetadata::DATASET)->count());
    }

    public function test_artisan_seed_dataset_rechazado_en_production_sin_force(): void
    {
        $key = config('app.key');
        if ($key === null || $key === '') {
            $key = 'base64:'.base64_encode(random_bytes(32));
        }

        $process = new Process(
            [PHP_BINARY, base_path('artisan'), 'sices:seed-dataset-visual-roles', '--no-interaction'],
            base_path(),
            [
                'APP_ENV' => 'production',
                'APP_KEY' => $key,
                'BCRYPT_ROUNDS' => '4',
                'CACHE_STORE' => 'array',
                'DB_CONNECTION' => 'sqlite',
                'DB_DATABASE' => ':memory:',
                'QUEUE_CONNECTION' => 'sync',
            ],
            null,
            120,
        );
        $process->run();
        $this->assertNotSame(0, $process->getExitCode());
        $out = $process->getErrorOutput().$process->getOutput();
        $this->assertStringContainsStringIgnoringCase('production', $out);
    }
}
