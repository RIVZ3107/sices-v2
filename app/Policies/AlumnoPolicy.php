<?php

declare(strict_types=1);

namespace App\Policies;

use App\Models\Alumno;
use App\Models\User;

class AlumnoPolicy
{
    public function view(User $user, Alumno $alumno): bool
    {
        return $user->can('ver_alumnos');
    }

    public function create(User $user): bool
    {
        return $user->can('gestionar_alumnos');
    }

    public function update(User $user, Alumno $alumno): bool
    {
        return $user->can('gestionar_alumnos');
    }
}
