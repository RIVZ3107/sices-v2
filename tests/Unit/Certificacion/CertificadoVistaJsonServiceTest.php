<?php

declare(strict_types=1);

namespace Tests\Unit\Certificacion;

use App\Enums\Certificacion\EstadoFirma;
use App\Models\Alumno;
use App\Models\CicloEscolar;
use App\Models\DocumentoAcademico;
use App\Models\DocumentoVersion;
use App\Services\Certificacion\CertificadoVistaJsonService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class CertificadoVistaJsonServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_rechaza_vista_si_no_esta_firmado(): void
    {
        $alumno = Alumno::query()->create([
            'curp' => 'VISTA000000HDFABC12',
            'nombre' => 'Ana',
            'primer_apellido' => 'Lopez',
        ]);

        $ciclo = CicloEscolar::query()->create([
            'clave' => 'CIC-VISTA-1',
            'nombre' => 'Ciclo vista',
            'fecha_inicio' => '2024-08-01',
            'fecha_fin' => '2025-07-31',
            'es_actual' => true,
            'activo' => true,
        ]);

        $doc = DocumentoAcademico::query()->create([
            'alumno_id' => $alumno->id,
            'ciclo_escolar_id' => $ciclo->id,
            'tipo_documento' => 'certificado',
            'estado_firma' => EstadoFirma::NO_FIRMADO->value,
        ]);

        $this->expectException(ValidationException::class);
        app(CertificadoVistaJsonService::class)->construirVista($doc);
    }

    public function test_construye_vista_desde_xml_mysql(): void
    {
        $alumno = Alumno::query()->create([
            'curp' => 'VISTB000000HDFABC12',
            'nombre' => 'Luis',
            'primer_apellido' => 'Perez',
        ]);

        $ciclo = CicloEscolar::query()->create([
            'clave' => 'CIC-VISTA-2',
            'nombre' => 'Ciclo vista 2',
            'fecha_inicio' => '2024-08-01',
            'fecha_fin' => '2025-07-31',
            'es_actual' => true,
            'activo' => true,
        ]);

        $doc = DocumentoAcademico::query()->create([
            'alumno_id' => $alumno->id,
            'ciclo_escolar_id' => $ciclo->id,
            'tipo_documento' => 'certificado',
            'folio_interno' => 'FOL-VISTA-1',
            'folio_digital_sep' => 'SEP-999',
            'estado_firma' => EstadoFirma::FIRMADO->value,
            'fecha_firma' => now(),
        ]);

        DocumentoVersion::query()->create([
            'documento_academico_id' => $doc->id,
            'tipo' => 'XML_FIRMADO_SEP',
            'version' => 1,
            'contenido' => '<?xml version="1.0"?><Dec><FolioDigital>SEP-999</FolioDigital><Curp>VISTB000000HDFABC12</Curp><Nombre>Luis</Nombre></Dec>',
            'sha256' => hash('sha256', 'xml'),
            'activo' => true,
        ]);

        $vista = app(CertificadoVistaJsonService::class)->construirVista($doc->fresh());

        $this->assertSame('SEP-999', $vista['documento']['folio_digital_sep']);
        $this->assertSame('mysql_XML_FIRMADO_SEP', $vista['xml']['fuente']);
        $this->assertSame('SEP-999', $vista['xml']['parseado']['folio_digital'] ?? null);
    }
}
