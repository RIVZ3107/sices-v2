<?php

declare(strict_types=1);

namespace Tests\Unit\Certificacion;

use App\Enums\Certificacion\DocumentoVersionTipo;
use App\Models\Alumno;
use App\Models\CicloEscolar;
use App\Models\DocumentoAcademico;
use App\Models\FirmanteAutorizado;
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
use App\Services\Certificacion\CadenaOriginalDecNormal2025Builder;
use App\Services\Certificacion\DecNormal2025PayloadBuilder;
use App\Services\Certificacion\DecNormal2025PipelineService;
use App\Services\Certificacion\DocumentoMateriaSnapshotService;
use App\Services\Certificacion\XmlDecNormal2025Builder;
use App\Services\Certificacion\ValidacionDecNormal2025Service;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class DecNormal2025BuildersTest extends TestCase
{
    use RefreshDatabase;

    public function test_cadena_dec_tiene_doble_pipe_y_no_incluye_sep_ni_nombre_asignatura_y_usa_curp_completa(): void
    {
        $documento = $this->crearDocumentoConSnapshot();
        $payload = app(DecNormal2025PayloadBuilder::class)->build($documento);

        $cadena = app(CadenaOriginalDecNormal2025Builder::class)->build($payload);

        $this->assertTrue(str_starts_with($cadena, '||'));
        $this->assertTrue(str_ends_with($cadena, '||'));
        $this->assertStringNotContainsString('Sep', $cadena);
        $this->assertStringNotContainsString('Historia', $cadena);
        $this->assertStringContainsString((string) $documento->alumno->curp, $cadena);
    }

    public function test_xml_dec_incluye_nodos_en_orden_y_entidad_firmante_coincide(): void
    {
        $documento = $this->crearDocumentoConSnapshot();
        $payload = app(DecNormal2025PayloadBuilder::class)->build($documento);
        $cadena = app(CadenaOriginalDecNormal2025Builder::class)->build($payload);

        $xml = app(XmlDecNormal2025Builder::class)->buildXml($payload, $cadena);

        $this->assertLessThan(strpos($xml, '<FirmaResponsable'), strpos($xml, '<ServicioFirmante'));
        $this->assertLessThan(strpos($xml, '<ServicioEducativo'), strpos($xml, '<FirmaResponsable'));
        $this->assertLessThan(strpos($xml, '<Carrera'), strpos($xml, '<ServicioEducativo'));
        $this->assertLessThan(strpos($xml, '<Alumno'), strpos($xml, '<Carrera'));
        $this->assertLessThan(strpos($xml, '<Acreditacion'), strpos($xml, '<Alumno'));
        $this->assertLessThan(strpos($xml, '<AsignaturasCursos'), strpos($xml, '<Acreditacion'));
        $this->assertSame(
            (string) $payload['ServicioFirmante']['idEntidad'],
            (string) $payload['ServicioEducativo']['idEntidadFederativa'],
        );
        $this->assertStringNotContainsString('<Sep', $xml);
    }

    public function test_documento_versiones_guarda_xml_dec_local_con_hash(): void
    {
        $documento = $this->crearDocumentoConSnapshot();
        $payload = app(DecNormal2025PayloadBuilder::class)->build($documento);
        $cadena = app(CadenaOriginalDecNormal2025Builder::class)->build($payload);

        $version = app(XmlDecNormal2025Builder::class)->generarYGuardar($documento, $payload, $cadena);

        $this->assertSame(DocumentoVersionTipo::XML_DEC_LOCAL->value, $version->tipo);
        $this->assertNotNull($version->sha256);
        $this->assertSame(hash('sha256', (string) $version->contenido), $version->sha256);
    }

    public function test_pipeline_guarda_payload_y_cadena_con_hash(): void
    {
        $documento = $this->crearDocumentoConSnapshot();
        $pipeline = app(DecNormal2025PipelineService::class);

        $pipeline->generarCadena($documento);

        $payloadVersion = $documento->versiones()->where('tipo', DocumentoVersionTipo::PAYLOAD_DEC->value)->latest('id')->first();
        $cadenaVersion = $documento->versiones()->where('tipo', DocumentoVersionTipo::CADENA_ORIGINAL_DEC->value)->latest('id')->first();
        $this->assertNotNull($payloadVersion);
        $this->assertNotNull($cadenaVersion);
        $this->assertNotNull($payloadVersion->sha256);
        $this->assertNotNull($cadenaVersion->sha256);
    }

    public function test_xml_dec_valida_con_xsd_local(): void
    {
        $documento = $this->crearDocumentoConSnapshot();
        $payload = app(DecNormal2025PayloadBuilder::class)->build($documento);
        $cadena = app(CadenaOriginalDecNormal2025Builder::class)->build($payload);
        $xml = app(XmlDecNormal2025Builder::class)->buildXml($payload, $cadena);

        $resultado = app(ValidacionDecNormal2025Service::class)->validarXmlContraXsd($xml);

        $this->assertTrue($resultado['ok'], implode('; ', $resultado['errores']));
    }

    public function test_no_genera_xml_si_cadena_no_es_valida(): void
    {
        $documento = $this->crearDocumentoConSnapshot();
        $payload = app(DecNormal2025PayloadBuilder::class)->build($documento);

        $this->expectException(ValidationException::class);
        app(XmlDecNormal2025Builder::class)->buildXml($payload, 'cadena-sin-pipes');
    }

    public function test_falla_si_no_hay_snapshot_para_payload(): void
    {
        $documento = $this->crearDocumentoConSnapshot(false);

        $this->expectException(ValidationException::class);
        app(DecNormal2025PayloadBuilder::class)->build($documento);
    }

    public function test_falla_si_falta_firmante_responsable(): void
    {
        $documento = $this->crearDocumentoConSnapshot(true, false);

        $this->expectException(ValidationException::class);
        app(DecNormal2025PayloadBuilder::class)->build($documento);
    }

    public function test_falla_validacion_si_institucion_o_plan_sin_datos_dec_obligatorios(): void
    {
        $documento = $this->crearDocumentoConSnapshot();
        $documento->institucion()->update(['clave' => '']);

        $payload = app(DecNormal2025PayloadBuilder::class)->build($documento->fresh());

        $this->expectException(ValidationException::class);
        app(ValidacionDecNormal2025Service::class)->validarPayload($payload);
    }

    private function crearDocumentoConSnapshot(bool $conSnapshot = true, bool $conFirmante = true): DocumentoAcademico
    {
        $suffix = substr(str_replace('.', '', uniqid('', true)), -6);
        $subsistema = Subsistema::query()->create([
            'clave' => 'NORMAL',
            'nombre' => 'Educación Normal',
            'activo' => true,
        ]);
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
            'clave' => 'NIV'.$suffix,
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
            'nombre' => 'Ciclo test',
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
        $alumno = Alumno::query()->create([
            'curp' => 'AAAA000000HDFABC12',
            'nombre' => 'Ana',
            'primer_apellido' => 'Lopez',
            'genero' => 'M',
        ]);
        $matricula = Matricula::query()->create([
            'alumno_id' => $alumno->id,
            'oferta_academica_id' => $oferta->id,
            'ciclo_escolar_id' => $ciclo->id,
            'matricula' => 'M'.$suffix,
        ]);
        MateriaCursada::query()->create([
            'alumno_id' => $alumno->id,
            'matricula_id' => $matricula->id,
            'ciclo_escolar_id' => $ciclo->id,
            'clave' => 'MAT001',
            'nombre' => 'Historia',
            'calificacion' => 8.0,
            'periodo' => '2024-1',
            'semestre' => 1,
            'creditos' => 8,
            'estado' => 'acreditada',
        ]);
        $documento = DocumentoAcademico::query()->create([
            'alumno_id' => $alumno->id,
            'matricula_id' => $matricula->id,
            'oferta_academica_id' => $oferta->id,
            'ciclo_escolar_id' => $ciclo->id,
            'subsistema_id' => $subsistema->id,
            'region_id' => $region->id,
            'institucion_id' => $institucion->id,
            'sede_id' => $sede->id,
            'tipo_documento' => 'certificado',
            'tipo_certificacion' => 'total',
            'estado_workflow' => 'aprobado',
            'estado_cadena' => 'no_generada',
            'estado_xml' => 'no_generado',
            'estado_firma' => 'no_firmado',
            'estado_sep' => 'no_enviado',
            'estado_pdf' => 'no_generado',
            'fecha_aprobacion' => now(),
        ]);

        if ($conFirmante) {
            FirmanteAutorizado::query()->create([
                'subsistema_id' => $subsistema->id,
                'institucion_id' => $institucion->id,
                'nombre' => 'Laura',
                'primer_apellido' => 'Perez',
                'curp' => 'PEPL800101MDFRRR01',
                'cargo' => 'RESPONSABLE_CONTROL_ESCOLAR',
                'estatus' => 'activo',
                'vigencia_inicio' => now()->subYear(),
                'vigencia_fin' => now()->addYear(),
            ]);
        }

        if ($conSnapshot) {
            app(DocumentoMateriaSnapshotService::class)->forzarRegeneracion($documento);
        }

        return $documento->fresh();
    }
}
