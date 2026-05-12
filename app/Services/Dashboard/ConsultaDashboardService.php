<?php

declare(strict_types=1);

namespace App\Services\Dashboard;

use App\Models\User;
use App\Services\Certificacion\BandejaDocumentoAcademicoService;

final class ConsultaDashboardService
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
            'variant' => 'consulta',
            'technical' => false,
            'solo_lectura' => true,
            'metricas' => $b,
            'cards' => [
                ['key' => 'docs', 'title' => 'Consulta documental', 'value' => $b['aprobados'] ?? 0, 'href' => '/app/consulta/documentos'],
            ],
        ];
    }
}
