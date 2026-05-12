<?php

declare(strict_types=1);

namespace App\Services\Dashboard;

use App\Models\AuditoriaEvento;
use App\Models\User;
use App\Services\Certificacion\BandejaDocumentoAcademicoService;

final class AuditorDashboardService
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

        $movimientos = AuditoriaEvento::query()
            ->latest('id')
            ->limit(15)
            ->get(['id', 'evento', 'created_at'])
            ->map(fn (AuditoriaEvento $e) => [
                'id' => $e->id,
                'evento' => $e->evento,
                'creado' => $e->created_at?->toIso8601String(),
            ])
            ->all();

        return [
            'variant' => 'auditor',
            'technical' => false,
            'solo_lectura' => true,
            'acciones_solo_lectura' => [
                'Consultar expedientes y documentos',
                'Revisar bitácora y movimientos',
                'Validar certificados emitidos (consulta)',
            ],
            'metricas' => $b,
            'cards' => [
                ['key' => 'emitidos', 'title' => 'Documentos emitidos (aprobados)', 'value' => $b['aprobados'] ?? 0, 'href' => '/app/consulta/documentos'],
                ['key' => 'movimientos', 'title' => 'Movimientos recientes', 'value' => count($movimientos), 'href' => '/app/auditoria'],
            ],
            'movimientos_recientes' => $movimientos,
        ];
    }
}
