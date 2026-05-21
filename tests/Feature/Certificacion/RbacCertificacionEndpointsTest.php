<?php

declare(strict_types=1);

namespace Tests\Feature\Certificacion;

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
use App\Models\User;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class RbacCertificacionEndpointsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
    }

    public function test_control_escolar_no_puede_generar_cadena_xml_ni_firma(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole('control_escolar_escuela');

        $this->assertTrue($usuario->can('crear_documentos') || $usuario->can('documentos.crear_borrador'));
        $this->assertTrue($usuario->can('enviar_revision') || $usuario->can('documentos.enviar_revision'));
        $this->assertFalse($usuario->can('generar_cadena'));
        $this->assertFalse($usuario->can('cadena_original.generar'));
        $this->assertFalse($usuario->can('generar_xml'));
        $this->assertFalse($usuario->can('firma.ejecutar'));
        $this->assertFalse($usuario->can('solicitar_firma'));

        Sanctum::actingAs($usuario);

        $doc = $this->crearDocumentoBorrador();

        $this->postJson("/api/v1/certificacion/documentos-academicos/{$doc->id}/dec-normal/cadena")
            ->assertForbidden();

        $this->postJson("/api/v1/certificacion/documentos-academicos/{$doc->id}/dec-normal/xml")
            ->assertForbidden();

        $this->postJson("/api/v1/certificacion/documentos-academicos/{$doc->id}/firma/ejecutar")
            ->assertForbidden();
    }

    public function test_sistemas_tiene_permisos_tecnicos_de_firma_cadena_y_xml(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole('sistemas');

        $this->assertTrue($usuario->can('firma.ejecutar'));
        $this->assertTrue($usuario->can('solicitar_firma'));
        $this->assertTrue($usuario->can('reintentar_firma') || $usuario->can('firma.reintentar'));
        $this->assertTrue($usuario->can('generar_cadena') || $usuario->can('cadena_original.generar'));
        $this->assertTrue($usuario->can('generar_xml') || $usuario->can('xml.generar'));
    }

    public function test_director_escuela_no_puede_operaciones_tecnicas(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole('director_escuela');

        $this->assertFalse($usuario->can('generar_cadena'));
        $this->assertFalse($usuario->can('generar_xml'));
        $this->assertFalse($usuario->can('firma.ejecutar'));
        $this->assertFalse($usuario->can('solicitar_firma'));

        Sanctum::actingAs($usuario);

        $doc = $this->crearDocumentoAprobado();

        $this->postJson("/api/v1/certificacion/documentos-academicos/{$doc->id}/dec-normal/cadena")
            ->assertForbidden();

        $this->postJson("/api/v1/certificacion/documentos-academicos/{$doc->id}/firma/ejecutar")
            ->assertForbidden();
    }

    public function test_educacion_superior_puede_validar_normativamente_sin_firma_tecnica(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole('educacion_superior');

        $this->assertTrue(
            $usuario->can('validaciones_normativas.aprobar')
            || $usuario->can('aprobar_documentos')
            || $usuario->can('documentos.aprobar_institucionalmente'),
        );
        $this->assertTrue(
            $usuario->can('documentos.liberar_proceso_tecnico')
            || $usuario->can('preparar_documento_firma')
            || $usuario->can('certificacion.enviar_a_proceso_tecnico'),
        );
        $this->assertFalse($usuario->can('firma.ejecutar'));
        $this->assertFalse($usuario->can('solicitar_firma'));
    }

    public function test_responsable_certificacion_no_puede_firma_ni_generar_cadena(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole('responsable_certificacion_titulacion');

        $this->assertFalse($usuario->can('firma.ejecutar'));
        $this->assertFalse($usuario->can('solicitar_firma'));
        $this->assertFalse($usuario->can('generar_cadena'));
        $this->assertTrue($usuario->can('documentos.liberar_proceso_tecnico') || $usuario->can('preparar_documento_firma'));
        $this->assertTrue($usuario->can('consulta_publica.emitir_token') || $usuario->can('consulta_publica.ver'));

        Sanctum::actingAs($usuario);

        $doc = $this->crearDocumentoAprobado();

        $this->postJson("/api/v1/certificacion/documentos-academicos/{$doc->id}/firma/ejecutar")
            ->assertForbidden();

        $this->postJson("/api/v1/certificacion/documentos-academicos/{$doc->id}/dec-normal/cadena")
            ->assertForbidden();
    }

    public function test_responsable_evaluacion_tiene_dashboard_ver(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole('responsable_evaluacion');

        $this->assertTrue($usuario->can('dashboard.ver'));
    }

    public function test_auditor_no_puede_aprobar_documento(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole('auditor');
        Sanctum::actingAs($usuario);

        $doc = $this->crearDocumentoEnRevision();

        $this->postJson("/api/v1/certificacion/documentos-academicos/{$doc->id}/aprobar", [
            'motivo' => 'No debe aprobar',
        ])->assertForbidden();
    }

    private function crearDocumentoBorrador(): DocumentoAcademico
    {
        $ctx = $this->crearContextoInstitucional();
        $alumno = Alumno::query()->create([
            'curp' => sprintf('RBCE000000HDF%05d', random_int(10000, 99999)),
            'nombre' => 'Alumno',
            'primer_apellido' => 'RBAC',
            'segundo_apellido' => 'Test',
        ]);

        return DocumentoAcademico::query()->create([
            'alumno_id' => $alumno->id,
            'ciclo_escolar_id' => $ctx['ciclo_escolar_id'],
            'oferta_academica_id' => $ctx['oferta_academica_id'],
            'subsistema_id' => $ctx['subsistema_id'],
            'region_id' => $ctx['region_id'],
            'institucion_id' => $ctx['institucion_id'],
            'sede_id' => $ctx['sede_id'],
            'tipo_documento' => 'certificado',
            'estado_workflow' => 'borrador',
        ]);
    }

    private function crearDocumentoEnRevision(): DocumentoAcademico
    {
        $doc = $this->crearDocumentoBorrador();
        $doc->forceFill(['estado_workflow' => 'en_revision'])->save();

        return $doc->refresh();
    }

    private function crearDocumentoAprobado(): DocumentoAcademico
    {
        $doc = $this->crearDocumentoEnRevision();
        $doc->forceFill(['estado_workflow' => 'aprobado'])->save();

        return $doc->refresh();
    }

    /**
     * @return array{subsistema_id: int, region_id: int, institucion_id: int, sede_id: int, oferta_academica_id: int, ciclo_escolar_id: int}
     */
    private function crearContextoInstitucional(): array
    {
        $suf = substr(str_replace('.', '', uniqid('', true)), 0, 10);

        $subsistema = Subsistema::query()->updateOrCreate(
            ['clave' => 'NORMAL'],
            ['nombre' => 'Educación Normal', 'nombre_corto' => 'Normal', 'activo' => true],
        );

        $region = Region::query()->create([
            'subsistema_id' => $subsistema->id,
            'clave' => 'REG-'.$suf,
            'nombre' => 'Región prueba',
            'activo' => true,
        ]);

        $institucion = Institucion::query()->create([
            'subsistema_id' => $subsistema->id,
            'region_id' => $region->id,
            'clave' => 'INS-'.$suf,
            'nombre' => 'Institución prueba',
            'activo' => true,
        ]);

        $sede = Sede::query()->create([
            'institucion_id' => $institucion->id,
            'region_id' => $region->id,
            'clave' => 'SED-'.$suf,
            'nombre' => 'Sede prueba',
            'activo' => true,
        ]);

        $nivel = NivelAcademico::query()->where('clave', 'LIC')->firstOrFail();

        $programa = ProgramaEstudio::query()->create([
            'nivel_academico_id' => $nivel->id,
            'clave' => 'PROG-'.$suf,
            'nombre' => 'Programa prueba',
            'activo' => true,
        ]);

        $plan = PlanEstudio::query()->create([
            'programa_estudio_id' => $programa->id,
            'clave' => 'PLAN-'.$suf,
            'nombre' => 'Plan prueba',
            'activo' => true,
        ]);

        $ciclo = CicloEscolar::query()->create([
            'clave' => 'CIC-'.$suf,
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
            'clave' => 'OFA-'.$suf,
            'modalidad' => 'escolarizada',
            'activo' => true,
        ]);

        return [
            'subsistema_id' => $subsistema->id,
            'region_id' => $region->id,
            'institucion_id' => $institucion->id,
            'sede_id' => $sede->id,
            'oferta_academica_id' => $oferta->id,
            'ciclo_escolar_id' => $ciclo->id,
        ];
    }
}
