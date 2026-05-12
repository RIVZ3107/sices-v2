<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Alumno;
use App\Models\User;
use App\Services\Certificacion\CertificacionAlcanceService;
use App\Support\SicesAuth;

class AlumnoPolicy
{
    public function __construct(
        protected CertificacionAlcanceService $alcance,
    ) {}

    public function viewAny(User $user): bool
    {
        return SicesAuth::canAny($user, 'ver_alumnos', 'alumnos.ver', 'expedientes.ver');
    }

    public function view(User $user, Alumno $alumno): bool
    {
        if (! SicesAuth::canAny($user, 'ver_alumnos', 'alumnos.ver', 'expedientes.ver')) {
            return false;
        }

        return $this->alcance->alumnoAccesible($user, $alumno);
    }

    public function create(User $user): bool
    {
        return SicesAuth::canAny($user, 'gestionar_alumnos', 'alumnos.crear', 'expedientes.crear');
    }

    public function update(User $user, Alumno $alumno): bool
    {
        if (! SicesAuth::canAny($user, 'gestionar_alumnos', 'alumnos.editar', 'expedientes.editar', 'alumnos.crear')) {
            return false;
        }

        return $this->alcance->alumnoAccesible($user, $alumno);
    }
}
