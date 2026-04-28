<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Matricula;
use App\Models\User;
use App\Services\Certificacion\CertificacionAlcanceService;

class MatriculaPolicy
{
    public function __construct(
        protected CertificacionAlcanceService $alcance,
    ) {}

    public function view(User $user, Matricula $matricula): bool
    {
        if (! $user->can('ver_matriculas')) {
            return false;
        }

        return $this->alcance->ofertaEnAlcance($user, (int) $matricula->oferta_academica_id);
    }

    public function create(User $user): bool
    {
        return $user->can('gestionar_matriculas');
    }
}
