<?php

declare(strict_types=1);

namespace Tests\Feature\Certificacion;

use App\Services\Certificacion\AcademicRulesResolver;
use App\Services\Certificacion\NormalesControlEscolar2022RulesService;
use Tests\TestCase;

final class NormalesControlEscolar2022RulesTest extends TestCase
{
    public function test_resolver_entrega_normales_para_subsistema_normal(): void
    {
        $rules = app(AcademicRulesResolver::class)->forSubsistema('NORMAL');
        $this->assertInstanceOf(NormalesControlEscolar2022RulesService::class, $rules);
        $this->assertSame('NORMAL', $rules->claveSubsistema());
    }

    public function test_normales_usa_patron_institucional_y_referencia_anual(): void
    {
        $s = app(NormalesControlEscolar2022RulesService::class);
        $this->assertTrue($s->usaPatronMatriculaEducacionNormal2022());
        $this->assertTrue($s->usaReferenciaInscripcionAnualNormal());
    }
}
