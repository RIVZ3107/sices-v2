<?php

declare(strict_types=1);

namespace Tests\Unit\Certificacion;

use App\Models\Alumno;
use App\Models\CicloEscolar;
use App\Models\DocumentoAcademico;
use App\Models\DocumentoObservacion;
use App\Models\User;
use App\Services\Certificacion\ValidacionAcademicaDocumentoService;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ValidacionAcademicaDocumentoServiceTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    public function test_resumen_incluye_error_por_observaciones_pendientes(): void
    {
        $service = app(ValidacionAcademicaDocumentoService::class);
        $usuario = User::factory()->create();

        $alumno = Alumno::query()->create([
            'curp' => sprintf('AAAA000000HDF%05d', random_int(10000, 99999)),
            'nombre' => 'Alumno',
            'primer_apellido' => 'Prueba',
        ]);

        $ciclo = CicloEscolar::query()->create([
            'clave' => 'CIC-TEST-'.substr(str_replace('.', '', uniqid('', true)), 0, 6),
            'nombre' => 'Ciclo test',
            'fecha_inicio' => '2024-08-01',
            'fecha_fin' => '2025-07-31',
            'es_actual' => true,
            'activo' => true,
        ]);

        $documento = DocumentoAcademico::query()->create([
            'alumno_id' => $alumno->id,
            'ciclo_escolar_id' => $ciclo->id,
            'tipo_documento' => 'certificado',
            'estado_workflow' => 'en_revision',
            'estado_cadena' => 'no_generada',
            'estado_xml' => 'no_generado',
            'estado_firma' => 'no_firmado',
            'estado_pdf' => 'no_generado',
            'created_by' => $usuario->id,
        ]);

        DocumentoObservacion::query()->create([
            'documento_academico_id' => $documento->id,
            'tipo' => 'academica',
            'seccion' => 'general',
            'observacion' => 'Pendiente de corrección',
            'estado' => 'pendiente',
            'prioridad' => 'media',
            'creada_por' => $usuario->id,
        ]);

        $resumen = $service->resumen($documento);

        $this->assertFalse($resumen['ok_aprobacion']);
        $this->assertFalse($resumen['validaciones']['observaciones']['ok']);
        $this->assertContains('Existen observaciones pendientes por atender.', $resumen['validaciones']['observaciones']['errores']);
    }
}
