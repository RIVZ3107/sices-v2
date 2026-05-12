<?php

declare(strict_types=1);

namespace App\Services\Dashboard;

use App\Models\User;
use App\Services\Certificacion\BandejaDocumentoAcademicoService;

final class AdminDashboardService
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
        $bandeja = $this->bandejas->resumen($req);

        return [
            'variant' => 'admin',
            'technical' => true,
            'cards' => [
                ['key' => 'usuarios', 'title' => 'Usuarios', 'value' => User::query()->count(), 'href' => '/app/admin/usuarios-roles'],
                ['key' => 'pendientes', 'title' => 'Pendientes de revisión', 'value' => $bandeja['pendientes_revision'] ?? 0, 'href' => '/app/documentos/bandejas/pendientes-revision'],
            ],
            'bandeja_resumen' => $bandeja,
        ];
    }
}
