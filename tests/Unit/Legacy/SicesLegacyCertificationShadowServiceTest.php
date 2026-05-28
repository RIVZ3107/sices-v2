<?php

declare(strict_types=1);

namespace Tests\Unit\Legacy;

use App\Contracts\SicesLegacy\SicesLegacyShadowRepositoryInterface;
use App\Models\DocumentoAcademico;
use App\Services\Legacy\SicesLegacyCertificationShadowService;
use App\Services\SicesLegacy\SicesLegacyShadowExportService;
use Illuminate\Support\Facades\Config;
use Tests\Support\SicesLegacy\InMemorySicesLegacyShadowRepository;
use Tests\TestCase;

class SicesLegacyCertificationShadowServiceTest extends TestCase
{
    public function test_no_escribe_si_shadow_deshabilitado(): void
    {
        Config::set('sices_legacy.enabled', true);
        Config::set('sices_legacy.shadow_enabled', false);
        Config::set('sices_legacy.write_enabled', true);
        Config::set('sices_legacy.read_only', false);

        $repo = new InMemorySicesLegacyShadowRepository;
        $this->app->instance(SicesLegacyShadowRepositoryInterface::class, $repo);

        $documento = new DocumentoAcademico(['id' => 1]);

        $result = app(SicesLegacyCertificationShadowService::class)->syncForSigning($documento);

        $this->assertFalse($result->success);
        $this->assertStringContainsString('SICES_LEGACY_SHADOW_ENABLED=false', implode(' ', $result->metadata['errors'] ?? []));
        $this->assertNull($repo->findCertificadoByUrlShort('cualquier-token'));
    }

    public function test_export_service_respeta_mismo_flag(): void
    {
        Config::set('sices_legacy.enabled', true);
        Config::set('sices_legacy.shadow_enabled', false);
        Config::set('sices_legacy.write_enabled', true);
        Config::set('sices_legacy.read_only', false);

        $repo = new InMemorySicesLegacyShadowRepository;
        $this->app->instance(SicesLegacyShadowRepositoryInterface::class, $repo);

        $result = app(SicesLegacyShadowExportService::class)->exportarDocumentoParaFirma(
            new DocumentoAcademico(['id' => 2]),
        );

        $this->assertFalse($result->success);
        $this->assertContains('SICES_LEGACY_SHADOW_ENABLED=false.', $result->errors ?? []);
    }
}
