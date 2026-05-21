<?php

declare(strict_types=1);

namespace Tests\Unit\SicesLegacy;

use App\Contracts\SicesLegacy\SicesLegacyCertificadoRepositoryInterface;
use App\Data\SicesLegacy\SicesLegacyCertificadoData;
use App\Data\SicesLegacy\SicesLegacyMateriaData;
use App\Models\Alumno;
use App\Models\CicloEscolar;
use App\Models\DocumentoAcademico;
use App\Models\DocumentoMateriaSnapshot;
use App\Services\SicesLegacy\SicesLegacyConsultaService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Mockery;
use Tests\TestCase;

class SicesLegacyConsultaServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_comparacion_detecta_materias_coincidentes(): void
    {
        Config::set('sices_legacy.enabled', true);

        $cert = new SicesLegacyCertificadoData(
            idSices: 1,
            curp: 'COMP000000HDF00001',
            matricula: 'M1',
            nombreCompleto: 'Test',
            tipoCertificado: 'T',
            cicloEscolar: '2024-2025',
            urlShort: 'short1',
            folioDigitalSep: 'F1',
            osituac: 'F',
            istatus: null,
            opdf: 1,
            tieneXmlLocal: false,
            tieneXmlSep: true,
            fechaModificacion: null,
            institucion: null,
            cct: null,
            carrera: null,
            planEstudios: null,
        );

        $materias = collect([
            new SicesLegacyMateriaData('MAT01', 'Materia 1', '8', '1', '2024-1', '2024-2025', 'T', 'short1'),
            new SicesLegacyMateriaData('MAT02', 'Materia 2', '9', '2', '2024-2', '2024-2025', 'T', 'short1'),
        ]);

        $repo = Mockery::mock(SicesLegacyCertificadoRepositoryInterface::class);
        $repo->shouldReceive('buscarPorCurp')->andReturn(collect([$cert]));
        $repo->shouldReceive('obtenerMateriasPorCertificado')->andReturn($materias);

        $this->app->instance(SicesLegacyCertificadoRepositoryInterface::class, $repo);

        $alumno = Alumno::query()->create([
            'curp' => 'COMP000000HDF00001',
            'nombre' => 'A',
            'primer_apellido' => 'B',
            'segundo_apellido' => 'C',
        ]);

        $ciclo = $this->crearCicloEscolar();
        $documento = DocumentoAcademico::query()->create([
            'alumno_id' => $alumno->id,
            'ciclo_escolar_id' => $ciclo->id,
            'tipo_documento' => 'certificado',
            'tipo_certificacion' => 'total',
            'estado_workflow' => 'borrador',
        ]);

        foreach (['MAT01', 'MAT02'] as $i => $clave) {
            DocumentoMateriaSnapshot::query()->create([
                'documento_academico_id' => $documento->id,
                'clave' => $clave,
                'nombre' => 'Materia '.($i + 1),
                'calificacion_final' => 8 + $i,
            ]);
        }

        $result = app(SicesLegacyConsultaService::class)->compararMateriasConDocumento($documento);

        $this->assertTrue($result['success']);
        $this->assertTrue($result['materias']['coinciden']);
        $this->assertSame(2, $result['materias']['mysql']);
        $this->assertSame(2, $result['materias']['sices']);
    }

    public function test_comparacion_detecta_diferencias_de_conteo(): void
    {
        Config::set('sices_legacy.enabled', true);

        $cert = new SicesLegacyCertificadoData(
            idSices: 2,
            curp: 'COMP000000HDF00002',
            matricula: 'M2',
            nombreCompleto: 'Test',
            tipoCertificado: 'P',
            cicloEscolar: '2024-2025',
            urlShort: 'short2',
            folioDigitalSep: null,
            osituac: null,
            istatus: null,
            opdf: 0,
            tieneXmlLocal: false,
            tieneXmlSep: false,
            fechaModificacion: null,
            institucion: null,
            cct: null,
            carrera: null,
            planEstudios: null,
        );

        $repo = Mockery::mock(SicesLegacyCertificadoRepositoryInterface::class);
        $repo->shouldReceive('buscarPorCurp')->andReturn(collect([$cert]));
        $repo->shouldReceive('obtenerMateriasPorCertificado')->andReturn(collect([
            new SicesLegacyMateriaData('X', 'Una', '10', '1', '1', '2024-2025', 'P', null),
        ]));

        $this->app->instance(SicesLegacyCertificadoRepositoryInterface::class, $repo);

        $alumno = Alumno::query()->create([
            'curp' => 'COMP000000HDF00002',
            'nombre' => 'A',
            'primer_apellido' => 'B',
            'segundo_apellido' => 'C',
        ]);

        $ciclo = $this->crearCicloEscolar('CIC-UT2');
        $documento = DocumentoAcademico::query()->create([
            'alumno_id' => $alumno->id,
            'ciclo_escolar_id' => $ciclo->id,
            'tipo_documento' => 'certificado',
            'tipo_certificacion' => 'parcial',
            'estado_workflow' => 'borrador',
        ]);

        $result = app(SicesLegacyConsultaService::class)->compararMateriasConDocumento($documento);

        $this->assertFalse($result['materias']['coinciden']);
        $this->assertNotEmpty($result['materias']['diferencias']);
    }

    private function crearCicloEscolar(string $clave = 'CIC-UT1'): CicloEscolar
    {
        return CicloEscolar::query()->create([
            'clave' => $clave,
            'nombre' => '2024-2025',
            'fecha_inicio' => '2024-08-01',
            'fecha_fin' => '2025-07-31',
            'es_actual' => true,
            'activo' => true,
        ]);
    }
}
