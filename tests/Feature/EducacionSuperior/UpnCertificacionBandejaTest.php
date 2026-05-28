<?php

declare(strict_types=1);

namespace Tests\Feature\EducacionSuperior;

use App\Models\Alumno;
use App\Models\CicloEscolar;
use App\Models\DocumentoAcademico;
use App\Models\Institucion;
use App\Models\NivelAcademico;
use App\Models\OfertaAcademica;
use App\Models\PlanEstudio;
use App\Models\ProgramaEstudio;
use App\Models\Region;
use App\Models\Sede;
use App\Models\Subsistema;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class UpnCertificacionBandejaTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_bandeja_acepta_filtro_subsistema_upn_por_clave(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);

        $upn = Subsistema::query()->updateOrCreate(
            ['clave' => 'UPN'],
            ['nombre' => 'Universidad Pedagógica Nacional', 'nombre_corto' => 'UPN', 'activo' => true],
        );
        $normal = Subsistema::query()->updateOrCreate(
            ['clave' => 'NORMAL'],
            ['nombre' => 'Educación Normal', 'nombre_corto' => 'Normal', 'activo' => true],
        );

        $this->crearDocumentoRevision($upn->id);
        $this->crearDocumentoRevision($normal->id);

        $user = User::factory()->create();
        $user->assignRole('educacion_superior');
        Sanctum::actingAs($user);

        $res = $this->getJson('/api/v1/certificacion/bandejas/documentos-academicos/en-revision?subsistema=UPN');
        $res->assertOk();

        $data = $res->json('data') ?? [];
        $this->assertNotEmpty($data);
        foreach ($data as $row) {
            $this->assertSame((int) $upn->id, (int) ($row['subsistema_id'] ?? 0));
        }
    }

    private function crearDocumentoRevision(int $subsistemaId): DocumentoAcademico
    {
        $region = Region::query()->firstOrCreate(
            ['clave' => 'REG-SUB-'.$subsistemaId],
            [
                'subsistema_id' => $subsistemaId,
                'nombre' => 'Región test subsistema '.$subsistemaId,
                'activo' => true,
            ],
        );

        $institucion = Institucion::query()->firstOrCreate(
            ['clave' => 'INS-SUB-'.$subsistemaId],
            [
                'subsistema_id' => $subsistemaId,
                'region_id' => $region->id,
                'nombre' => 'Institución test '.$subsistemaId,
                'activo' => true,
            ],
        );

        $sede = Sede::query()->firstOrCreate(
            ['clave' => 'CCT-SUB-'.$subsistemaId],
            [
                'institucion_id' => $institucion->id,
                'region_id' => $region->id,
                'nombre' => 'Sede test '.$subsistemaId,
                'activo' => true,
            ],
        );

        $nivel = NivelAcademico::query()->firstOrCreate(
            ['clave' => 'LIC'],
            ['nombre' => 'Licenciatura', 'activo' => true],
        );

        $programa = ProgramaEstudio::query()->firstOrCreate(
            ['clave' => 'PROG-SUB-'.$subsistemaId],
            [
                'nivel_academico_id' => $nivel->id,
                'subsistema_id' => $subsistemaId,
                'nombre' => 'Programa test '.$subsistemaId,
                'activo' => true,
            ],
        );

        $plan = PlanEstudio::query()->firstOrCreate(
            ['clave' => 'PLAN-SUB-'.$subsistemaId],
            [
                'programa_estudio_id' => $programa->id,
                'subsistema_id' => $subsistemaId,
                'nombre' => 'Plan test '.$subsistemaId,
                'activo' => true,
            ],
        );

        $ciclo = CicloEscolar::query()->firstOrCreate(
            ['clave' => 'CIC-UPN-BANDEJA'],
            [
                'nombre' => 'Ciclo bandeja UPN',
                'fecha_inicio' => now()->subYear(),
                'fecha_fin' => now()->addMonths(6),
                'activo' => true,
            ],
        );

        $oferta = OfertaAcademica::query()->firstOrCreate(
            ['clave' => 'OFE-SUB-'.$subsistemaId],
            [
                'institucion_id' => $institucion->id,
                'sede_id' => $sede->id,
                'programa_estudio_id' => $programa->id,
                'plan_estudio_id' => $plan->id,
                'ciclo_escolar_id' => $ciclo->id,
                'modalidad' => 'escolarizada',
                'activo' => true,
            ],
        );

        $alumno = Alumno::query()->create([
            'curp' => sprintf('UPN%014d', random_int(1000, 99999999999999)),
            'nombre' => 'Alumno',
            'primer_apellido' => 'UPN',
            'segundo_apellido' => 'Test',
        ]);

        return DocumentoAcademico::query()->create([
            'alumno_id' => $alumno->id,
            'ciclo_escolar_id' => $ciclo->id,
            'oferta_academica_id' => $oferta->id,
            'subsistema_id' => $subsistemaId,
            'region_id' => $region->id,
            'institucion_id' => $institucion->id,
            'sede_id' => $sede->id,
            'tipo_documento' => 'certificado',
            'tipo_certificacion' => 'total',
            'estado_workflow' => 'en_revision',
        ]);
    }
}
