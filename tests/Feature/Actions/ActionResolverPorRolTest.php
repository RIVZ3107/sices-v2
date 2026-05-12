<?php

declare(strict_types=1);

namespace Tests\Feature\Actions;

use App\Models\SolicitudMatricula;
use App\Models\User;
use App\Services\ControlEscolar\ActionResolver;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ActionResolverPorRolTest extends TestCase
{
    use RefreshDatabase;

    private function keysFor(User $user, array $context = []): array
    {
        $resolver = app(ActionResolver::class);
        $actions = $resolver->resolve($user, $context);

        return array_column($actions, 'key');
    }

    private function actionMap(User $user, array $context = []): array
    {
        $resolver = app(ActionResolver::class);
        $actions = $resolver->resolve($user, $context);
        $map = [];
        foreach ($actions as $a) {
            $map[$a['key']] = $a;
        }

        return $map;
    }

    public function test_politicas_por_rol_y_estado(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);

        $ce = User::factory()->create();
        $ce->assignRole('control_escolar_escuela');

        $es = User::factory()->create();
        $es->assignRole('educacion_superior');

        $sys = User::factory()->create();
        $sys->assignRole('sistemas');

        $aud = User::factory()->create();
        $aud->assignRole('auditor');

        $doc = User::factory()->create();
        $doc->assignRole('docente');

        // 1. Control Escolar no recibe asignar_matricula (ningún estado).
        foreach ([SolicitudMatricula::ESTADO_BORRADOR, SolicitudMatricula::ESTADO_APROBADA, SolicitudMatricula::ESTADO_MATRICULA_ASIGNADA] as $estado) {
            $keys = $this->keysFor($ce, ['entity' => 'solicitud_matricula', 'estado' => $estado]);
            $this->assertNotContains('asignar_matricula', $keys, "CE no debe ver asignar_matricula en estado {$estado}");
        }

        // 2. Educación Superior recibe asignar_matricula cuando el estado es aprobada.
        $keysAprobada = $this->keysFor($es, ['entity' => 'solicitud_matricula', 'estado' => SolicitudMatricula::ESTADO_APROBADA]);
        $this->assertContains('asignar_matricula', $keysAprobada);

        $keysBorradorEs = $this->keysFor($es, ['entity' => 'solicitud_matricula', 'estado' => SolicitudMatricula::ESTADO_BORRADOR]);
        $this->assertNotContains('asignar_matricula', $keysBorradorEs);

        // 3. Sistemas recibe administrar_menus (contexto general).
        $keysSys = $this->keysFor($sys, ['entity' => 'general']);
        $this->assertContains('administrar_menus', $keysSys);

        // 4. Sistemas no recibe capturar_calificaciones.
        $this->assertNotContains('capturar_calificaciones', $keysSys);

        // 5. Auditor: solo acciones de consulta (método GET).
        $audActions = app(ActionResolver::class)->resolve($aud, ['entity' => 'general']);
        $this->assertNotEmpty($audActions);
        foreach ($audActions as $a) {
            $this->assertSame('GET', strtoupper((string) $a['method']), 'Auditor: acción '.$a['key']);
        }

        // 6. Docente solo recibe acciones de su ámbito.
        $docKeys = $this->keysFor($doc, ['entity' => 'general']);
        $permitidasDocente = ['capturar_calificaciones', 'acceder_panel_docente'];
        foreach ($docKeys as $k) {
            $this->assertContains($k, $permitidasDocente, 'Docente no debe recibir acción ajena: '.$k);
        }

        // 7. Botones bloqueados incluyen motivo (captura cerrada + capturar).
        $map = $this->actionMap($doc, ['entity' => 'captura_calificaciones', 'estado' => 'cerrada']);
        $this->assertArrayHasKey('capturar_calificaciones', $map);
        $this->assertFalse($map['capturar_calificaciones']['enabled']);
        $this->assertNotSame('', trim((string) $map['capturar_calificaciones']['disabled_reason']));
    }
}
