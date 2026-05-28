<?php

declare(strict_types=1);

namespace Tests\Unit\Certificacion;

use App\Models\Alumno;
use App\Models\CicloEscolar;
use App\Models\DocumentoAcademico;
use App\Models\Institucion;
use App\Models\MateriaCursada;
use App\Models\Matricula;
use App\Models\NivelAcademico;
use App\Models\OfertaAcademica;
use App\Models\PlanEstudio;
use App\Models\ProgramaEstudio;
use App\Models\Region;
use App\Models\Sede;
use App\Models\Subsistema;
use App\Services\Certificacion\DocumentoMateriaSnapshotService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class DocumentoMateriaSnapshotServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_snapshot_de_materias_congela_datos_originales(): void
    {
        $ctx = $this->crearContexto();
        $ciclo = $ctx['ciclo'];

        $alumno = Alumno::query()->create([
            'curp' => 'AAAA000000HDFABC12',
            'nombre' => 'Ana',
            'primer_apellido' => 'Perez',
        ]);

        $matricula = Matricula::query()->create([
            'alumno_id' => $alumno->id,
            'oferta_academica_id' => $ctx['oferta']->id,
            'ciclo_escolar_id' => $ciclo->id,
            'matricula' => 'M-1',
        ]);

        $materia = MateriaCursada::query()->create([
            'alumno_id' => $alumno->id,
            'matricula_id' => $matricula->id,
            'ciclo_escolar_id' => $ciclo->id,
            'clave' => 'MAT001',
            'nombre' => 'Historia',
            'calificacion' => 8.5,
            'periodo' => '2024-1',
            'semestre' => 1,
            'creditos' => 8,
            'estado' => 'acreditada',
        ]);

        $documento = DocumentoAcademico::query()->create([
            'alumno_id' => $alumno->id,
            'matricula_id' => $matricula->id,
            'ciclo_escolar_id' => $ciclo->id,
            'tipo_documento' => 'certificado',
            'estado_workflow' => 'borrador',
            'estado_cadena' => 'no_generada',
            'estado_xml' => 'no_generado',
            'estado_firma' => 'no_firmado',
            'estado_pdf' => 'no_generado',
        ]);

        $service = app(DocumentoMateriaSnapshotService::class);
        $service->forzarRegeneracion($documento);

        $snapshot = $documento->materiasSnapshot()->firstOrFail();
        $this->assertSame('Historia', $snapshot->nombre);
        $this->assertSame('8.50', (string) $snapshot->calificacion_final);

        $materia->update([
            'nombre' => 'Historia Contemporanea',
            'calificacion' => 10,
        ]);

        $snapshot->refresh();
        $this->assertSame('Historia', $snapshot->nombre);
        $this->assertSame('8.50', (string) $snapshot->calificacion_final);
    }

    public function test_forzar_regeneracion_bloqueada_si_documento_firmado(): void
    {
        $ctx = $this->crearContexto();
        $documento = $this->crearDocumento($ctx, ['estado_firma' => 'firmado']);

        $service = app(DocumentoMateriaSnapshotService::class);

        $this->expectException(ValidationException::class);
        $service->forzarRegeneracion($documento);
    }

    public function test_forzar_regeneracion_bloqueada_si_cadena_generada(): void
    {
        $ctx = $this->crearContexto();
        $documento = $this->crearDocumento($ctx, ['estado_cadena' => 'generada']);

        $service = app(DocumentoMateriaSnapshotService::class);

        $this->expectException(ValidationException::class);
        $service->forzarRegeneracion($documento);
    }

    public function test_ordenes_snapshot_sin_duplicados_cuando_algunas_materias_traen_orden(): void
    {
        $ctx = $this->crearContexto();
        $ciclo = $ctx['ciclo'];

        $alumno = Alumno::query()->create([
            'curp' => 'BBBB000000HDFABC12',
            'nombre' => 'Luis',
            'primer_apellido' => 'Lopez',
        ]);

        $matricula = Matricula::query()->create([
            'alumno_id' => $alumno->id,
            'oferta_academica_id' => $ctx['oferta']->id,
            'ciclo_escolar_id' => $ciclo->id,
            'matricula' => 'M-2',
        ]);

        MateriaCursada::query()->create([
            'alumno_id' => $alumno->id,
            'matricula_id' => $matricula->id,
            'ciclo_escolar_id' => $ciclo->id,
            'clave' => 'MAT001',
            'nombre' => 'A',
            'calificacion' => 8,
            'periodo' => '2024-1',
            'semestre' => 1,
            'orden' => 1,
            'estado' => 'acreditada',
        ]);
        MateriaCursada::query()->create([
            'alumno_id' => $alumno->id,
            'matricula_id' => $matricula->id,
            'ciclo_escolar_id' => $ciclo->id,
            'clave' => 'MAT002',
            'nombre' => 'B',
            'calificacion' => 9,
            'periodo' => '2024-1',
            'semestre' => 1,
            'orden' => 1,
            'estado' => 'acreditada',
        ]);
        MateriaCursada::query()->create([
            'alumno_id' => $alumno->id,
            'matricula_id' => $matricula->id,
            'ciclo_escolar_id' => $ciclo->id,
            'clave' => 'MAT003',
            'nombre' => 'C',
            'calificacion' => 10,
            'periodo' => '2024-1',
            'semestre' => 1,
            'estado' => 'acreditada',
        ]);

        $documento = DocumentoAcademico::query()->create([
            'alumno_id' => $alumno->id,
            'matricula_id' => $matricula->id,
            'ciclo_escolar_id' => $ciclo->id,
            'tipo_documento' => 'certificado',
            'estado_workflow' => 'borrador',
            'estado_cadena' => 'no_generada',
            'estado_xml' => 'no_generado',
            'estado_firma' => 'no_firmado',
            'estado_pdf' => 'no_generado',
        ]);

        app(DocumentoMateriaSnapshotService::class)->forzarRegeneracion($documento);

        $ordenes = $documento->materiasSnapshot()->orderBy('orden')->pluck('orden')->all();
        $this->assertSame([1, 2, 3], $ordenes);
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function crearDocumento(array $ctx, array $overrides = []): DocumentoAcademico
    {
        $ciclo = $ctx['ciclo'];
        $alumno = Alumno::query()->create([
            'curp' => 'CCCC000000HDFABC12',
            'nombre' => 'Pedro',
            'primer_apellido' => 'Ruiz',
        ]);
        $matricula = Matricula::query()->create([
            'alumno_id' => $alumno->id,
            'oferta_academica_id' => $ctx['oferta']->id,
            'ciclo_escolar_id' => $ciclo->id,
            'matricula' => 'M-3',
        ]);
        MateriaCursada::query()->create([
            'alumno_id' => $alumno->id,
            'matricula_id' => $matricula->id,
            'ciclo_escolar_id' => $ciclo->id,
            'clave' => 'MAT010',
            'nombre' => 'Geografia',
            'calificacion' => 7,
            'periodo' => '2024-1',
            'semestre' => 1,
            'estado' => 'acreditada',
        ]);

        return DocumentoAcademico::query()->create(array_merge([
            'alumno_id' => $alumno->id,
            'matricula_id' => $matricula->id,
            'ciclo_escolar_id' => $ciclo->id,
            'tipo_documento' => 'certificado',
            'estado_workflow' => 'borrador',
            'estado_cadena' => 'no_generada',
            'estado_xml' => 'no_generado',
            'estado_firma' => 'no_firmado',
            'estado_pdf' => 'no_generado',
        ], $overrides));
    }

    /**
     * @return array{ciclo:CicloEscolar, oferta:OfertaAcademica}
     */
    private function crearContexto(): array
    {
        $suffix = substr(str_replace('.', '', uniqid('', true)), -6);

        $subsistema = Subsistema::query()->updateOrCreate(
            ['clave' => 'NORMAL'],
            ['nombre' => 'Educación Normal', 'nombre_corto' => 'Normal', 'activo' => true],
        );
        $region = Region::query()->create([
            'subsistema_id' => $subsistema->id,
            'clave' => 'REG'.$suffix,
            'nombre' => 'Region Test',
            'activo' => true,
        ]);
        $institucion = Institucion::query()->create([
            'subsistema_id' => $subsistema->id,
            'region_id' => $region->id,
            'clave' => 'INS'.$suffix,
            'nombre' => 'Institucion Test',
            'activo' => true,
        ]);
        $sede = Sede::query()->create([
            'institucion_id' => $institucion->id,
            'region_id' => $region->id,
            'clave' => 'SED'.$suffix,
            'nombre' => 'Sede Test',
            'activo' => true,
        ]);
        $nivel = NivelAcademico::query()->create([
            'clave' => 'NT'.$suffix,
            'nombre' => 'Nivel Test',
            'activo' => true,
        ]);
        $programa = ProgramaEstudio::query()->create([
            'nivel_academico_id' => $nivel->id,
            'clave' => 'PRO'.$suffix,
            'nombre' => 'Programa Test',
            'activo' => true,
        ]);
        $plan = PlanEstudio::query()->create([
            'programa_estudio_id' => $programa->id,
            'clave' => 'PLA'.$suffix,
            'nombre' => 'Plan Test',
            'activo' => true,
        ]);
        $ciclo = CicloEscolar::query()->create([
            'clave' => 'CIC'.$suffix,
            'nombre' => 'Ciclo prueba',
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
            'clave' => 'OFE'.$suffix,
            'modalidad' => 'escolarizada',
            'activo' => true,
        ]);

        return ['ciclo' => $ciclo, 'oferta' => $oferta];
    }
}
