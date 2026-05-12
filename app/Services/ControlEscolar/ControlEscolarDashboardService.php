<?php

declare(strict_types=1);

namespace App\Services\ControlEscolar;

use App\Models\Alumno;
use App\Models\DocumentoAcademico;
use App\Models\ImportacionHistoricaMaterias;
use App\Models\InscripcionPeriodo;
use App\Models\Matricula;
use App\Models\OfertaAcademica;
use App\Models\TrayectoriaAcademica;
use App\Models\User;
use App\Services\Certificacion\CertificacionAlcanceService;
use App\Services\Certificacion\CertificacionImportacionLegacyNormativaGate;
use App\Services\Certificacion\SolicitudMatriculaService;
use Illuminate\Database\Eloquent\Builder;

class ControlEscolarDashboardService
{
    public function __construct(
        protected CertificacionAlcanceService $alcance,
        protected SolicitudMatriculaService $solicitudesMatricula,
    ) {}

    public function resumen(User $user): array
    {
        $alumnosActivos = $this->alumnosBaseQuery($user)->where('estatus', 'activo')->count();
        $aspirantesPendientes = $this->alumnosBaseQuery($user)->where('estatus', 'aspirante')->count();
        $matriculasIncompletas = $this->alumnosSinMatriculaActiva($user)->count();
        $inscripcionesPendientes = $this->matriculasSinInscripcionActiva($user)->count();
        $cargasPendientes = $this->inscripcionesSinCarga($user)->count();
        $calificacionesPendientes = $this->inscripcionesConCalificacionesPendientes($user)->count();
        $importacionesConErrores = $this->importacionesConErrores($user)->count();
        $trayectoriasListas = $this->trayectoriasListas($user)->count();
        $documentosConObservaciones = $this->documentosConObservaciones($user)->count();
        $solicitudesRevision = $this->solicitudesEnRevision($user)->count();

        $solicitudesMetricas = $user->can('ver_solicitud_matricula')
            ? $this->solicitudesMatricula->metricasControlEscolar($user)
            : [
                'solicitudes_matricula_borrador' => 0,
                'solicitudes_matricula_enviadas' => 0,
                'solicitudes_matricula_con_observaciones' => 0,
                'solicitudes_matricula_matricula_asignada' => 0,
            ];

        $metricas = array_merge([
            'alumnos_activos' => $alumnosActivos,
            'aspirantes_pendientes' => $aspirantesPendientes,
            'matriculas_incompletas' => $matriculasIncompletas,
            'inscripciones_pendientes' => $inscripcionesPendientes,
            'cargas_academicas_pendientes' => $cargasPendientes,
            'calificaciones_pendientes' => $calificacionesPendientes,
            'importaciones_con_errores' => $importacionesConErrores,
            'trayectorias_listas_para_certificar' => $trayectoriasListas,
            'documentos_con_observaciones' => $documentosConObservaciones,
            'solicitudes_en_revision' => $solicitudesRevision,
        ], $solicitudesMetricas);

        return [
            'contexto' => [
                'subsistema' => $user->instituciones()->with('subsistema')->first()?->subsistema?->nombre ?? 'Subsistema no asignado',
                'institucion' => $user->instituciones()->first()?->nombre ?? 'Institucion no asignada',
                'sede' => $user->sedes()->first()?->nombre ?? 'Sede no asignada',
                'ciclo_escolar' => now()->format('Y').'-'.(string) ((int) now()->format('Y') + 1),
            ],
            'metricas' => $metricas,
            'cards' => [
                ['key' => 'alumnos_activos', 'title' => 'Alumnos activos', 'value' => $metricas['alumnos_activos'], 'href' => '/app/expedientes'],
                ['key' => 'solicitudes_matricula', 'title' => 'Solicitudes de matrícula', 'value' => ($metricas['solicitudes_matricula_borrador'] ?? 0) + ($metricas['solicitudes_matricula_enviadas'] ?? 0) + ($metricas['solicitudes_matricula_con_observaciones'] ?? 0), 'href' => '/app/expedientes'],
                ['key' => 'inscripciones_pendientes', 'title' => 'Inscripciones pendientes', 'value' => $metricas['inscripciones_pendientes'], 'href' => '/app/expedientes'],
                ['key' => 'calificaciones_pendientes', 'title' => 'Calificaciones pendientes', 'value' => $metricas['calificaciones_pendientes'], 'href' => '/app/expedientes'],
                ['key' => 'documentos_obs', 'title' => 'Documentos con observaciones', 'value' => $metricas['documentos_con_observaciones'], 'href' => '/app/expedientes'],
            ],
            'pendientes_prioritarios' => $this->pendientesPrioritarios($user),
            'documentos_en_proceso' => $this->documentosEnProceso($user),
            'importaciones_recientes' => $this->importacionesRecientes($user),
        ];
    }

    protected function pendientesPrioritarios(User $user): array
    {
        $pendientes = [];
        $push = static function (array &$items, string $alumno, string $curp, string $matricula, string $problema, string $prioridad, string $accion, ?int $alumnoId): void {
            if (count($items) >= 12) {
                return;
            }
            $items[] = [
                'alumno' => $alumno,
                'curp' => $curp,
                'matricula' => $matricula,
                'problema' => $problema,
                'prioridad' => $prioridad,
                'siguiente_accion' => $accion,
                'expediente_url' => $alumnoId ? '/app/expedientes?alumno='.$alumnoId : '/app/expedientes',
            ];
        };

        foreach ($this->alumnosSinMatriculaActiva($user)->limit(3)->get() as $alumno) {
            $push($pendientes, $this->nombreAlumno($alumno), (string) $alumno->curp, 'Sin matricula', 'Expediente incompleto: falta matricula activa', 'Alta', 'Solicitar matricula a Educacion Superior', (int) $alumno->id);
        }
        foreach ($this->matriculasSinInscripcionActiva($user)->limit(3)->get() as $matricula) {
            $push($pendientes, $this->nombreAlumno($matricula->alumno), (string) $matricula->alumno?->curp, (string) $matricula->matricula, 'Inscripcion pendiente', 'Alta', 'Registrar inscripcion de periodo', (int) $matricula->alumno_id);
        }
        foreach ($this->inscripcionesSinCarga($user)->limit(3)->get() as $inscripcion) {
            $push($pendientes, $this->nombreAlumno($inscripcion->matricula?->alumno), (string) $inscripcion->matricula?->alumno?->curp, (string) $inscripcion->matricula?->matricula, 'Carga academica pendiente', 'Media', 'Generar carga academica', (int) $inscripcion->matricula?->alumno_id);
        }
        foreach ($this->documentosConObservaciones($user)->limit(3)->get() as $doc) {
            $push($pendientes, $this->nombreAlumno($doc->alumno), (string) $doc->alumno?->curp, (string) $doc->matricula?->matricula, 'Documento con observaciones', 'Alta', 'Atender observacion', (int) $doc->alumno_id);
        }

        return $pendientes;
    }

    protected function documentosEnProceso(User $user): array
    {
        return $this->documentosBaseQuery($user)
            ->whereIn('estado_workflow', ['borrador', 'en_revision', 'pendiente_revision'])
            ->with(['alumno:id,nombre,primer_apellido,segundo_apellido,curp', 'matricula:id,matricula'])
            ->latest('id')
            ->limit(10)
            ->get()
            ->map(fn (DocumentoAcademico $doc) => [
                'alumno' => $this->nombreAlumno($doc->alumno),
                'curp' => $doc->alumno?->curp,
                'matricula' => $doc->matricula?->matricula,
                'estado' => $this->estadoHumano($doc->estado_workflow),
                'accion' => 'Ver seguimiento',
                'expediente_url' => '/app/expedientes?alumno='.$doc->alumno_id.'&tab=certificacion',
            ])
            ->values()
            ->all();
    }

    protected function importacionesRecientes(User $user): array
    {
        return $this->importacionesBaseQuery($user)
            ->latest('id')
            ->limit(10)
            ->get()
            ->map(fn (ImportacionHistoricaMaterias $imp) => [
                'matricula' => $imp->matricula?->matricula ?? 'Sin matricula',
                'alumno' => $this->nombreAlumno($imp->matricula?->alumno),
                'estado' => $this->estadoImportacionHumano($imp),
                'resultado' => data_get($imp->validacion_payload, 'tiene_bloqueos') ? 'Con errores' : 'Sin errores',
            ])
            ->values()
            ->all();
    }

    protected function alumnosBaseQuery(User $user): Builder
    {
        $query = Alumno::query();
        $this->alcance->aplicarAlcanceAlumnos($query, $user);

        return $query;
    }

    protected function alumnosSinMatriculaActiva(User $user): Builder
    {
        return $this->alumnosBaseQuery($user)->whereDoesntHave('matriculas', function (Builder $q): void {
            $q->whereIn('estado', ['activa', 'vigente']);
        });
    }

    protected function matriculasSinInscripcionActiva(User $user): Builder
    {
        $ofertas = OfertaAcademica::query();
        $this->alcance->aplicarAlcanceOfertasAcademicas($ofertas, $user);
        $query = Matricula::query()->with('alumno');
        $query->whereIn('estado', ['activa', 'vigente']);
        $query->whereIn('oferta_academica_id', $ofertas->pluck('id'));
        $query->whereDoesntHave('inscripcionesPeriodo', function (Builder $q): void {
            $q->whereIn('estatus', ['activa', 'inscrita']);
        });

        return $query;
    }

    protected function inscripcionesSinCarga(User $user): Builder
    {
        $ofertas = OfertaAcademica::query();
        $this->alcance->aplicarAlcanceOfertasAcademicas($ofertas, $user);
        $ofertasIds = $ofertas->pluck('id');
        $query = InscripcionPeriodo::query()->with('matricula.alumno');
        $query->whereIn('estatus', ['activa', 'inscrita']);
        $query->whereDoesntHave('cargasAcademicas');
        $query->whereHas('matricula', function (Builder $mat): void {
            $mat->whereIn('estado', ['activa', 'vigente']);
        });
        $query->whereHas('matricula', fn (Builder $mat) => $mat->whereIn('oferta_academica_id', $ofertasIds));

        return $query;
    }

    protected function inscripcionesConCalificacionesPendientes(User $user): Builder
    {
        $ofertas = OfertaAcademica::query();
        $this->alcance->aplicarAlcanceOfertasAcademicas($ofertas, $user);
        $ofertasIds = $ofertas->pluck('id');

        return InscripcionPeriodo::query()
            ->whereIn('estatus', ['activa', 'inscrita'])
            ->whereHas('cargasAcademicas')
            ->whereHas('matricula', function (Builder $mat): void {
                $mat->whereIn('estado', ['activa', 'vigente']);
            })
            ->whereHas('matricula', fn (Builder $mat) => $mat->whereIn('oferta_academica_id', $ofertasIds))
            ->where(function (Builder $q): void {
                $q->whereDoesntHave('cargasAcademicas.materiasCursadas')
                    ->orWhereHas('cargasAcademicas.materiasCursadas', function (Builder $m): void {
                        $m->whereNull('calificacion');
                    });
            });
    }

    protected function importacionesConErrores(User $user): Builder
    {
        return $this->importacionesBaseQuery($user)
            ->where(function (Builder $q): void {
                $q->where('estado', 'error')
                    ->orWhere('estado', 'rechazada')
                    ->orWhere('validacion_payload->tiene_bloqueos', true);
            });
    }

    protected function importacionesBaseQuery(User $user): Builder
    {
        $query = ImportacionHistoricaMaterias::query()->with('matricula.alumno');
        $query->whereHas('matricula', function (Builder $mat) use ($user): void {
            $ofertas = \App\Models\OfertaAcademica::query();
            $this->alcance->aplicarAlcanceOfertasAcademicas($ofertas, $user);
            $mat->whereIn('oferta_academica_id', $ofertas->pluck('id'));
        });

        return $query;
    }

    protected function trayectoriasListas(User $user): Builder
    {
        $ofertas = OfertaAcademica::query();
        $this->alcance->aplicarAlcanceOfertasAcademicas($ofertas, $user);
        $ofertasIds = $ofertas->pluck('id');

        return TrayectoriaAcademica::query()
            ->whereIn('estado', ['consolidada', 'lista_certificacion'])
            ->whereHas('matricula', function (Builder $q) use ($ofertasIds): void {
                $q->whereIn('estado', ['activa', 'vigente']);
                $q->whereIn('oferta_academica_id', $ofertasIds);
            });
    }

    protected function documentosConObservaciones(User $user): Builder
    {
        return $this->documentosBaseQuery($user)
            ->with(['alumno', 'matricula'])
            ->whereHas('observacionesPendientes');
    }

    protected function solicitudesEnRevision(User $user): Builder
    {
        return $this->documentosBaseQuery($user)->where('estado_workflow', 'en_revision');
    }

    protected function documentosBaseQuery(User $user): Builder
    {
        $query = DocumentoAcademico::query();
        $this->alcance->aplicarAlcanceDocumentosAcademicos($query, $user);

        return $query;
    }

    protected function nombreAlumno(?Alumno $alumno): string
    {
        if ($alumno === null) {
            return 'Alumno no disponible';
        }

        return trim(implode(' ', array_filter([$alumno->nombre, $alumno->primer_apellido, $alumno->segundo_apellido])));
    }

    protected function estadoHumano(?string $estado): string
    {
        return match ($estado) {
            'borrador' => 'Borrador',
            'en_revision' => 'En revision',
            'pendiente_revision' => 'Pendiente de revision',
            'aprobado' => 'Aprobado',
            'rechazado' => 'Con observaciones',
            default => $estado ?: 'Sin estado',
        };
    }

    protected function estadoImportacionHumano(ImportacionHistoricaMaterias $imp): string
    {
        if (data_get($imp->validacion_payload, 'tiene_bloqueos') === true) {
            return 'Con errores de validacion';
        }
        if ($imp->estado === 'confirmada') {
            return 'Confirmada';
        }

        return 'En proceso';
    }
}
