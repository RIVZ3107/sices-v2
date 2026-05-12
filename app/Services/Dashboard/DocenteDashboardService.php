<?php

declare(strict_types=1);

namespace App\Services\Dashboard;

use App\Models\User;
use App\Services\Certificacion\BandejaDocumentoAcademicoService;

final class DocenteDashboardService
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
            'variant' => 'docente',
            'technical' => false,
            'solo_vista_docente' => true,
            'metricas' => $b,
            'cards' => [
                ['key' => 'panel', 'title' => 'Mis grupos / materias', 'value' => 1, 'href' => '/app/docente/dashboard'],
                ['key' => 'calificaciones', 'title' => 'Pendientes de captura (referencia)', 'value' => 0, 'href' => '/app/docente/dashboard'],
            ],
        ];
    }
}
