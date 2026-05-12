<?php

declare(strict_types=1);

namespace App\Services\Dashboard;

use App\Models\User;
use App\Services\Certificacion\BandejaDocumentoAcademicoService;

final class ResponsableAdmisionDashboardService
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
            'variant' => 'responsable_admision',
            'technical' => false,
            'metricas' => $b,
            'cards' => [
                ['key' => 'expedientes', 'title' => 'Expedientes de ingreso (bandeja)', 'value' => ($b['pendientes_revision'] ?? 0) + ($b['borradores'] ?? 0), 'href' => '/app/expedientes'],
                ['key' => 'documentos', 'title' => 'Documentos visibles', 'value' => $b['aprobados'] ?? 0, 'href' => '/app/documentos/bandejas/por-rol'],
            ],
            'notas' => ['Resumen orientado a admisión; ajuste fino de estados en módulos de aspirantes cuando estén disponibles.'],
        ];
    }
}
