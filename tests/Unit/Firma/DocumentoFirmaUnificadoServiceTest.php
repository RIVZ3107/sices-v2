<?php

declare(strict_types=1);

namespace Tests\Unit\Firma;

use App\Data\Firma\FirmaDocumentoResult;
use App\Enums\Certificacion\CanalFirmaDocumento;
use App\Enums\Certificacion\EstadoFirma;
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
use App\Services\Firma\DocumentoFirmaCanalResolver;
use App\Services\Firma\DocumentoFirmaPostFirmaService;
use App\Services\Firma\DocumentoFirmaUnificadoService;
use App\Services\Firma\Handlers\GradoSepFirmaHandler;
use App\Services\Firma\Handlers\NormalCertificadoSepFirmaHandler;
use App\Services\Firma\Handlers\TituloSepFirmaHandler;
use App\Services\Firma\Handlers\UpnFirmaLocalPdfHandler;
use App\Models\AuditoriaEvento;
use Illuminate\Foundation\Testing\LazilyRefreshDatabase;
use Mockery;
use Tests\TestCase;

class DocumentoFirmaUnificadoServiceTest extends TestCase
{
    use LazilyRefreshDatabase;

    protected function tearDown(): void
    {
        Mockery::close();
        parent::tearDown();
    }

    public function test_delega_handler_normal_y_post_firma(): void
    {
        $documento = $this->crearDocumentoPersistido('NORMAL', 'certificado');

        $normalHandler = Mockery::mock(NormalCertificadoSepFirmaHandler::class);
        $normalHandler->shouldReceive('firmar')->once()->andReturn(new FirmaDocumentoResult(
            success: true,
            message: 'OK',
            documentoId: $documento->id,
            urlShort: 'SHORT10',
            folioDigitalSep: 'FOL-10',
            estadoFirma: EstadoFirma::FIRMADO->value,
            canalFirma: CanalFirmaDocumento::NORMAL_CERTIFICADO_SEP->value,
        ));

        $postFirma = Mockery::mock(DocumentoFirmaPostFirmaService::class);
        $postFirma->shouldReceive('asegurarConsultaPublica')->once()->andReturn('TOKEN-PUBLICO');

        $service = new DocumentoFirmaUnificadoService(
            new DocumentoFirmaCanalResolver,
            $postFirma,
            $this->auditoriaNula(),
            $normalHandler,
            Mockery::mock(UpnFirmaLocalPdfHandler::class),
            Mockery::mock(TituloSepFirmaHandler::class),
            Mockery::mock(GradoSepFirmaHandler::class),
        );

        $result = $service->firmar($documento);

        $this->assertTrue($result->success);
        $this->assertSame('TOKEN-PUBLICO', $result->urlShort);
        $this->assertSame(CanalFirmaDocumento::NORMAL_CERTIFICADO_SEP->value, $result->canalFirma);
    }

    public function test_rechaza_documento_ya_firmado_sin_delegar(): void
    {
        $documento = $this->crearDocumentoPersistido('NORMAL', 'certificado', EstadoFirma::FIRMADO->value);

        $normalHandler = Mockery::mock(NormalCertificadoSepFirmaHandler::class);
        $normalHandler->shouldNotReceive('firmar');

        $service = new DocumentoFirmaUnificadoService(
            new DocumentoFirmaCanalResolver,
            Mockery::mock(DocumentoFirmaPostFirmaService::class),
            $this->auditoriaNula(),
            $normalHandler,
            Mockery::mock(UpnFirmaLocalPdfHandler::class),
            Mockery::mock(TituloSepFirmaHandler::class),
            Mockery::mock(GradoSepFirmaHandler::class),
        );

        $result = $service->firmar($documento);

        $this->assertFalse($result->success);
        $this->assertSame('ya_firmado', $result->errorCode);
    }

    public function test_resolver_canales(): void
    {
        $resolver = new DocumentoFirmaCanalResolver;

        $upn = new DocumentoAcademico(['tipo_documento' => 'certificado']);
        $upn->setRelation('subsistema', new Subsistema(['clave' => 'UPN']));
        $this->assertSame(CanalFirmaDocumento::UPN_FIRMA_LOCAL, $resolver->resolver($upn));

        $grado = new DocumentoAcademico(['tipo_documento' => 'grado']);
        $grado->setRelation('subsistema', new Subsistema(['clave' => 'NORMAL']));
        $this->assertSame(CanalFirmaDocumento::GRADO_SEP, $resolver->resolver($grado));

        $titulo = new DocumentoAcademico(['tipo_documento' => 'titulo']);
        $titulo->setRelation('subsistema', new Subsistema(['clave' => 'NORMAL']));
        $this->assertSame(CanalFirmaDocumento::TITULO_SEP, $resolver->resolver($titulo));

        $normal = new DocumentoAcademico(['tipo_documento' => 'certificado']);
        $normal->setRelation('subsistema', new Subsistema(['clave' => 'NORMAL']));
        $this->assertSame(CanalFirmaDocumento::NORMAL_CERTIFICADO_SEP, $resolver->resolver($normal));
    }

    public function test_configuracion_canales_incluye_flags(): void
    {
        $service = app(DocumentoFirmaUnificadoService::class);
        $config = $service->configuracionCanales();

        $this->assertArrayHasKey('canales', $config);
        $this->assertArrayHasKey('since_firma_enabled', $config);
        $this->assertArrayHasKey('upn_firma_local_enabled', $config);
        $claves = array_column($config['canales'], 'clave');
        $this->assertContains('normal_certificado_sep', $claves);
        $this->assertContains('upn_firma_local', $claves);

        $normal = collect($config['canales'])->firstWhere('clave', 'normal_certificado_sep');
        $this->assertArrayHasKey('habilitado', $normal);
        $this->assertArrayHasKey('simulated', $normal);
    }

    private function crearDocumentoPersistido(
        string $subsistemaClave,
        string $tipoDocumento,
        string $estadoFirma = 'no_firmado',
    ): DocumentoAcademico {
        $subsistema = Subsistema::query()->firstOrCreate(
            ['clave' => $subsistemaClave],
            ['nombre' => $subsistemaClave, 'activo' => true],
        );

        $region = Region::query()->firstOrCreate(
            ['clave' => 'REG-FIRMA-'.$subsistema->id],
            [
                'subsistema_id' => $subsistema->id,
                'nombre' => 'Región firma test',
                'activo' => true,
            ],
        );

        $institucion = Institucion::query()->firstOrCreate(
            ['clave' => 'INS-FIRMA-'.$subsistema->id],
            [
                'subsistema_id' => $subsistema->id,
                'region_id' => $region->id,
                'nombre' => 'Institución firma test',
                'activo' => true,
            ],
        );

        $sede = Sede::query()->firstOrCreate(
            ['clave' => 'CCT-FIRMA-'.$subsistema->id],
            [
                'institucion_id' => $institucion->id,
                'region_id' => $region->id,
                'nombre' => 'Sede firma test',
                'activo' => true,
            ],
        );

        $nivel = NivelAcademico::query()->firstOrCreate(
            ['clave' => 'LIC'],
            ['nombre' => 'Licenciatura', 'activo' => true],
        );

        $programa = ProgramaEstudio::query()->firstOrCreate(
            ['clave' => 'PROG-FIRMA-'.$subsistema->id],
            [
                'nivel_academico_id' => $nivel->id,
                'subsistema_id' => $subsistema->id,
                'nombre' => 'Programa firma test',
                'activo' => true,
            ],
        );

        $plan = PlanEstudio::query()->firstOrCreate(
            ['clave' => 'PLAN-FIRMA-'.$subsistema->id],
            [
                'programa_estudio_id' => $programa->id,
                'subsistema_id' => $subsistema->id,
                'nombre' => 'Plan firma test',
                'activo' => true,
            ],
        );

        $ciclo = CicloEscolar::query()->firstOrCreate(
            ['clave' => 'CIC-FIRMA-TEST'],
            [
                'nombre' => 'Ciclo firma test',
                'fecha_inicio' => '2024-08-01',
                'fecha_fin' => '2025-07-31',
                'activo' => true,
            ],
        );

        $oferta = OfertaAcademica::query()->firstOrCreate(
            ['clave' => 'OFE-FIRMA-'.$subsistema->id],
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
            'curp' => sprintf('FIRM%014d', random_int(1000, 99999999999999)),
            'nombre' => 'Test',
            'primer_apellido' => 'Firma',
            'segundo_apellido' => 'Unificado',
        ]);

        return DocumentoAcademico::query()->create([
            'alumno_id' => $alumno->id,
            'ciclo_escolar_id' => $ciclo->id,
            'oferta_academica_id' => $oferta->id,
            'subsistema_id' => $subsistema->id,
            'region_id' => $region->id,
            'institucion_id' => $institucion->id,
            'sede_id' => $sede->id,
            'tipo_documento' => $tipoDocumento,
            'tipo_certificacion' => 'total',
            'estado_firma' => $estadoFirma,
        ]);
    }

    private function auditoriaNula(): \App\Services\Certificacion\AuditoriaService
    {
        $auditoria = Mockery::mock(\App\Services\Certificacion\AuditoriaService::class);
        $auditoria->shouldReceive('registrar')->andReturn(new AuditoriaEvento);

        return $auditoria;
    }
}
