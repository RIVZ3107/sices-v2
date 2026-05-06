<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Alumno;
use App\Models\User;
use App\Services\Certificacion\CertificacionAlcanceService;

class AlumnoPolicy
{
    public function __construct(
        protected CertificacionAlcanceService $alcance,
    ) {}

    public function viewAny(User $user): bool
    {
        return $user->can('ver_alumnos');
    }

    public function view(User $user, Alumno $alumno): bool
    {
        if (! $user->can('ver_alumnos')) {
            return false;
        }

        return $this->alcance->alumnoAccesible($user, $alumno);
    }

    public function create(User $user): bool
    {
        return $user->can('gestionar_alumnos');
    }

    public function update(User $user, Alumno $alumno): bool
    {
        if (! $user->can('gestionar_alumnos')) {
            return false;
        }

        return $this->alcance->alumnoAccesible($user, $alumno);
    }
}
