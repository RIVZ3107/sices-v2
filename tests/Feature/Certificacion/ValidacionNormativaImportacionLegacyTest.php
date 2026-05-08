<?php

declare(strict_types=1);

namespace Tests\Feature\Certificacion;

use App\Models\Alumno;
use App\Models\AuditoriaEvento;
use App\Models\CicloEscolar;
use App\Models\Institucion;
use App\Models\NivelAcademico;
use App\Models\OfertaAcademica;
use App\Models\PlanEstudio;
use App\Models\ProgramaEstudio;
use App\Models\Region;
use App\Models\Sede;
use App\Models\Subsistema;
use App\Models\User;
use App\Services\Certificacion\CertificacionImportacionLegacyNormativaGate;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ValidacionNormativaImportacionLegacyTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    public function test_control_escolar_no_puede_listar_ni_aprobar_validacion_legacy(): void
    {
        $ce = User::factory()->create();
        Role::findOrCreate('control_escolar_escuela', 'web');
        $ce->assignRole('control_escolar_escuela');
        Sanctum::actingAs($ce);

        $this->getJson('/api/v1/certificacion/matriculas-legacy-normativa/pendientes')->assertForbidden();

        $matricula = $this->crearMatriculaConBucketPendiente();
        $this->postJson(
            "/api/v1/certificacion/matriculas-legacy-normativa/{$matricula->id}/aprobar-validacion-normativa",
            ['motivo' => 'x'],
        )->assertForbidden();
    }

    public function test_educacion_superior_puede_aprobar_y_audita(): void
    {
        $es = User::factory()->create();
        Role::findOrCreate('educacion_superior', 'web');
        $es->assignRole('educacion_superior');
        Sanctum::actingAs($es);

        $matricula = $this->crearMatriculaConBucketPendiente();

        $res = $this->postJson(
            "/api/v1/certificacion/matriculas-legacy-normativa/{$matricula->id}/aprobar-validacion-normativa",
            ['motivo' => 'Plan de estudios verificado.'],
        );
        $res->assertOk();
        $this->assertSame(
            CertificacionImportacionLegacyNormativaGate::ESTADO_VALIDADO_NORMATIVAMENTE,
            data_get($res->json(), 'data.historico_importacion_legacy.estado'),
        );

        $this->assertTrue(
            AuditoriaEvento::query()
                ->where('evento', 'historico_importacion_legacy.validacion_normativa.aprobada')
                ->where('entidad_id', $matricula->id)
                ->exists(),
        );
    }

    public function test_documento_bloqueado_si_pendiente_y_se_desbloquea_tras_aprobacion(): void
    {
        $ctx = $this->crearContextoInstitucional();
        $ce = $this->usuarioControlEscolar();
        $es = $this->usuarioEducacionSuperior();
        $ce->instituciones()->syncWithoutDetaching([$ctx['institucion_id']]);
        $ce->sedes()->syncWithoutDetaching([$ctx['sede_id']]);

        Sanctum::actingAs($ce);

        $alumno = Alumno::query()->create([
            'curp' => sprintf('AAAA000000HDF%05d', random_int(10000, 99999)),
            'nombre' => 'Luis',
            'primer_apellido' => 'Prueba',
        ]);

        $matricula = $this->crearMatriculaBase($ctx, $alumno->id);
        $this->marcarPendienteNormativa($matricula, (int) $ce->id);

        $this->crearMateriaYTrayectoria($ctx, $alumno->id, $matricula->id);

        Sanctum::actingAs($ce);
        $docBloqueado = $this->postJson('/api/v1/certificacion/documentos-academicos', [
            'alumno_id' => $alumno->id,
            'matricula_id' => $matricula->id,
            'ciclo_escolar_id' => $ctx['ciclo_escolar_id'],
            'subsistema_id' => $ctx['subsistema_id'],
            'region_id' => $ctx['region_id'],
            'institucion_id' => $ctx['institucion_id'],
            'sede_id' => $ctx['sede_id'],
            'tipo_documento' => 'certificado',
        ]);
        $docBloqueado->assertStatus(422);

        Sanctum::actingAs($es);
        $this->postJson(
            "/api/v1/certificacion/matriculas-legacy-normativa/{$matricula->id}/aprobar-validacion-normativa",
            ['motivo' => 'Conciliación aceptada.'],
        )->assertOk();

        Sanctum::actingAs($ce);
        $docOk = $this->postJson('/api/v1/certificacion/documentos-academicos', [
            'alumno_id' => $alumno->id,
            'matricula_id' => $matricula->id,
            'ciclo_escolar_id' => $ctx['ciclo_escolar_id'],
            'subsistema_id' => $ctx['subsistema_id'],
            'region_id' => $ctx['region_id'],
            'institucion_id' => $ctx['institucion_id'],
            'sede_id' => $ctx['sede_id'],
            'tipo_documento' => 'certificado',
        ]);
        $docOk->assertCreated();
    }

    public function test_documento_sigue_bloqueado_si_rechazo_normativo(): void
    {
        $ctx = $this->crearContextoInstitucional();
        $ce = $this->usuarioControlEscolar();
        $es = $this->usuarioEducacionSuperior();
        $ce->instituciones()->syncWithoutDetaching([$ctx['institucion_id']]);
        $ce->sedes()->syncWithoutDetaching([$ctx['sede_id']]);

        Sanctum::actingAs($ce);

        $alumno = Alumno::query()->create([
            'curp' => sprintf('AAAA000000HDF%05d', random_int(10000, 99999)),
            'nombre' => 'María',
            'primer_apellido' => 'Prueba',
        ]);

        $matricula = $this->crearMatriculaBase($ctx, $alumno->id);
        $this->marcarPendienteNormativa($matricula, (int) $ce->id);

        $this->crearMateriaYTrayectoria($ctx, $alumno->id, $matricula->id);

        Sanctum::actingAs($es);
        $this->postJson(
            "/api/v1/certificacion/matriculas-legacy-normativa/{$matricula->id}/rechazar-validacion-normativa",
            ['motivo' => 'Información incompleta frente al plan oficial.'],
        )->assertOk();

        Sanctum::actingAs($ce);
        $docBloqueado = $this->postJson('/api/v1/certificacion/documentos-academicos', [
            'alumno_id' => $alumno->id,
            'matricula_id' => $matricula->id,
            'ciclo_escolar_id' => $ctx['ciclo_escolar_id'],
            'subsistema_id' => $ctx['subsistema_id'],
            'region_id' => $ctx['region_id'],
            'institucion_id' => $ctx['institucion_id'],
            'sede_id' => $ctx['sede_id'],
            'tipo_documento' => 'certificado',
        ]);
        $docBloqueado->assertStatus(422);

        $this->assertTrue(
            AuditoriaEvento::query()
                ->where('evento', 'historico_importacion_legacy.validacion_normativa.rechazada')
                ->where('entidad_id', $matricula->id)
                ->exists(),
        );
    }

    private function usuarioControlEscolar(): User
    {
        $u = User::factory()->create();
        Role::findOrCreate('control_escolar_escuela', 'web');
        $u->assignRole('control_escolar_escuela');

        return $u;
    }

    private function usuarioEducacionSuperior(): User
    {
        $u = User::factory()->create();
        Role::findOrCreate('educacion_superior', 'web');
        $u->assignRole('educacion_superior');

        return $u;
    }

    private function crearMatriculaConBucketPendiente(): \App\Models\Matricula
    {
        $ctx = $this->crearContextoInstitucional();
        $alumno = Alumno::query()->create([
            'curp' => sprintf('AAAA000000HDF%05d', random_int(10000, 99999)),
            'nombre' => 'Ana',
            'primer_apellido' => 'Prueba',
        ]);

        $matricula = $this->crearMatriculaBase($ctx, $alumno->id);
        $fakeImportador = User::factory()->create();
        $this->marcarPendienteNormativa($matricula, (int) $fakeImportador->id);

        return $matricula->fresh();
    }

    /** @param  array<string, int>  $ctx */
    private function crearMatriculaBase(array $ctx, int $alumnoId): \App\Models\Matricula
    {
        /** @var \App\Models\Matricula $matricula */
        $matricula = \App\Models\Matricula::query()->create([
            'alumno_id' => $alumnoId,
            'oferta_academica_id' => $ctx['oferta_academica_id'],
            'ciclo_escolar_id' => $ctx['ciclo_escolar_id'],
            'matricula' => 'LEG-NORM-'.substr(str_replace('.', '', uniqid('', true)), 0, 12),
            'estado' => 'activa',
        ]);

        return $matricula->fresh();
    }

    private function marcarPendienteNormativa(\App\Models\Matricula $matricula, int $importadorId): void
    {
        $bucket = [
            'estado' => CertificacionImportacionLegacyNormativaGate::ESTADO_PENDIENTE_VALIDACION,
            'motivo_ultimo_forzado' => 'Migración desde sistema anterior sin vínculo a plan materia.',
            'importaciones_ids' => [],
            'marcado_en' => now()->toIso8601String(),
            'usuario_importador_id' => $importadorId,
        ];
        $matricula->forceFill([
            'metadata' => array_merge((array) ($matricula->metadata ?? []), [
                CertificacionImportacionLegacyNormativaGate::MATRICULA_META_KEY => $bucket,
            ]),
        ])->save();
    }

    /** @param  array<string, int>  $ctx */
    private function crearMateriaYTrayectoria(array $ctx, int $alumnoId, int $matriculaId): void
    {
        $admin = User::factory()->create();
        Role::findOrCreate('superadmin', 'web');
        $admin->assignRole('superadmin');
        Sanctum::actingAs($admin);

        $this->postJson('/api/v1/certificacion/materias-cursadas', [
            'alumno_id' => $alumnoId,
            'matricula_id' => $matriculaId,
            'ciclo_escolar_id' => $ctx['ciclo_escolar_id'],
            'clave' => 'LEG101',
            'nombre' => 'LEGACY Materia demo',
            'calificacion' => 8.0,
            'creditos' => 6,
            'semestre' => 1,
            'tipo_periodo_curricular' => 'semestre',
            'numero_periodo_curricular' => 1,
            'periodo' => '2024-2025',
        ])->assertCreated();

        $this->putJson('/api/v1/certificacion/trayectorias-academicas', [
            'alumno_id' => $alumnoId,
            'matricula_id' => $matriculaId,
            'promedio' => 8.0,
            'total_materias' => 1,
            'materias_aprobadas' => 1,
            'estado' => 'activa',
        ])->assertSuccessful();
    }

    /**
     * @return array{
     *     subsistema_id: int,
     *     region_id: int,
     *     institucion_id: int,
     *     sede_id: int,
     *     oferta_academica_id: int,
     *     ciclo_escolar_id: int
     * }
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
            'nombre' => 'Región prueba legacy norm',
            'activo' => true,
        ]);

        $institucion = Institucion::query()->create([
            'subsistema_id' => $subsistema->id,
            'region_id' => $region->id,
            'clave' => 'INS-'.$suf,
            'nombre' => 'Institución prueba legacy norm',
            'activo' => true,
        ]);

        $sede = Sede::query()->create([
            'institucion_id' => $institucion->id,
            'region_id' => $region->id,
            'clave' => 'SED-'.$suf,
            'nombre' => 'Sede prueba legacy norm',
            'activo' => true,
        ]);

        $nivel = NivelAcademico::query()->where('clave', 'LIC')->firstOrFail();

        $programa = ProgramaEstudio::query()->create([
            'nivel_academico_id' => $nivel->id,
            'clave' => 'PROG-'.$suf,
            'nombre' => 'Programa prueba legacy norm',
            'activo' => true,
        ]);

        $plan = PlanEstudio::query()->create([
            'programa_estudio_id' => $programa->id,
            'clave' => 'PLAN-'.$suf,
            'nombre' => 'Plan prueba legacy norm',
            'activo' => true,
        ]);

        $ciclo = CicloEscolar::query()->create([
            'clave' => 'CIC-'.$suf,
            'nombre' => 'Ciclo prueba legacy norm',
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
}
