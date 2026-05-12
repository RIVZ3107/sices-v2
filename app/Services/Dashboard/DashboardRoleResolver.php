<?php

declare(strict_types=1);

namespace App\Services\Dashboard;

use App\Models\User;

final class DashboardRoleResolver
{
    /** @var list<string> */
    public const PRIORITY = [
        'superadmin',
        'admin',
        'sistemas',
        'educacion_superior',
        'director_escuela',
        'control_escolar_escuela',
        'responsable_admision',
        'responsable_evaluacion',
        'responsable_certificacion_titulacion',
        'docente',
        'auditor',
        'consulta',
        'coordinador_academico',
        'alumno_egresado',
        'aspirante_preinscrito',
    ];

    public function resolvePrimaryRole(User $user): ?string
    {
        $names = $user->getRoleNames()->all();
        foreach (self::PRIORITY as $role) {
            if (in_array($role, $names, true)) {
                return $role;
            }
        }

        return $names[0] ?? null;
    }
}
