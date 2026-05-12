<?php

declare(strict_types=1);

namespace App\Services\Dashboard;

use App\Models\Menu;
use App\Models\User;
use App\Services\Certificacion\BandejaDocumentoAcademicoService;

final class SuperadminDashboardService
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
            'variant' => 'superadmin',
            'technical' => true,
            'cards' => [
                ['key' => 'usuarios', 'title' => 'Usuarios registrados', 'value' => User::query()->count(), 'href' => '/app/admin/usuarios-roles'],
                ['key' => 'menus', 'title' => 'Menús configurados', 'value' => Menu::query()->count(), 'href' => '/app/admin/menus'],
                ['key' => 'pendientes_revision', 'title' => 'Documentos pendientes de revisión', 'value' => $bandeja['pendientes_revision'] ?? 0, 'href' => '/app/documentos/bandejas/pendientes-revision'],
                ['key' => 'listos_firma', 'title' => 'Listos para proceso técnico', 'value' => $bandeja['listos_para_firma'] ?? 0, 'href' => '/app/sistemas/listos-para-firma'],
            ],
            'bandeja_resumen' => $bandeja,
        ];
    }
}
