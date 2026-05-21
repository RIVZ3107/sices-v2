<?php

declare(strict_types=1);

namespace Tests\Feature\ControlEscolar;

use App\Contracts\ControlEscolar\ControlEscolarSourceAdapterInterface;
use App\Models\Alumno;
use App\Models\CicloEscolar;
use App\Models\Matricula;
use App\Models\OfertaAcademica;
use App\Services\ControlEscolar\ControlEscolarSyncService;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Fakes\FakeControlEscolarSourceAdapter;
use Tests\TestCase;

class ControlEscolarImportacionTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
        $this->app->instance(ControlEscolarSourceAdapterInterface::class, new FakeControlEscolarSourceAdapter);
        config(['control_escolar.enabled' => true]);
    }

    public function test_importa_alumno_por_curp_sin_duplicar(): void
    {
        $this->prepararMatriculaSices();

        $sync = app(ControlEscolarSyncService::class);
        $r1 = $sync->importarPorCurp(FakeControlEscolarSourceAdapter::$curp);
        $r2 = $sync->importarPorCurp(FakeControlEscolarSourceAdapter::$curp);

        $this->assertTrue($r1->success);
        $this->assertTrue($r2->success);
        $this->assertSame(1, Alumno::query()->where('curp', FakeControlEscolarSourceAdapter::$curp)->count());
        $this->assertGreaterThanOrEqual(2, $r2->materiasImportadas);
    }

    public function test_no_duplica_materias_en_reimportacion(): void
    {
        $this->prepararMatriculaSices();

        $sync = app(ControlEscolarSyncService::class);
        $sync->importarPorMatricula(FakeControlEscolarSourceAdapter::$matricula);
        $count = \App\Models\MateriaCursada::query()
            ->where('matricula_id', Matricula::query()->value('id'))
            ->count();

        $sync->importarPorMatricula(FakeControlEscolarSourceAdapter::$matricula);

        $this->assertSame($count, \App\Models\MateriaCursada::query()
            ->where('matricula_id', Matricula::query()->value('id'))
            ->count());
    }

    protected function prepararMatriculaSices(): Matricula
    {
        $oferta = OfertaAcademica::query()->with('institucion')->firstOrFail();
        $ciclo = CicloEscolar::query()->where('es_actual', true)->first()
            ?? CicloEscolar::query()->firstOrFail();

        $alumno = Alumno::query()->create([
            'curp' => FakeControlEscolarSourceAdapter::$curp,
            'nombre' => 'Previo',
            'primer_apellido' => 'Test',
        ]);

        return Matricula::query()->create([
            'alumno_id' => $alumno->id,
            'oferta_academica_id' => $oferta->id,
            'ciclo_escolar_id' => $ciclo->id,
            'subsistema_id' => $oferta->institucion?->subsistema_id ?? 1,
            'matricula' => FakeControlEscolarSourceAdapter::$matricula,
            'estado' => 'activa',
        ]);
    }
}
