<?php

declare(strict_types=1);

namespace Tests\Feature\Certificacion;

use App\Enums\Certificacion\EstadoFirma;
use App\Infrastructure\Since\SinceFirmaClient;
use App\Models\DocumentoAcademico;
use App\Models\User;
use App\Services\Firma\LegacySinceSigningBridgeService;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class FirmaConServicio34BridgeTest extends TestCase
{
    use RefreshDatabase;

    protected bool $seed = true;

    protected string $seeder = RolesAndPermissionsSeeder::class;

    protected function setUp(): void
    {
        parent::setUp();
        config(['since.firma.enabled' => true]);
        config(['informix.enabled' => false]);
    }

    public function test_preflight_fallido_bloquea_firma(): void
    {
        $documento = DocumentoAcademico::query()->first();
        $this->assertNotNull($documento);

        $bridge = app(LegacySinceSigningBridgeService::class);
        $result = $bridge->ejecutarFirma($documento);

        $this->assertFalse($result['success']);
        $this->assertContains($result['error_code'] ?? '', ['preflight_fallido', 'prefirma_fallido', 'shadow_no_exportado']);
    }

    public function test_control_escolar_no_puede_firmar_por_api(): void
    {
        $usuario = User::factory()->create();
        $usuario->assignRole('control_escolar_escuela');
        Sanctum::actingAs($usuario);

        $documento = DocumentoAcademico::query()->first();
        $this->assertNotNull($documento);

        $this->postJson("/api/v1/certificacion/documentos-academicos/{$documento->id}/firma/ejecutar")
            ->assertForbidden();
    }

    public function test_since_deshabilitado_no_llama_cliente(): void
    {
        config(['since.firma.enabled' => false]);

        $documento = DocumentoAcademico::query()->first();
        $this->assertNotNull($documento);

        $client = $this->createMock(SinceFirmaClient::class);
        $client->expects($this->never())->method('firmarPorUrlShort');
        $this->app->instance(SinceFirmaClient::class, $client);

        $bridge = app(LegacySinceSigningBridgeService::class);
        $result = $bridge->ejecutarFirma($documento);

        $this->assertFalse($result['success']);
        $this->assertSame('since_firma_disabled', $result['error_code']);
    }
}
