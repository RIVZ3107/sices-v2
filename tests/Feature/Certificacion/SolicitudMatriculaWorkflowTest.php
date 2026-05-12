<?php

declare(strict_types=1);

namespace Tests\Feature\Certificacion;

use App\Models\Alumno;
use App\Models\AuditoriaEvento;
use App\Models\CicloEscolar;
use App\Models\Institucion;
use App\Models\Matricula;
use App\Models\NivelAcademico;
use App\Models\OfertaAcademica;
use App\Models\PlanEstudio;
use App\Models\ProgramaEstudio;
use App\Models\Region;
use App\Models\Sede;
use App\Models\SolicitudMatricula;
use App\Models\Subsistema;
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

final class SolicitudMatriculaWorkflowTest extends TestCase
{
    use RefreshDatabase;

    private function contextoSubsistema(string $claveSubsistema): array
    {
        $subsistema = Subsistema::query()->where('clave', $claveSubsistema)->firstOrFail();
        $suf = substr(str_replace('.', '', uniqid('', true)), -6);
        $region = Region::query()->create([
            'subsistema_id' => $subsistema->id,
            'clave' => 'REG'.$suf,
            'nombre' => 'Region '.$suf,
            'activo' => true,
        ]);
        $institucion = Institucion::query()->create([
            'subsistema_id' => $subsistema->id,
            'region_id' => $region->id,
            'clave' => 'INS'.$suf,
            'nombre' => 'Institucion '.$suf,
            'activo' => true,
        ]);
        $sede = Sede::query()->create([
            'institucion_id' => $institucion->id,
            'region_id' => $region->id,
            'clave' => 'SED'.$suf,
            'nombre' => 'Sede '.$suf,
            'activo' => true,
        ]);
        $nivel = NivelAcademico::query()->where('clave', 'LIC')->firstOrFail();
        $programa = ProgramaEstudio::query()->create([
            'nivel_academico_id' => $nivel->id,
            'subsistema_id' => $subsistema->id,
            'clave' => 'PROG'.$suf,
            'nombre' => 'Programa '.$suf,
            'activo' => true,
        ]);
        $plan = PlanEstudio::query()->create([
            'programa_estudio_id' => $programa->id,
            'subsistema_id' => $subsistema->id,
            'clave' => 'PLAN'.$suf,
            'nombre' => 'Plan '.$suf,
            'activo' => true,
        ]);
        $ciclo = CicloEscolar::query()->create([
            'clave' => 'CIC'.$suf,
            'nombre' => 'Ciclo '.$suf,
            'fecha_inicio' => '2024-08-01',
            'fecha_fin' => '2025-07-31',
            'es_actual' => true,
            'activo' => true,
        ]);
        $ofertaAttrs = [
            'institucion_id' => $institucion->id,
            'sede_id' => $sede->id,
            'programa_estudio_id' => $programa->id,
            'plan_estudio_id' => $plan->id,
            'ciclo_escolar_id' => $ciclo->id,
            'clave' => 'OFA'.$suf,
            'modalidad' => 'escolarizada',
            'activo' => true,
        ];
        if ($claveSubsistema === 'UPN') {
            $ofertaAttrs['metadata'] = ['modalidad_upn' => 'presencial'];
        }
        $oferta = OfertaAcademica::query()->create($ofertaAttrs);

        return [
            'subsistema_id' => $subsistema->id,
            'institucion_id' => $institucion->id,
            'oferta_id' => $oferta->id,
            'ciclo_id' => $ciclo->id,
        ];
    }

    private function vincularControlEscolarAInstitucion(User $ce, int $institucionId): void
    {
        $ce->instituciones()->sync([$institucionId]);
    }

    public function test_flujo_completo_y_permisos(): void
    {
        $this->seed(DatabaseSeeder::class);
        $normal = $this->contextoSubsistema('NORMAL');
        $upn = $this->contextoSubsistema('UPN');

        $alumnoNormal = Alumno::query()->create([
            'curp' => sprintf('SONA900101HDF%05d', random_int(10000, 99999)),
            'nombre' => 'Prueba',
            'primer_apellido' => 'Normal',
        ]);
        $alumnoUpn = Alumno::query()->create([
            'curp' => sprintf('SOUP900101HDF%05d', random_int(10000, 99999)),
            'nombre' => 'Prueba',
            'primer_apellido' => 'Upn',
        ]);

        $ce = User::query()->where('email', 'control.escolar@sices.local')->firstOrFail();
        $this->vincularControlEscolarAInstitucion($ce, (int) $normal['institucion_id']);
        Sanctum::actingAs($ce);

        $r1 = $this->postJson('/api/v1/certificacion/solicitudes-matricula', [
            'alumno_id' => $alumnoNormal->id,
            'oferta_academica_id' => $normal['oferta_id'],
            'ciclo_ingreso_id' => $normal['ciclo_id'],
        ]);
        $r1->assertCreated();
        $sid = (int) $r1->json('data.id');
        $this->assertSame(SolicitudMatricula::ESTADO_BORRADOR, $r1->json('data.estado'));

        $this->postJson('/api/v1/certificacion/solicitudes-matricula/'.$sid.'/enviar')->assertOk();
        $this->assertSame(SolicitudMatricula::ESTADO_ENVIADA, SolicitudMatricula::query()->findOrFail($sid)->estado);

        $this->postJson('/api/v1/certificacion/matriculas', [
            'alumno_id' => $alumnoNormal->id,
            'oferta_academica_id' => $normal['oferta_id'],
            'ciclo_escolar_id' => $normal['ciclo_id'],
            'matricula' => 'XNO-CE-'.random_int(1000, 9999),
            'estado' => 'activa',
        ])->assertStatus(403);

        $es = User::query()->where('email', 'educacion.superior@sices.local')->firstOrFail();
        Sanctum::actingAs($es);

        $this->postJson('/api/v1/certificacion/solicitudes-matricula/'.$sid.'/tomar-revision')->assertOk();
        $this->postJson('/api/v1/certificacion/solicitudes-matricula/'.$sid.'/devolver-observaciones', [
            'observaciones' => 'Falta constancia de estudios previos.',
        ])->assertOk();
        $this->assertSame(SolicitudMatricula::ESTADO_CON_OBSERVACIONES, SolicitudMatricula::query()->findOrFail($sid)->estado);

        Sanctum::actingAs($ce);
        $this->postJson('/api/v1/certificacion/solicitudes-matricula/'.$sid.'/atender-observaciones')->assertOk();
        $this->assertSame(SolicitudMatricula::ESTADO_BORRADOR, SolicitudMatricula::query()->findOrFail($sid)->estado);

        $this->postJson('/api/v1/certificacion/solicitudes-matricula/'.$sid.'/enviar')->assertOk();

        Sanctum::actingAs($es);
        $this->postJson('/api/v1/certificacion/solicitudes-matricula/'.$sid.'/tomar-revision')->assertOk();
        $this->postJson('/api/v1/certificacion/solicitudes-matricula/'.$sid.'/aprobar')->assertOk();
        $this->assertSame(SolicitudMatricula::ESTADO_APROBADA, SolicitudMatricula::query()->findOrFail($sid)->estado);

        $clave = 'NORM-ASG-'.random_int(10000, 99999);
        $this->postJson('/api/v1/certificacion/solicitudes-matricula/'.$sid.'/asignar-matricula', [
            'matricula' => $clave,
            'estado' => 'activa',
        ])->assertOk();

        $s = SolicitudMatricula::query()->findOrFail($sid);
        $this->assertSame(SolicitudMatricula::ESTADO_MATRICULA_ASIGNADA, $s->estado);
        $this->assertNotNull($s->matricula_id);
        $this->assertSame($clave, Matricula::query()->findOrFail((int) $s->matricula_id)->matricula);

        $audAsigna = AuditoriaEvento::query()
            ->where('evento', 'solicitud_matricula.asignar_matricula')
            ->where('entidad_id', $sid)
            ->latest('id')
            ->first();
        $this->assertNotNull($audAsigna);
        $this->assertSame('NORMAL', data_get($audAsigna->payload, 'subsistema_clave'));

        $this->postJson('/api/v1/certificacion/solicitudes-matricula', [
            'alumno_id' => $alumnoNormal->id,
            'oferta_academica_id' => $normal['oferta_id'],
            'ciclo_ingreso_id' => $normal['ciclo_id'],
        ])->assertStatus(422);

        $this->postJson('/api/v1/certificacion/matriculas', [
            'alumno_id' => $alumnoNormal->id,
            'oferta_academica_id' => $normal['oferta_id'],
            'ciclo_escolar_id' => $normal['ciclo_id'],
            'matricula' => 'OTRA-ACT-'.random_int(10000, 99999),
            'estado' => 'activa',
        ])->assertStatus(422);

        $alumnoOtro = Alumno::query()->create([
            'curp' => sprintf('SOOT900101HDF%05d', random_int(10000, 99999)),
            'nombre' => 'Otro',
            'primer_apellido' => 'DupClave',
        ]);
        Sanctum::actingAs($ce);
        $this->vincularControlEscolarAInstitucion($ce, (int) $normal['institucion_id']);
        $rOtro = $this->postJson('/api/v1/certificacion/solicitudes-matricula', [
            'alumno_id' => $alumnoOtro->id,
            'oferta_academica_id' => $normal['oferta_id'],
            'ciclo_ingreso_id' => $normal['ciclo_id'],
        ]);
        $rOtro->assertCreated();
        $sidOtro = (int) $rOtro->json('data.id');
        $this->postJson('/api/v1/certificacion/solicitudes-matricula/'.$sidOtro.'/enviar')->assertOk();
        Sanctum::actingAs($es);
        $this->postJson('/api/v1/certificacion/solicitudes-matricula/'.$sidOtro.'/tomar-revision')->assertOk();
        $this->postJson('/api/v1/certificacion/solicitudes-matricula/'.$sidOtro.'/aprobar')->assertOk();
        $this->postJson('/api/v1/certificacion/solicitudes-matricula/'.$sidOtro.'/asignar-matricula', [
            'matricula' => $clave,
            'estado' => 'activa',
        ])->assertStatus(422);

        Sanctum::actingAs($ce);
        $this->vincularControlEscolarAInstitucion($ce, (int) $upn['institucion_id']);
        $rUpn = $this->postJson('/api/v1/certificacion/solicitudes-matricula', [
            'alumno_id' => $alumnoUpn->id,
            'oferta_academica_id' => $upn['oferta_id'],
            'ciclo_ingreso_id' => $upn['ciclo_id'],
        ]);
        $rUpn->assertCreated();
        $sidUpn = (int) $rUpn->json('data.id');
        $this->postJson('/api/v1/certificacion/solicitudes-matricula/'.$sidUpn.'/enviar')->assertOk();
        Sanctum::actingAs($es);
        $this->postJson('/api/v1/certificacion/solicitudes-matricula/'.$sidUpn.'/tomar-revision')->assertOk();
        $this->postJson('/api/v1/certificacion/solicitudes-matricula/'.$sidUpn.'/aprobar')->assertOk();
        $claveUpn = 'UPN-ASG-'.random_int(10000, 99999);
        $this->postJson('/api/v1/certificacion/solicitudes-matricula/'.$sidUpn.'/asignar-matricula', [
            'matricula' => $claveUpn,
            'estado' => 'activa',
        ])->assertOk();
        $audUpn = AuditoriaEvento::query()
            ->where('evento', 'solicitud_matricula.asignar_matricula')
            ->where('entidad_id', $sidUpn)
            ->latest('id')
            ->first();
        $this->assertSame('UPN', data_get($audUpn->payload, 'subsistema_clave'));

        Sanctum::actingAs($ce);
        $dash = $this->getJson('/api/v1/control-escolar/dashboard');
        $dash->assertOk();
        $m = $dash->json('data.metricas');
        $this->assertArrayHasKey('solicitudes_matricula_borrador', $m);

        Sanctum::actingAs($es);
        $resumen = $this->getJson('/api/v1/certificacion/bandejas/documentos-academicos/resumen');
        $resumen->assertOk();
        $this->assertArrayHasKey('solicitudes_matricula_pendientes', $resumen->json('data'));

        $exp = $this->getJson('/api/v1/certificacion/alumnos/'.$alumnoNormal->id.'/resumen-institucional');
        $exp->assertOk();
        $this->assertSame($clave, $exp->json('data.matricula.clave_matricula'));
        $this->assertSame(SolicitudMatricula::ESTADO_MATRICULA_ASIGNADA, $exp->json('data.solicitud_matricula.estado'));
    }
}
