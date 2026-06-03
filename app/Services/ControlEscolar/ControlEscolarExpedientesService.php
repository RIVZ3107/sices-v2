<?php

declare(strict_types=1);

namespace App\Services\ControlEscolar;

/**
 * Fachada de compatibilidad: delega en {@see ControlEscolarExpedienteOperativoService}.
 */
class ControlEscolarExpedientesService extends ControlEscolarExpedienteOperativoService
{
    /** @deprecated Use gestion() con array de filtros */
    public function gestionLegacy($user, ?string $search, int $page, int $perPage): array
    {
        return $this->gestion($user, [
            'search' => $search ?? '',
            'page' => $page,
            'per_page' => $perPage,
        ]);
    }
}
