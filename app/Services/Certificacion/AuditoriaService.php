<?php

declare(strict_types=1);

namespace App\Services\Certificacion;

use App\Models\AuditoriaEvento;

class AuditoriaService
{
    /**
     * @param  array<string, mixed>  $payload
     * @param  array<string, mixed>  $metadata
     */
    public function registrar(
        string $evento,
        ?string $entidadTipo = null,
        ?int $entidadId = null,
        array $payload = [],
        ?int $userId = null,
        ?string $ip = null,
        ?string $userAgent = null,
        array $metadata = [],
    ): AuditoriaEvento {
        return AuditoriaEvento::query()->create([
            'user_id' => $userId,
            'evento' => $evento,
            'entidad_tipo' => $entidadTipo,
            'entidad_id' => $entidadId,
            'payload' => $payload,
            'ip' => $ip,
            'user_agent' => $userAgent,
            'metadata' => $metadata,
        ]);
    }
}
