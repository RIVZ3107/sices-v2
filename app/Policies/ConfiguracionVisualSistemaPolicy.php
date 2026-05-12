<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\ConfiguracionVisualSistema;
use App\Models\User;

class ConfiguracionVisualSistemaPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->can('apariencia_sistema.ver') || $user->can('apariencia_sistema.administrar');
    }

    public function create(User $user): bool
    {
        return $user->can('apariencia_sistema.administrar');
    }

    public function update(User $user, ConfiguracionVisualSistema $configuracionVisualSistema): bool
    {
        return $user->can('apariencia_sistema.administrar');
    }

    public function publicar(User $user, ConfiguracionVisualSistema $configuracionVisualSistema): bool
    {
        return $user->can('apariencia_sistema.administrar') || $user->can('apariencia_sistema.publicar');
    }

    public function restaurar(User $user, ConfiguracionVisualSistema $configuracionVisualSistema): bool
    {
        return $user->can('apariencia_sistema.administrar') || $user->can('apariencia_sistema.restaurar');
    }

    public function subirImagenes(User $user): bool
    {
        return $user->can('apariencia_sistema.administrar') || $user->can('apariencia_sistema.subir_imagenes');
    }
}
