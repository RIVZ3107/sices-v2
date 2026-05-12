<?php

declare(strict_types=1);

namespace App\Services\Dashboard;

use App\Models\User;
use App\Services\Certificacion\BandejaDocumentoAcademicoService;

final class ResponsableCertificacionDashboardService
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
            'variant' => 'responsable_certificacion_titulacion',
            'technical' => false,
            'metricas' => $b,
            'cards' => [
                ['key' => 'pendientes', 'title' => 'Validaciones pendientes', 'value' => $b['pendientes_revision'] ?? 0, 'href' => '/app/documentos/bandejas/por-rol'],
                ['key' => 'listos', 'title' => 'En proceso hacia emisión', 'value' => $b['listos_para_firma'] ?? 0, 'href' => '/app/documentos/bandejas/en-revision'],
                ['key' => 'cancelados', 'title' => 'Cancelados / control', 'value' => $b['cancelados'] ?? 0, 'href' => '/app/documentos/bandejas/cancelados'],
            ],
            'acciones_permitidas' => [
                'Revisar expediente',
                'Asignar folio administrativo',
                'Solicitar proceso técnico',
                'Consultar estado técnico',
                'Descargar documento permitido',
                'Registrar cancelación/reposición',
            ],
            'acciones_no_disponibles' => [
                'Generar XML',
                'Enviar a firma',
                'Reintentar job técnico',
            ],
        ];
    }
}
