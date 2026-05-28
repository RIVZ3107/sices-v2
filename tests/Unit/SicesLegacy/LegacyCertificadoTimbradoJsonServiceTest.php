<?php

declare(strict_types=1);

namespace Tests\Unit\SicesLegacy;

use App\Models\Alumno;
use App\Models\CicloEscolar;
use App\Models\DocumentoAcademico;
use App\Models\NivelAcademico;
use App\Models\DocumentoMateriaSnapshot;
use App\Models\Institucion;
use App\Models\Matricula;
use App\Models\OfertaAcademica;
use App\Models\PlanEstudio;
use App\Models\ProgramaEstudio;
use App\Models\Region;
use App\Models\Sede;
use App\Models\Subsistema;
use App\Services\Certificacion\IdentificadorAlumnoService;
use App\Services\SicesLegacy\LegacyCertificadoTimbradoJsonService;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

class LegacyCertificadoTimbradoJsonServiceTest extends TestCase
{
    use LazilyRefreshDatabase;

    public function test_exporta_campos_legacy_con_nombres_esperados(): void
    {
        $subsistema = Subsistema::query()->create([
            'clave' => 'NORMAL',
            'nombre' => 'Normal',
            'activo' => true,
        ]);
        $region = Region::query()->create([
            'subsistema_id' => $subsistema->id,
            'clave' => '15',
            'nombre' => 'México',
            'activo' => true,
        ]);
        $institucion = Institucion::query()->create([
            'subsistema_id' => $subsistema->id,
            'region_id' => $region->id,
            'clave' => 'DGP001',
            'nombre' => 'Instituto Demo',
            'activo' => true,
        ]);
        $sede = Sede::query()->create([
            'institucion_id' => $institucion->id,
            'region_id' => $region->id,
            'clave' => '09DPR0001A',
            'cct' => '09DPR0001A',
            'nombre' => 'Escuela Demo',
            'activo' => true,
            'metadata' => ['posible_municipio_detectado' => 'Tlalpan'],
        ]);
        $nivel = NivelAcademico::query()->create([
            'clave' => 'LIC',
            'nombre' => 'Licenciatura',
            'activo' => true,
        ]);
        $programa = ProgramaEstudio::query()->create([
            'nivel_academico_id' => $nivel->id,
            'subsistema_id' => $subsistema->id,
            'clave' => 'CARR01',
            'nombre' => 'Licenciatura en Educación',
            'activo' => true,
        ]);
        $ciclo = CicloEscolar::query()->create([
            'clave' => '2024-2025',
            'nombre' => '2024-2025',
            'fecha_inicio' => '2024-08-01',
            'fecha_fin' => '2025-07-31',
            'activo' => true,
        ]);
        $plan = PlanEstudio::query()->create([
            'programa_estudio_id' => $programa->id,
            'subsistema_id' => $subsistema->id,
            'clave' => '2020',
            'nombre' => 'Plan 2020',
            'activo' => true,
        ]);
        $oferta = OfertaAcademica::query()->create([
            'institucion_id' => $institucion->id,
            'sede_id' => $sede->id,
            'programa_estudio_id' => $programa->id,
            'plan_estudio_id' => $plan->id,
            'ciclo_escolar_id' => $ciclo->id,
            'clave' => 'OFA1',
            'modalidad' => 'escolarizada',
            'activo' => true,
        ]);

        $alumno = new Alumno([
            'curp' => 'CURP800101HDFXXX00',
            'nombre' => 'Juan',
            'primer_apellido' => 'Pérez',
            'segundo_apellido' => 'López',
        ]);
        app(IdentificadorAlumnoService::class)->aplicarAlModelo($alumno);
        $alumno->save();

        $matricula = Matricula::query()->create([
            'alumno_id' => $alumno->id,
            'subsistema_id' => $subsistema->id,
            'oferta_academica_id' => $oferta->id,
            'ciclo_escolar_id' => $ciclo->id,
            'matricula' => 'MAT-2024-001',
            'estado' => 'activa',
        ]);

        $documento = DocumentoAcademico::query()->create([
            'subsistema_id' => $subsistema->id,
            'region_id' => $region->id,
            'institucion_id' => $institucion->id,
            'sede_id' => $sede->id,
            'oferta_academica_id' => $oferta->id,
            'ciclo_escolar_id' => $ciclo->id,
            'alumno_id' => $alumno->id,
            'matricula_id' => $matricula->id,
            'tipo_documento' => 'certificado',
            'tipo_certificacion' => 'total',
            'snapshot_json' => ['promedio' => 9.25],
            'fecha_aprobacion' => '2025-06-01',
        ]);

        DocumentoMateriaSnapshot::query()->create([
            'documento_academico_id' => $documento->id,
            'clave' => 'MAT101',
            'nombre' => 'Álgebra',
            'calificacion_final' => 9.0,
            'semestre' => 1,
            'periodo' => '2024-2025',
            'orden' => 1,
        ]);

        $service = app(LegacyCertificadoTimbradoJsonService::class);
        $resultado = $service->exportar($documento->fresh());

        $this->assertTrue($resultado->valido);
        $cert = $resultado->e11superiorCert;
        $this->assertSame('Juan', $cert['nombre']);
        $this->assertSame('Pérez', $cert['primerApellido']);
        $this->assertSame('López', $cert['segundoApellido']);
        $this->assertSame('CURP800101HDFXXX00', $cert['curp']);
        $this->assertSame('00', $cert['odigitoCurp']);
        $this->assertSame('DGP001', $cert['claveInstitucion']);
        $this->assertSame('09DPR0001A', $cert['cct']);
        $this->assertSame('Escuela Demo', $cert['nombreEscuela']);
        $this->assertSame('15', $cert['idEntidad']);
        $this->assertSame('Tlalpan', $cert['municipio']);
        $this->assertSame('CARR01', $cert['claveCarrera']);
        $this->assertSame('Licenciatura en Educación', $cert['carrera']);
        $this->assertSame('2020', $cert['planEstudios']);
        $this->assertSame('T', $cert['tipoCertificado']);
        $this->assertSame('2025-06-01', $cert['fechaExpedicion']);
        $this->assertSame('9.25', $cert['promedio']);

        $this->assertCount(1, $resultado->e11materiasCert);
        $mat = $resultado->e11materiasCert[0];
        $this->assertSame('MAT101', $mat['clave_materia']);
        $this->assertSame('Álgebra', $mat['nombre_materia']);
        $this->assertSame('9.0', $mat['calificacionFinal_materia']);
        $this->assertSame('1', $mat['semestre_materia']);
        $this->assertSame('2024-2025', $mat['periodo']);
    }

    public function test_tipo_parcial_mapea_a_p(): void
    {
        $doc = new DocumentoAcademico(['tipo_certificacion' => 'parcial']);
        $service = app(LegacyCertificadoTimbradoJsonService::class);

        $this->assertSame('P', $service->buildE11SuperiorCert($doc)['tipoCertificado']);
    }
}
