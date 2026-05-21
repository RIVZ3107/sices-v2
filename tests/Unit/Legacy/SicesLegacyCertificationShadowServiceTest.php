<?php

declare(strict_types=1);

namespace Tests\Unit\Legacy;

use App\Exceptions\Legacy\InformixWriteDisabledException;
use App\Services\Legacy\SicesLegacyCertificationShadowService;
use Illuminate\Support\Facades\Config;
use Tests\TestCase;

class SicesLegacyCertificationShadowServiceTest extends TestCase
{
    public function test_no_escribe_si_write_disabled(): void
    {
        Config::set('informix.enabled', true);
        Config::set('informix.write_enabled', false);

        $this->expectException(InformixWriteDisabledException::class);

        $documento = new \App\Models\DocumentoAcademico(['id' => 1]);

        app(SicesLegacyCertificationShadowService::class)->syncForSigning($documento);
    }
}
