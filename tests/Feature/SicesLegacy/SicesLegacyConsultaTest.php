<?php

declare(strict_types=1);

namespace Tests\Feature\SicesLegacy;

use App\Contracts\SicesLegacy\SicesLegacyCertificadoRepositoryInterface;
use App\Data\SicesLegacy\SicesLegacyCertificadoData;
use App\Models\Alumno;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Config;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class SicesLegacyConsultaTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_usuario_con_permiso_puede_consultar_health(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole('sistemas');
        Sanctum::actingAs($usuario);

        $this->getJson('/api/v1/sices-legacy/health')
            ->assertOk()
            ->assertJsonStructure(['data' => ['enabled', 'read_only', 'reachable']]);
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

        $usuario = User::factory()->create();
        $usuario->assignRole('educacion_superior');
        Sanctum::actingAs($usuario);

        $alumno = Alumno::query()->create([
            'curp' => 'LEGACY000000HDF00001',
            'nombre' => 'Prueba',
            'primer_apellido' => 'Legacy',
            'segundo_apellido' => 'Off',
        ]);

        $this->getJson("/api/v1/sices-legacy/alumnos/{$alumno->id}/estado-sep")
            ->assertStatus(503)
            ->assertJsonPath('data.success', false)
            ->assertJsonPath('data.code', 'SICES_LEGACY_DISABLED');
    }

    public function test_si_no_hay_certificado_devuelve_existe_en_sices_false(): void
    {
        Config::set('sices_legacy.enabled', true);
        Config::set('sices_legacy.read_only', true);

        $this->mock(SicesLegacyCertificadoRepositoryInterface::class, function ($mock): void {
            $mock->shouldReceive('buscarPorCurp')->andReturn(collect());
        });

        $usuario = User::factory()->create();
        $usuario->assignRole('responsable_certificacion_titulacion');
        Sanctum::actingAs($usuario);

        $alumno = Alumno::query()->create([
            'curp' => 'LEGACY000000HDF00002',
            'nombre' => 'Sin',
            'primer_apellido' => 'Cert',
            'segundo_apellido' => 'Sices',
        ]);

        $this->getJson("/api/v1/sices-legacy/alumnos/{$alumno->id}/estado-sep")
            ->assertOk()
            ->assertJsonPath('data.success', true)
            ->assertJsonPath('data.estado.existe_en_sices', false);
    }

    public function test_si_hay_certificado_timbrado_devuelve_folio_y_url_short(): void
    {
        Config::set('sices_legacy.enabled', true);
        Config::set('sices_legacy.read_only', true);

        $cert = new SicesLegacyCertificadoData(
            idSices: 99,
            curp: 'LEGACY000000HDF00003',
            matricula: 'MAT-LEG-01',
            nombreCompleto: 'Alumno Legacy',
            tipoCertificado: 'T',
            cicloEscolar: '2025-2026',
            urlShort: 'abc123url',
            folioDigitalSep: 'FOLIO-DIG-SEP-001',
            osituac: 'F',
            istatus: '1',
            opdf: 1,
            tieneXmlLocal: true,
            tieneXmlSep: true,
            fechaModificacion: '2026-05-01',
            institucion: 'Escuela Normal',
            cct: '09DCC0001A',
            carrera: 'LIC',
            planEstudios: '2020',
        );

        $this->mock(SicesLegacyCertificadoRepositoryInterface::class, function ($mock) use ($cert): void {
            $mock->shouldReceive('buscarPorCurp')->andReturn(collect([$cert]));
            $mock->shouldReceive('obtenerMateriasPorCertificado')->andReturn(collect());
        });

        $usuario = User::factory()->create();
        $usuario->assignRole('educacion_superior');
        Sanctum::actingAs($usuario);

        $alumno = Alumno::query()->create([
            'curp' => 'LEGACY000000HDF00003',
            'nombre' => 'Con',
            'primer_apellido' => 'Cert',
            'segundo_apellido' => 'Sices',
        ]);

        $this->getJson("/api/v1/sices-legacy/alumnos/{$alumno->id}/estado-sep")
            ->assertOk()
            ->assertJsonPath('data.estado.existe_en_sices', true)
            ->assertJsonPath('data.estado.timbrado', true)
            ->assertJsonPath('data.estado.folio_digital_sep', 'FOLIO-DIG-SEP-001')
            ->assertJsonPath('data.estado.url_short', 'abc123url');
    }

    public function test_auditor_puede_consultar_pero_no_existe_endpoint_escritura(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole('auditor');
        Sanctum::actingAs($usuario);

        $alumno = Alumno::query()->create([
            'curp' => 'LEGACY000000HDF00004',
            'nombre' => 'Aud',
            'primer_apellido' => 'Itor',
            'segundo_apellido' => 'Test',
        ]);

        Config::set('sices_legacy.enabled', false);

        $this->getJson("/api/v1/sices-legacy/alumnos/{$alumno->id}/estado-sep")
            ->assertStatus(503);

        $this->postJson("/api/v1/sices-legacy/alumnos/{$alumno->id}/estado-sep")
            ->assertStatus(405);

        $this->putJson("/api/v1/sices-legacy/certificados/por-curp/{$alumno->curp}")
            ->assertStatus(405);
    }

    public function test_no_existen_rutas_post_put_delete_en_prefijo_sices_legacy(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole('sistemas');
        Sanctum::actingAs($usuario);

        $this->postJson('/api/v1/sices-legacy/health')->assertStatus(405);
        $this->deleteJson('/api/v1/sices-legacy/health')->assertStatus(405);
    }
}
