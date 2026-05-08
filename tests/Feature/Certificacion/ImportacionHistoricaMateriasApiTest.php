<?php

declare(strict_types=1);

namespace Tests\Feature\Certificacion;

use App\Models\ImportacionHistoricaMaterias;
use App\Models\MateriaCursada;
use App\Models\Matricula;
use App\Models\PlanMateria;
use App\Models\User;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;

class ImportacionHistoricaMateriasApiTest extends ModeloAcademicoControlEscolarTest
{
    public function test_flujo_importacion_historica_con_plan_periodo_curricular_mixto(): void
    {
        [$alumno, $oferta, $ciclo] = $this->crearBase();
        $planId = (int) $oferta->plan_estudio_id;

        PlanMateria::query()->create([
            'plan_estudio_id' => $planId,
            'clave_materia' => 'CX101',
            'nombre_materia' => 'Asignatura importada',
            'semestre' => 2,
            'tipo_periodo_curricular' => 'cuatrimestre',
            'numero_periodo_curricular' => 1,
            'orden' => 1,
            'creditos' => 5,
            'obligatoria' => true,
            'estatus' => 'activa',
        ]);

        $user = User::factory()->create();
        Role::findOrCreate('superadmin', 'web');
        $user->assignRole('superadmin');
        Sanctum::actingAs($user);

        $matricula = Matricula::query()->create([
            'alumno_id' => $alumno->id,
            'oferta_academica_id' => $oferta->id,
            'ciclo_escolar_id' => $ciclo->id,
            'matricula' => 'MAT-IMP-'.substr(str_replace('.', '', uniqid('', true)), -6),
            'estado' => 'activa',
        ]);

        $crear = $this->postJson('/api/v1/academico/importaciones', [
            'matricula_id' => $matricula->id,
            'ciclo_escolar_id' => $ciclo->id,
            'filas_payload' => [
                [
                    'clave' => 'CX101',
                    'calificacion' => 8,
                    'tipo_periodo_curricular' => 'cuatrimestre',
                    'numero_periodo_curricular' => 1,
                    'estado' => 'acreditada',
                ],
            ],
        ]);

        $crear->assertCreated();
        $id = (int) $crear->json('data.id');

        $this->postJson("/api/v1/academico/importaciones/{$id}/prevalidar")->assertOk();

        ImportacionHistoricaMaterias::query()->findOrFail($id);

        $this->postJson("/api/v1/academico/importaciones/{$id}/confirmar")->assertOk();

        $mc = MateriaCursada::query()->where('matricula_id', $matricula->id)->firstOrFail();
        $this->assertSame('CX101', $mc->clave);
        $this->assertSame(2, (int) $mc->semestre);
        $this->assertSame('cuatrimestre', $mc->tipo_periodo_curricular);
        $this->assertSame(1, (int) $mc->numero_periodo_curricular);

        $this->assertSame(
            'confirmada',
            (string) ImportacionHistoricaMaterias::query()->findOrFail($id)->estado,
        );
    }
}
