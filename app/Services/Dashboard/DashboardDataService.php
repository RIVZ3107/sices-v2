<?php

declare(strict_types=1);

namespace App\Services\Dashboard;

use App\Models\User;
use App\Services\ControlEscolar\ControlEscolarDashboardService;
use Illuminate\Auth\Access\AuthorizationException;

final class DashboardDataService
{
    public function __construct(
        private readonly DashboardRoleResolver $resolver,
        private readonly SuperadminDashboardService $superadmin,
        private readonly AdminDashboardService $admin,
        private readonly SistemasDashboardService $sistemas,
        private readonly EducacionSuperiorDashboardService $educacionSuperior,
        private readonly DirectorEscuelaDashboardService $director,
        private readonly ControlEscolarDashboardService $controlEscolar,
        private readonly ResponsableAdmisionDashboardService $admision,
        private readonly ResponsableEvaluacionDashboardService $evaluacion,
        private readonly ResponsableCertificacionDashboardService $certificacion,
        private readonly DocenteDashboardService $docente,
        private readonly AuditorDashboardService $auditor,
        private readonly ConsultaDashboardService $consulta,
        private readonly CoordinadorAcademicoDashboardService $coordinador,
        private readonly AlumnoEgresadoDashboardService $alumno,
        private readonly AspiranteDashboardService $aspirante,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function forUser(User $user): array
    {
        $role = $this->resolver->resolvePrimaryRole($user);
        if ($role === null) {
            throw new AuthorizationException('No hay rol de aplicación asignado para mostrar el panel.');
        }

        $payload = match ($role) {
            'superadmin' => $this->superadmin->build($user),
            'admin' => $this->admin->build($user),
            'sistemas' => $this->sistemas->build($user),
            'educacion_superior' => $this->educacionSuperior->build($user),
            'director_escuela' => $this->director->build($user),
            'control_escolar_escuela' => $this->controlEscolar->resumen($user),
            'responsable_admision' => $this->admision->build($user),
            'responsable_evaluacion' => $this->evaluacion->build($user),
            'responsable_certificacion_titulacion' => $this->certificacion->build($user),
            'docente' => $this->docente->build($user),
            'auditor' => $this->auditor->build($user),
            'consulta' => $this->consulta->build($user),
            'coordinador_academico' => $this->coordinador->build($user),
            'alumno_egresado' => $this->alumno->build($user),
            'aspirante_preinscrito' => $this->aspirante->build($user),
            default => throw new AuthorizationException('Rol no soportado para el panel unificado.'),
        };

        $technical = match ($role) {
            'superadmin', 'admin', 'sistemas' => true,
            default => false,
        };

        if ($role === 'control_escolar_escuela') {
            $payload['technical'] = false;
            $payload['variant'] = 'control_escolar_escuela';
        } else {
            $payload['technical'] = $payload['technical'] ?? $technical;
        }

        return [
            'role' => $role,
            'payload' => $payload,
        ];
    }
}
