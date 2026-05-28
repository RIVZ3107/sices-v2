<?php

declare(strict_types=1);

namespace Tests\Feature\SicesLegacy;

use App\Contracts\SicesLegacy\SicesLegacyCertificadoRepositoryInterface;
use App\Exceptions\Legacy\SicesLegacyConnectionException;
use App\Models\Alumno;
use App\Models\CicloEscolar;
use App\Models\DocumentoAcademico;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Laravel\Sanctum\Sanctum;
use Tests\Support\SicesLegacy\InMemorySicesLegacyCertificadoRepository;
use Tests\Support\SicesLegacy\SicesLegacyRbacTestHelper;
use Tests\Support\SicesLegacy\SicesLegacyTestDoubles;
use Tests\TestCase;

class SicesLegacyConsultaTest extends TestCase
{
    use RefreshDatabase;

    protected InMemorySicesLegacyCertificadoRepository $legacyRepo;

    protected function setUp(): void
    {
        parent::setUp();

        Config::set('sices_legacy.enabled', false);
        Config::set('sices_legacy.read_only', true);
        Config::set('sices_legacy.timeout', 1);

        $this->legacyRepo = new InMemorySicesLegacyCertificadoRepository;
        $this->app->instance(SicesLegacyCertificadoRepositoryInterface::class, $this->legacyRepo);
    }

    public function test_health_sin_autenticacion_devuelve_401_json(): void
    {
        $response = $this->getJson('/api/v1/sices-legacy/health');

        $response->assertUnauthorized()
            ->assertJson(['message' => 'Unauthenticated.'])
            ->assertHeader('Content-Type', 'application/json');

        $this->assertStringNotContainsString('<!DOCTYPE', $response->getContent() ?: '');
        $this->assertStringNotContainsString('Route [login] not defined', $response->getContent() ?: '');
    }

    public function test_usuario_con_permiso_puede_consultar_health(): void
    {
        $this->legacyRepo->healthResponse = SicesLegacyTestDoubles::healthOk();

        $usuario = $this->usuarioConPermisosLegacy('sices_legacy.health');

        $this->actingAs($usuario)
            ->getJson('/api/v1/sices-legacy/health')
            ->assertOk()
            ->assertJsonStructure(['data' => ['enabled', 'read_only', 'reachable', 'message']])
            ->assertJsonPath('data.reachable', true);
    }

    public function test_health_con_modulo_desactivado_devuelve_enabled_false(): void
    {
        Config::set('sices_legacy.enabled', false);
        $this->legacyRepo->healthResponse = SicesLegacyTestDoubles::healthDisabled();

        $usuario = $this->usuarioConPermisosLegacy('sices_legacy.health');

        $this->actingAs($usuario)
            ->getJson('/api/v1/sices-legacy/health')
            ->assertOk()
            ->assertJsonPath('data.enabled', false)
            ->assertJsonPath('data.reachable', false);
    }

    public function test_consulta_por_curp_respuesta_controlada(): void
    {
        Config::set('sices_legacy.enabled', true);

        $cert = SicesLegacyTestDoubles::certificadoPorCurp();
        $this->legacyRepo->porCurp['CURPLEG000000HDF00099'] = SicesLegacyTestDoubles::certificadosEncontrados($cert);

        $usuario = $this->usuarioConPermisosLegacy('sices_legacy.consultar');

        $this->actingAs($usuario)
            ->getJson('/api/v1/sices-legacy/certificados/por-curp/CURPLEG000000HDF00099')
            ->assertOk()
            ->assertJsonPath('data.success', true)
            ->assertJsonPath('data.certificados.0.url_short', 'urlshort99');
    }

    public function test_consulta_por_url_short_respuesta_controlada(): void
    {
        Config::set('sices_legacy.enabled', true);

        $cert = SicesLegacyTestDoubles::certificadoPorUrlShort();
        $this->legacyRepo->porUrlShort['tokenUrlShort100'] = $cert;

        $usuario = $this->usuarioConPermisosLegacy('sices_legacy.consultar');

        $this->actingAs($usuario)
            ->getJson('/api/v1/sices-legacy/certificados/por-url-short/tokenUrlShort100')
            ->assertOk()
            ->assertJsonPath('data.success', true)
            ->assertJsonPath('data.certificado.url_short', 'tokenUrlShort100')
            ->assertJsonPath('data.estado.existe_en_sices', true);
    }

    public function test_consulta_con_conexion_fallida_no_expone_excepcion_cruda(): void
    {
        Config::set('sices_legacy.enabled', true);

        $this->legacyRepo->excepcionEnCurp = new SicesLegacyConnectionException(
            'Informix no disponible',
            'informix_sices',
        );

        $usuario = $this->usuarioConPermisosLegacy('sices_legacy.consultar');

        $this->actingAs($usuario)
            ->getJson('/api/v1/sices-legacy/certificados/por-curp/CURPTEST000000HDF00101')
            ->assertStatus(503)
            ->assertJsonPath('data.success', false)
            ->assertJsonPath('data.code', 'SICES_LEGACY_CONNECTION')
            ->assertJsonMissingPath('data.exception');
    }

    public function test_usuario_sin_permiso_recibe_403(): void
    {
        $usuario = User::factory()->create();
        Sanctum::actingAs($usuario);

        $this->getJson('/api/v1/sices-legacy/health')->assertForbidden();
    }

    public function test_si_sices_legacy_disabled_devuelve_error_controlado(): void
    {
        Config::set('sices_legacy.enabled', false);

        $usuario = $this->usuarioConPermisosLegacy('sices_legacy.consultar');

        $alumno = Alumno::query()->create([
            'curp' => 'LEGACY000000HDF00001',
            'nombre' => 'Prueba',
            'primer_apellido' => 'Legacy',
            'segundo_apellido' => 'Off',
        ]);

        $this->actingAs($usuario)
            ->getJson("/api/v1/sices-legacy/alumnos/{$alumno->id}/estado-sep")
            ->assertStatus(503)
            ->assertJsonPath('data.success', false)
            ->assertJsonPath('data.code', 'SICES_LEGACY_DISABLED');
    }

    public function test_si_no_hay_certificado_devuelve_existe_en_sices_false(): void
    {
        Config::set('sices_legacy.enabled', true);
        $this->legacyRepo->porCurp['LEGACY000000HDF00002'] = SicesLegacyTestDoubles::certificadosNoEncontrados();

        $usuario = $this->usuarioConPermisosLegacy('sices_legacy.consultar');

        $alumno = Alumno::query()->create([
            'curp' => 'LEGACY000000HDF00002',
            'nombre' => 'Sin',
            'primer_apellido' => 'Cert',
            'segundo_apellido' => 'Sices',
        ]);

        $this->actingAs($usuario)
            ->getJson("/api/v1/sices-legacy/alumnos/{$alumno->id}/estado-sep")
            ->assertOk()
            ->assertJsonPath('data.success', true)
            ->assertJsonPath('data.estado.existe_en_sices', false);
    }

    public function test_estado_sep_por_documento_respuesta_controlada(): void
    {
        Config::set('sices_legacy.enabled', true);

        $cert = SicesLegacyTestDoubles::certificadoTimbrado(
            curp: 'DOCLEG000000HDF00010',
            urlShort: 'doc-url-short',
            folio: 'FOL-DOC-10',
        );
        $this->legacyRepo->porCurp['DOCLEG000000HDF00010'] = SicesLegacyTestDoubles::certificadosEncontrados($cert);
        $this->legacyRepo->materiasPorCertificado[99] = collect();

        $alumno = Alumno::query()->create([
            'curp' => 'DOCLEG000000HDF00010',
            'nombre' => 'Doc',
            'primer_apellido' => 'Legacy',
            'segundo_apellido' => 'Test',
        ]);

        $ciclo = CicloEscolar::query()->create([
            'clave' => 'CIC-SL-TEST',
            'nombre' => '2025-2026',
            'fecha_inicio' => '2025-08-01',
            'fecha_fin' => '2026-07-31',
            'es_actual' => true,
            'activo' => true,
        ]);

        $documento = DocumentoAcademico::query()->create([
            'alumno_id' => $alumno->id,
            'ciclo_escolar_id' => $ciclo->id,
            'tipo_documento' => 'certificado',
            'tipo_certificacion' => 'total',
            'estado_workflow' => 'borrador',
        ]);

        $usuario = $this->usuarioConPermisosLegacy('sices_legacy.consultar', 'sices_legacy.comparar');

        $this->actingAs($usuario)
            ->getJson("/api/v1/sices-legacy/documentos/{$documento->id}/estado-sep")
            ->assertOk()
            ->assertJsonPath('data.success', true)
            ->assertJsonPath('data.estado.existe_en_sices', true)
            ->assertJsonPath('data.estado.folio_digital_sep', 'FOL-DOC-10')
            ->assertJsonStructure(['data' => ['comparacion', 'materias']]);
    }

    public function test_si_hay_certificado_timbrado_devuelve_folio_y_url_short(): void
    {
        Config::set('sices_legacy.enabled', true);

        $cert = SicesLegacyTestDoubles::certificadoTimbrado();
        $this->legacyRepo->porCurp['LEGACY000000HDF00003'] = SicesLegacyTestDoubles::certificadosEncontrados($cert);
        $this->legacyRepo->materiasPorCertificado[99] = collect();

        $usuario = $this->usuarioConPermisosLegacy('sices_legacy.consultar');

        $alumno = Alumno::query()->create([
            'curp' => 'LEGACY000000HDF00003',
            'nombre' => 'Con',
            'primer_apellido' => 'Cert',
            'segundo_apellido' => 'Sices',
        ]);

        $this->actingAs($usuario)
            ->getJson("/api/v1/sices-legacy/alumnos/{$alumno->id}/estado-sep")
            ->assertOk()
            ->assertJsonPath('data.estado.existe_en_sices', true)
            ->assertJsonPath('data.estado.timbrado', true)
            ->assertJsonPath('data.estado.folio_digital_sep', 'FOLIO-DIG-SEP-001')
            ->assertJsonPath('data.estado.url_short', 'abc123url');
    }

    public function test_auditor_puede_consultar_pero_no_existe_endpoint_escritura(): void
    {
        Config::set('sices_legacy.enabled', false);

        $usuario = $this->usuarioConPermisosLegacy('sices_legacy.consultar');

        $alumno = Alumno::query()->create([
            'curp' => 'LEGACY000000HDF00004',
            'nombre' => 'Aud',
            'primer_apellido' => 'Itor',
            'segundo_apellido' => 'Test',
        ]);

        $this->actingAs($usuario)
            ->getJson("/api/v1/sices-legacy/alumnos/{$alumno->id}/estado-sep")
            ->assertStatus(503);

        $this->postJson("/api/v1/sices-legacy/alumnos/{$alumno->id}/estado-sep")
            ->assertStatus(405);

        $this->putJson("/api/v1/sices-legacy/certificados/por-curp/{$alumno->curp}")
            ->assertStatus(405);
    }

    public function test_no_existen_rutas_post_put_delete_en_prefijo_sices_legacy(): void
    {
        $usuario = $this->usuarioConPermisosLegacy('sices_legacy.health');

        $this->actingAs($usuario)
            ->postJson('/api/v1/sices-legacy/health')
            ->assertStatus(405);

        $this->actingAs($usuario)
            ->deleteJson('/api/v1/sices-legacy/health')
            ->assertStatus(405);
    }

    /**
     * @param  string  ...$permissions
     */
    protected function usuarioConPermisosLegacy(string ...$permissions): User
    {
        $usuario = User::factory()->create();
        SicesLegacyRbacTestHelper::grant($usuario, ...$permissions);
        Sanctum::actingAs($usuario);

        return $usuario;
    }
}
