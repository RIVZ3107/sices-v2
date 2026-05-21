<?php

declare(strict_types=1);

namespace Tests\Feature\Certificacion;

use App\Enums\Certificacion\EstadoFirma;
use App\Models\DocumentoAcademico;
use App\Models\User;
use App\Services\Firma\LegacySinceSigningBridgeService;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class FirmaConServicio34BridgeTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(DatabaseSeeder::class);
        Config::set('certificacion.sep_firma.enabled', true);
        Config::set('certificacion.sep_firma.simulada', true);
        Config::set('certificacion.sep_firma.use_bridge', true);
        Config::set('informix.enabled', false);
    }

    public function test_preflight_fallido_bloquea_firma(): void
    {
        $documento = DocumentoAcademico::query()->first();
        $this->assertNotNull($documento);

        $bridge = app(LegacySinceSigningBridgeService::class);
        $result = $bridge->ejecutarFirma($documento);

        $this->assertFalse($result['success']);
        $this->assertSame(EstadoFirma::ERROR_FIRMA->value, $documento->fresh()->estado_firma);
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
}
