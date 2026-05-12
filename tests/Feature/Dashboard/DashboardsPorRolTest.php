<?php

declare(strict_types=1);

namespace Tests\Feature\Dashboard;

use App\Models\User;
use App\Services\Dashboard\DashboardRoleResolver;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DashboardsPorRolTest extends TestCase
{
    use RefreshDatabase;

    /**
     * Valida el contrato de GET /api/v1/dashboard por rol (una sola corrida del seeder pesado).
     */
    public function test_dashboard_resuelve_por_rol_y_politicas_de_contenido(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);

        $dashboardFor = function (string $role): array {
            $user = User::factory()->create();
            $user->assignRole($role);
            Sanctum::actingAs($user);
            $res = $this->getJson('/api/v1/dashboard');
            $res->assertOk();

            return $res->json('data') ?? [];
        };

        // 1. Cada rol de la prioridad recibe su clave de rol y un payload coherente.
        foreach (DashboardRoleResolver::PRIORITY as $role) {
            $data = $dashboardFor($role);
            $this->assertSame($role, $data['role'] ?? null, "Rol esperado para usuario con rol {$role}");
            $this->assertIsArray($data['payload'] ?? null);
        }

        // 2. Control Escolar no recibe bloque técnico de sistemas (sin cards de cola/XML).
        $ce = $dashboardFor('control_escolar_escuela');
        $this->assertFalse((bool) ($ce['payload']['technical'] ?? true));
        $this->assertArrayHasKey('contexto', $ce['payload']);
        $this->assertArrayHasKey('metricas', $ce['payload']);
        $this->assertArrayNotHasKey('xml_error', $ce['payload']);
        $cardKeys = array_column($ce['payload']['cards'] ?? [], 'key');
        $this->assertNotContains('xml_error', $cardKeys);
        $this->assertNotContains('jobs', $cardKeys);

        // 2b Dirección de escuela: contexto académico sin bloque técnico
        $dir = $dashboardFor('director_escuela');
        $this->assertFalse((bool) ($dir['payload']['technical'] ?? true));
        $this->assertArrayHasKey('contexto', $dir['payload']);
        $this->assertArrayHasKey('metricas', $dir['payload']);
        $this->assertArrayHasKey('matricula_por_programa', $dir['payload']);
        $this->assertArrayNotHasKey('xml_error', $dir['payload']);

        // 3. Sistemas recibe datos técnicos.
        $sys = $dashboardFor('sistemas');
        $this->assertTrue((bool) ($sys['payload']['technical'] ?? false));
        $keys = array_column($sys['payload']['cards'] ?? [], 'key');
        $this->assertContains('xml_error', $keys);
        $this->assertContains('jobs', $keys);

        // 4. Educación Superior recibe solicitudes de matrícula (métricas + tabla) y contexto académico.
        $es = $dashboardFor('educacion_superior');
        $m = $es['payload']['metricas'] ?? [];
        $this->assertArrayHasKey('contexto', $es['payload']);
        $this->assertArrayHasKey('solicitudes_matricula_pendientes', $m);
        $this->assertArrayHasKey('solicitudes_matricula_pendientes', $m);
        $this->assertArrayHasKey('tabla_solicitudes_matricula', $es['payload']);
        $this->assertSame(
            'Solicitudes de matrícula pendientes',
            $es['payload']['tabla_solicitudes_matricula']['titulo'] ?? '',
        );

        // 5. Auditor: solo lectura en payload.
        $au = $dashboardFor('auditor');
        $this->assertTrue((bool) ($au['payload']['solo_lectura'] ?? false));

        // 6. Alumno egresado: solo datos propios (contrato API).
        $al = $dashboardFor('alumno_egresado');
        $this->assertTrue((bool) ($al['payload']['solo_datos_propios'] ?? false));

        // 7. Aspirante: solo datos propios (contrato API).
        $as = $dashboardFor('aspirante_preinscrito');
        $this->assertTrue((bool) ($as['payload']['solo_datos_propios'] ?? false));
    }
}
