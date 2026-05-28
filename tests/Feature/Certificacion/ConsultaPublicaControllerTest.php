<?php

declare(strict_types=1);

namespace Tests\Feature\Certificacion;

use App\Enums\Certificacion\EstadoFirma;
use App\Models\Alumno;
use App\Models\CicloEscolar;
use App\Models\DocumentoAcademico;
use App\Models\UrlShortToken;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Tests\TestCase;

class ConsultaPublicaControllerTest extends TestCase
{
    use LazilyRefreshDatabase;

    protected bool $seed = true;

    protected string $seeder = RolesAndPermissionsSeeder::class;

    public function test_consulta_publica_no_expone_datos_internos(): void
    {
        $alumno = Alumno::query()->create([
            'curp' => 'PUB000000HDFABC12',
            'nombre' => 'Maria',
            'primer_apellido' => 'Garcia',
        ]);

        $ciclo = CicloEscolar::query()->create([
            'clave' => 'CICPUB1',
            'nombre' => 'Ciclo publico',
            'fecha_inicio' => '2024-08-01',
            'fecha_fin' => '2025-07-31',
            'es_actual' => true,
            'activo' => true,
        ]);

        $documento = DocumentoAcademico::query()->create([
            'alumno_id' => $alumno->id,
            'ciclo_escolar_id' => $ciclo->id,
            'tipo_documento' => 'certificado',
            'folio_interno' => 'FOL-2024-001',
            'folio_digital_sep' => 'SEP-DIG-001',
            'estado_workflow' => 'aprobado',
            'estado_firma' => EstadoFirma::FIRMADO->value,
            'estado_cadena' => 'generada',
            'estado_xml' => 'timbrado',
            'estado_pdf' => 'no_generado',
            'fecha_firma' => now(),
        ]);

        UrlShortToken::query()->create([
            'documento_academico_id' => $documento->id,
            'token' => 'tok-consulta-publica-001',
            'estado' => 'activo',
        ]);

        $res = $this->getJson('/api/v1/consulta-publica/documentos/tok-consulta-publica-001');

        $res->assertOk()
            ->assertJsonPath('data.folio_interno', 'FOL-2024-001')
            ->assertJsonPath('data.folio_digital_sep', 'SEP-DIG-001')
            ->assertJsonPath('data.alumno.nombre', 'Maria Garcia')
            ->assertJsonMissingPath('data.token')
            ->assertJsonMissingPath('data.documento_id')
            ->assertJsonMissingPath('data.estado_workflow')
            ->assertJsonMissingPath('data.estado_firma')
            ->assertJsonMissingPath('data.consulta_publica');
    }
}
