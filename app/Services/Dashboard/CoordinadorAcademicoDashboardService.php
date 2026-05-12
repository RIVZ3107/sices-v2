<?php

declare(strict_types=1);

namespace App\Services\Dashboard;

use App\Models\User;
use App\Services\Certificacion\BandejaDocumentoAcademicoService;

final class CoordinadorAcademicoDashboardService
{
    public function __construct(
        private readonly BandejaDocumentoAcademicoService $bandejas,
        private readonly DashboardRequestFactory $requestFactory,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function build(User $user): array
    {
        $req = $this->requestFactory->forUser($user);
        $b = $this->bandejas->resumen($req);

        return [
            'variant' => 'coordinador_academico',
            'technical' => false,
            'metricas' => $b,
            'cards' => [
                ['key' => 'panel', 'title' => 'Coordinación académica', 'value' => 1, 'href' => '/app/coordinador/dashboard'],
            ],
        ];
    }
}
