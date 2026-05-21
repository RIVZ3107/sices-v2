<?php

declare(strict_types=1);

namespace App\Services\Dashboard;

use App\Models\Alumno;
use App\Models\Institucion;
use App\Models\PlanEstudio;
use App\Models\ProgramaEstudio;
use App\Models\Sede;
use App\Models\TrayectoriaAcademica;
use App\Models\User;
use App\Services\Certificacion\BandejaDocumentoAcademicoService;
use App\Services\Certificacion\SolicitudMatriculaService;
use Illuminate\Auth\Access\AuthorizationException;

/**
 * Métricas ligeras para módulos de Educación Superior (sin tablas ni agregaciones pesadas del dashboard).
 */
final class EducacionSuperiorMetricasService
{
    public function __construct(
        private readonly BandejaDocumentoAcademicoService $bandejas,
        private readonly SolicitudMatriculaService $solicitudesMatricula,
        private readonly DashboardRequestFactory $requestFactory,
    ) {}

    /**
     * @return array<string, int>
     */
    public function build(User $user): array
    {
        if (! $user->hasAnyRole(['superadmin', 'admin', 'educacion_superior'])) {
            throw new AuthorizationException('No autorizado para consultar métricas de Educación Superior.');
        }

        $req = $this->requestFactory->forUser($user);
        $bandeja = $this->bandejas->resumen($req);
        $solicitudes = $this->solicitudesMatricula->metricasEducacionSuperior($user);

        return array_merge($bandeja, $solicitudes, [
            'instituciones_activas' => Institucion::query()->where('activo', true)->count(),
            'sedes_registradas' => Sede::query()->where('activo', true)->count(),
            'programas_academicos_vigentes' => ProgramaEstudio::query()->where('activo', true)->count(),
            'planes_estudio_vigentes' => PlanEstudio::query()->where('activo', true)->count(),
            'alumnos_activos' => Alumno::query()->where('estatus', 'activo')->count(),
            'egresados_candidatos' => TrayectoriaAcademica::query()
                ->whereIn('estado', ['consolidada', 'lista_certificacion'])
                ->count(),
            'certificados_emitidos_referencia' => (int) ($bandeja['firmados'] ?? 0),
            'documentos_proceso_tecnico' => (int) ($bandeja['listos_para_firma'] ?? 0),
            'documentos_emitidos' => (int) ($bandeja['firmados'] ?? 0),
            'alertas_normativas' => (int) ($bandeja['rechazados'] ?? 0),
        ]);
    }
}
