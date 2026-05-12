<?php

declare(strict_types=1);

namespace App\Services\Dashboard;

use App\Models\User;
use App\Services\Certificacion\BandejaDocumentoAcademicoService;

final class ResponsableEvaluacionDashboardService
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
            'variant' => 'responsable_evaluacion',
            'technical' => false,
            'metricas' => $b,
            'cards' => [
                ['key' => 'captura', 'title' => 'Seguimiento académico (bandeja)', 'value' => $b['en_revision'] ?? 0, 'href' => '/app/coordinador/dashboard'],
                ['key' => 'aprobados', 'title' => 'Cierres documentales', 'value' => $b['aprobados'] ?? 0, 'href' => '/app/coordinador/dashboard'],
            ],
        ];
    }
}
