<?php

declare(strict_types=1);

namespace Tests\Feature\Certificacion;

use App\Models\Alumno;
use App\Models\MateriaCursada;
use App\Models\User;
use App\Services\Certificacion\CertificacionImportacionLegacyNormativaGate;
use Laravel\Sanctum\Sanctum;
use Spatie\Permission\Models\Role;

/** Matrícula con materias «legacy_controlado» sin validación normativa en metadata bloquea certificación (incluida la creación del documento). */
class CertificacionLegacyNormativaBloqueaAprobacionTest extends DocumentoCapturaApiFlujoTest
{
    public function test_crear_documento_bloquea_si_existe_legacy_controlado_sin_validacion_en_matricula(): void
    {
        $usuario = User::factory()->create();
        Role::findOrCreate('admin', 'web');
        $usuario->assignRole('admin');
        Sanctum::actingAs($usuario);

        $ctx = $this->crearContextoInstitucional();

        $alumno = Alumno::query()->create([
            'curp' => sprintf('BBBB000000HDF%05d', random_int(10000, 99999)),
            'nombre' => 'Luis',
            'primer_apellido' => 'Perez',
        ]);

        $matriculaResp = $this->postJson('/api/v1/certificacion/matriculas', [
            'alumno_id' => $alumno->id,
            'oferta_academica_id' => $ctx['oferta_academica_id'],
            'ciclo_escolar_id' => $ctx['ciclo_escolar_id'],
            'matricula' => 'MAT-LEG-'.substr(str_replace('.', '', uniqid('', true)), 0, 10),
            'estado' => 'activa',
        ]);
        $matriculaResp->assertCreated();
        $matriculaId = $matriculaResp->json('data.id');

        MateriaCursada::query()->create([
            'alumno_id' => $alumno->id,
            'matricula_id' => $matriculaId,
            'ciclo_escolar_id' => $ctx['ciclo_escolar_id'],
            'clave' => 'LEGACY01',
            'nombre' => 'Asignatura importada',
            'semestre' => 3,
            'calificacion' => 9,
            'estado' => 'acreditada',
            'metadata' => ['origen' => CertificacionImportacionLegacyNormativaGate::META_ORIGEN_LEGACY],
        ]);

        $this->putJson('/api/v1/certificacion/trayectorias-academicas', [
            'alumno_id' => $alumno->id,
            'matricula_id' => $matriculaId,
            'promedio' => 9,
            'total_materias' => 1,
            'materias_aprobadas' => 1,
            'estado' => 'activa',
        ])->assertSuccessful();

        $docResp = $this->postJson('/api/v1/certificacion/documentos-academicos', [
            'alumno_id' => $alumno->id,
            'matricula_id' => $matriculaId,
            'ciclo_escolar_id' => $ctx['ciclo_escolar_id'],
            'subsistema_id' => $ctx['subsistema_id'],
            'region_id' => $ctx['region_id'],
            'institucion_id' => $ctx['institucion_id'],
            'sede_id' => $ctx['sede_id'],
            'tipo_documento' => 'certificado',
        ]);
        $docResp->assertStatus(422);
        $mensaje = (string) ($docResp->json('errors.documento.0') ?? '');
        self::assertStringContainsStringIgnoringCase('legacy', $mensaje);
    }
}
