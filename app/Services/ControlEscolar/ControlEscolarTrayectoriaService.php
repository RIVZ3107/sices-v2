<?php

declare(strict_types=1);

namespace App\Services\ControlEscolar;

use App\Models\Alumno;
use App\Models\DocumentoAcademico;
use App\Models\InscripcionPeriodo;
use App\Models\MateriaCursada;
use App\Models\Matricula;
use App\Models\TrayectoriaAcademica;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class ControlEscolarTrayectoriaService
{
    private const ESTADOS_MATRICULA_ACTIVA = ['activa', 'vigente'];

    public function __construct(
        protected ControlEscolarDashboardService $dashboard,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function consulta(
        User $user,
        ?string $search,
        ?int $alumnoId,
        ?string $periodoFiltro,
        ?string $historialSearch,
    ): array {
        return $this->dashboard->conAlcanceUsuario($user, function () use ($user, $search, $alumnoId, $periodoFiltro, $historialSearch): array {
            $sugerencias = $this->sugerenciasAlumnos($user, $search);
            $alumno = $this->resolverAlumno($user, $search, $alumnoId, $sugerencias);

            if ($alumno === null) {
                return [
                    'actualizado_en' => now()->toIso8601String(),
                    'alumno' => null,
                    'sugerencias' => $sugerencias,
                    'metricas' => null,
                    'avance_curricular' => null,
                    'materias_resumen' => null,
                    'avance_por_semestre' => [],
                    'semestre_actual' => null,
                    'alertas' => [],
                    'historial' => ['data' => [], 'periodos' => []],
                ];
            }

            $alumno->load([
                'matriculaActiva.ofertaAcademica.planEstudio.programaEstudio',
                'matriculaActiva.trayectoriaAcademica',
                'matriculaActiva.inscripcionesPeriodo' => fn ($q) => $q
                    ->whereIn('estatus', ['activa', 'inscrita', 'cursando'])
                    ->orderByDesc('id')
                    ->limit(1),
            ]);

            $matricula = $alumno->matriculaActiva;
            $trayectoria = $matricula?->trayectoriaAcademica;
            $materias = $this->cargarMaterias($matricula, $periodoFiltro, $historialSearch);
            $umbral = (float) config('certificacion.calificacion_aprobatoria_minima', 6.0);

            $resumenMaterias = $this->resumenMaterias($materias, $umbral);
            $creditos = $this->creditosDesdeTrayectoria($trayectoria, $resumenMaterias, $matricula);
            $semestreActual = $this->semestreActual($alumno->matriculaActiva?->inscripcionesPeriodo->first());

            return [
                'actualizado_en' => now()->toIso8601String(),
                'alumno' => $this->fichaAlumno($alumno, $matricula, $semestreActual),
                'sugerencias' => $sugerencias,
                'metricas' => $this->metricas($creditos, $trayectoria, $resumenMaterias),
                'avance_curricular' => $creditos['avance_curricular'],
                'materias_resumen' => $resumenMaterias['resumen'],
                'avance_por_semestre' => $this->avancePorSemestre($materias, $umbral),
                'semestre_actual' => $semestreActual,
                'alertas' => $this->alertas($alumno, $matricula, $resumenMaterias),
                'historial' => [
                    'data' => $materias->map(fn (MateriaCursada $m) => $this->filaHistorial($m, $umbral))->values()->all(),
                    'periodos' => $this->periodosDisponibles($matricula),
                ],
            ];
        });
    }

    /**
     * @return list<array{alumno_id: int, nombre: string, matricula: string, curp: string}>
     */
    protected function sugerenciasAlumnos(User $user, ?string $search): array
    {
        $term = trim((string) $search);
        if ($term === '') {
            return [];
        }

        return $this->queryAlumnosTrayectoria($user, $term)
            ->limit(8)
            ->get()
            ->map(fn (Alumno $a) => [
                'alumno_id' => $a->id,
                'nombre' => $this->nombreCompleto($a),
                'matricula' => (string) ($a->matriculaActiva?->matricula ?? '—'),
                'curp' => (string) $a->curp,
            ])
            ->all();
    }

    /**
     * @param  list<array{alumno_id: int, nombre: string, matricula: string, curp: string}>  $sugerencias
     */
    protected function resolverAlumno(User $user, ?string $search, ?int $alumnoId, array $sugerencias): ?Alumno
    {
        if ($alumnoId !== null && $alumnoId > 0) {
            return $this->queryAlumnosTrayectoria($user, null)
                ->where('id', $alumnoId)
                ->first();
        }

        $term = trim((string) $search);
        if ($term !== '') {
            $match = $this->queryAlumnosTrayectoria($user, $term)->first();
            if ($match !== null) {
                return $match;
            }
            if ($sugerencias !== []) {
                return $this->queryAlumnosTrayectoria($user, null)
                    ->where('id', $sugerencias[0]['alumno_id'])
                    ->first();
            }

            return null;
        }

        return null;
    }

    /**
     * @return Builder<Alumno>
     */
    protected function queryAlumnosTrayectoria(User $user, ?string $search): Builder
    {
        $query = $this->dashboard->queryAlumnosEnAlcance($user)
            ->with(['matriculaActiva.ofertaAcademica.planEstudio.programaEstudio'])
            ->whereHas('matriculaActiva', fn (Builder $m) => $m->whereIn('estado', self::ESTADOS_MATRICULA_ACTIVA));

        $term = trim((string) $search);
        if ($term !== '') {
            $like = '%'.$term.'%';
            $query->where(function (Builder $q) use ($like): void {
                $q->where('curp', 'like', $like)
                    ->orWhere('nombre', 'like', $like)
                    ->orWhere('primer_apellido', 'like', $like)
                    ->orWhere('segundo_apellido', 'like', $like)
                    ->orWhereHas('matriculaActiva', fn (Builder $m) => $m->where('matricula', 'like', $like));
            });
        }

        return $query->orderByDesc('updated_at')->orderByDesc('id');
    }

    /**
     * @return Collection<int, MateriaCursada>
     */
    protected function cargarMaterias(?Matricula $matricula, ?string $periodoFiltro, ?string $historialSearch): Collection
    {
        if ($matricula === null) {
            return collect();
        }

        $query = MateriaCursada::query()
            ->where('matricula_id', $matricula->id)
            ->orderByDesc('numero_periodo_curricular')
            ->orderByDesc('semestre')
            ->orderBy('orden')
            ->orderBy('nombre');

        $periodo = trim((string) $periodoFiltro);
        if ($periodo !== '' && $periodo !== 'todos') {
            $query->where(function (Builder $q) use ($periodo): void {
                $q->where('periodo', $periodo)
                    ->orWhere('etiqueta_periodo_curricular', $periodo);
            });
        }

        $term = trim((string) $historialSearch);
        if ($term !== '') {
            $like = '%'.$term.'%';
            $query->where(function (Builder $q) use ($like): void {
                $q->where('clave', 'like', $like)
                    ->orWhere('nombre', 'like', $like);
            });
        }

        return $query->get();
    }

    /**
     * @return list<string>
     */
    protected function periodosDisponibles(?Matricula $matricula): array
    {
        if ($matricula === null) {
            return ['Todos los periodos'];
        }

        $periodos = MateriaCursada::query()
            ->where('matricula_id', $matricula->id)
            ->selectRaw('COALESCE(NULLIF(periodo, ""), NULLIF(etiqueta_periodo_curricular, "")) as p')
            ->distinct()
            ->pluck('p')
            ->filter(fn ($p) => $p !== null && $p !== '')
            ->values()
            ->all();

        return array_merge(['Todos los periodos'], $periodos);
    }

    /**
     * @param  Collection<int, MateriaCursada>  $materias
     * @return array{
     *   resumen: array{total: int, aprobadas: int, reprobadas: int, en_curso: int, pct_aprobadas: float, pct_reprobadas: float, pct_en_curso: float},
     *   pendientes: int,
     *   creditos_pendientes: int
     * }
     */
    protected function resumenMaterias(Collection $materias, float $umbral): array
    {
        $aprobadas = 0;
        $reprobadas = 0;
        $enCurso = 0;
        $creditosPendientes = 0;

        foreach ($materias as $m) {
            $clasificacion = $this->clasificarMateria($m, $umbral);
            match ($clasificacion) {
                'aprobada' => $aprobadas++,
                'reprobada' => $reprobadas++,
                default => $enCurso++,
            };
            if ($clasificacion === 'en_curso') {
                $creditosPendientes += (int) ($m->creditos ?? 0);
            }
        }

        $total = max(1, $materias->count());

        return [
            'resumen' => [
                'total' => $materias->count(),
                'aprobadas' => $aprobadas,
                'reprobadas' => $reprobadas,
                'en_curso' => $enCurso,
                'pct_aprobadas' => $materias->count() > 0 ? round(($aprobadas / $materias->count()) * 100, 1) : 0,
                'pct_reprobadas' => $materias->count() > 0 ? round(($reprobadas / $materias->count()) * 100, 1) : 0,
                'pct_en_curso' => $materias->count() > 0 ? round(($enCurso / $materias->count()) * 100, 1) : 0,
            ],
            'pendientes' => $enCurso,
            'creditos_pendientes' => $creditosPendientes,
        ];
    }

    /**
     * @param  array{resumen: array<string, mixed>, pendientes: int, creditos_pendientes: int}  $resumenMaterias
     * @return array{
     *   creditos_aprobados: int,
     *   creditos_totales: int,
     *   pct_avance: float,
     *   avance_curricular: array{pct: float, aprobados: int, pendientes: int}
     * }
     */
    protected function creditosDesdeTrayectoria(?TrayectoriaAcademica $trayectoria, array $resumenMaterias, ?Matricula $matricula): array
    {
        $aprobados = (int) ($trayectoria?->creditos_obtenidos ?? 0);
        $totales = (int) ($trayectoria?->creditos_totales ?? 0);

        if ($totales <= 0 && $matricula !== null) {
            $totales = (int) MateriaCursada::query()
                ->where('matricula_id', $matricula->id)
                ->sum('creditos');
        }

        if ($aprobados <= 0 && $matricula !== null) {
            $umbral = (float) config('certificacion.calificacion_aprobatoria_minima', 6.0);
            $aprobados = (int) MateriaCursada::query()
                ->where('matricula_id', $matricula->id)
                ->get()
                ->filter(fn (MateriaCursada $m) => $this->clasificarMateria($m, $umbral) === 'aprobada')
                ->sum(fn (MateriaCursada $m) => (int) ($m->creditos ?? 0));
        }

        if ($totales < $aprobados) {
            $totales = $aprobados + $resumenMaterias['creditos_pendientes'];
        }

        $pendientes = max(0, $totales - $aprobados);
        $pct = $totales > 0 ? round(($aprobados / $totales) * 100, 1) : 0;

        return [
            'creditos_aprobados' => $aprobados,
            'creditos_totales' => max($totales, $aprobados),
            'pct_avance' => $pct,
            'avance_curricular' => [
                'pct' => $pct,
                'aprobados' => $aprobados,
                'pendientes' => $pendientes,
            ],
        ];
    }

    /**
     * @param  array{creditos_aprobados: int, creditos_totales: int, pct_avance: float, avance_curricular: array{pct: float, aprobados: int, pendientes: int}}  $creditos
     * @param  array{resumen: array<string, mixed>, pendientes: int, creditos_pendientes: int}  $resumenMaterias
     * @return array<string, mixed>
     */
    protected function metricas(array $creditos, ?TrayectoriaAcademica $trayectoria, array $resumenMaterias): array
    {
        $promedio = $trayectoria?->promedio !== null
            ? round((float) $trayectoria->promedio, 2)
            : null;

        return [
            'creditos_aprobados' => $creditos['creditos_aprobados'],
            'creditos_totales' => $creditos['creditos_totales'],
            'pct_avance' => $creditos['pct_avance'],
            'promedio' => $promedio !== null ? number_format($promedio, 2, '.', '') : '—',
            'promedio_badge' => $this->badgePromedio($promedio),
            'materias_pendientes' => $resumenMaterias['pendientes'],
            'creditos_pendientes' => $resumenMaterias['creditos_pendientes'],
            'pendientes_badge' => $resumenMaterias['pendientes'] > 0 ? 'En curso' : 'Al día',
            'riesgo' => $this->etiquetaRiesgo($resumenMaterias['resumen']['reprobadas'] ?? 0),
            'riesgo_sub' => $this->subRiesgo($resumenMaterias['resumen']['reprobadas'] ?? 0),
            'riesgo_badge' => $this->badgeRiesgo($resumenMaterias['resumen']['reprobadas'] ?? 0),
        ];
    }

    /**
     * @param  Collection<int, MateriaCursada>  $materias
     * @return list<array{semestre: int, pct: float}>
     */
    protected function avancePorSemestre(Collection $materias, float $umbral): array
    {
        $porSemestre = [];

        foreach ($materias as $m) {
            $sem = (int) ($m->numero_periodo_curricular ?? $m->semestre ?? 0);
            if ($sem <= 0) {
                continue;
            }
            $porSemestre[$sem]['total'] = ($porSemestre[$sem]['total'] ?? 0) + 1;
            if ($this->clasificarMateria($m, $umbral) === 'aprobada') {
                $porSemestre[$sem]['aprobadas'] = ($porSemestre[$sem]['aprobadas'] ?? 0) + 1;
            }
        }

        if ($porSemestre === []) {
            return [];
        }

        ksort($porSemestre);
        $items = [];
        foreach ($porSemestre as $sem => $datos) {
            $total = (int) ($datos['total'] ?? 0);
            $aprobadas = (int) ($datos['aprobadas'] ?? 0);
            $items[] = [
                'semestre' => (int) $sem,
                'pct' => $total > 0 ? round(($aprobadas / $total) * 100, 1) : 0,
            ];
        }

        return $items;
    }

    /**
     * @param  array{resumen: array<string, mixed>, pendientes: int, creditos_pendientes: int}  $resumenMaterias
     * @return list<array{titulo: string, desc: string, tipo: string}>
     */
    protected function alertas(Alumno $alumno, ?Matricula $matricula, array $resumenMaterias): array
    {
        $alertas = [];
        $reprobadas = (int) ($resumenMaterias['resumen']['reprobadas'] ?? 0);

        if ($reprobadas > 0) {
            $alertas[] = [
                'titulo' => $reprobadas === 1 ? '1 materia reprobada' : "{$reprobadas} materias reprobadas",
                'desc' => 'Requieren regularización.',
                'tipo' => 'warning',
            ];
        }

        $pendientes = (int) ($resumenMaterias['pendientes'] ?? 0);
        if ($pendientes > 0) {
            $alertas[] = [
                'titulo' => $pendientes === 1 ? '1 materia sin calificación' : "{$pendientes} materias sin calificación",
                'desc' => 'Calificaciones pendientes de captura.',
                'tipo' => 'info',
            ];
        }

        $docsObs = DocumentoAcademico::query()
            ->where('alumno_id', $alumno->id)
            ->whereHas('observacionesPendientes')
            ->count();

        if ($docsObs > 0) {
            $alertas[] = [
                'titulo' => 'Documentos con observaciones',
                'desc' => $docsObs === 1 ? '1 documento requiere atención.' : "{$docsObs} documentos requieren atención.",
                'tipo' => 'doc',
            ];
        }

        if ($matricula !== null) {
            $sinTrayectoria = $matricula->trayectoriaAcademica === null
                && MateriaCursada::query()->where('matricula_id', $matricula->id)->exists();
            if ($sinTrayectoria) {
                $alertas[] = [
                    'titulo' => 'Trayectoria sin consolidar',
                    'desc' => 'Recalcule la trayectoria desde materias cursadas.',
                    'tipo' => 'info',
                ];
            }
        }

        return array_slice($alertas, 0, 5);
    }

    protected function semestreActual(?InscripcionPeriodo $inscripcion): ?string
    {
        if ($inscripcion === null) {
            return null;
        }

        if ($inscripcion->etiqueta_periodo_curricular) {
            return (string) $inscripcion->etiqueta_periodo_curricular;
        }

        $num = (int) ($inscripcion->numero_periodo_curricular ?? $inscripcion->semestre ?? 0);

        return $num > 0 ? $num.'°' : null;
    }

    /**
     * @return array<string, mixed>
     */
    protected function fichaAlumno(Alumno $alumno, ?Matricula $matricula, ?string $semestreActual): array
    {
        $prog = $matricula?->ofertaAcademica?->planEstudio?->programaEstudio;

        return [
            'alumno_id' => $alumno->id,
            'matricula_id' => $matricula?->id,
            'nombre' => $this->nombreCompleto($alumno),
            'matricula' => $matricula?->matricula ?? '—',
            'curp' => (string) $alumno->curp,
            'programa' => $prog?->nombre ?? '—',
            'semestre' => $semestreActual ?? '—',
            'estatus' => ucfirst((string) ($alumno->estatus ?? 'activo')),
            'expediente_url' => '/app/alumnos/'.$alumno->id.'/expediente',
        ];
    }

    /**
     * @return array{clave: string, nombre: string, periodo: string, calificacion: string, creditos: int, estatus: string}
     */
    protected function filaHistorial(MateriaCursada $m, float $umbral): array
    {
        $clasificacion = $this->clasificarMateria($m, $umbral);

        return [
            'clave' => (string) ($m->clave ?? '—'),
            'nombre' => (string) ($m->nombre ?? '—'),
            'periodo' => (string) ($m->periodo ?? $m->etiqueta_periodo_curricular ?? '—'),
            'calificacion' => $m->calificacion !== null
                ? number_format((float) $m->calificacion, 1, '.', '')
                : ($m->calificacion_texto ? (string) $m->calificacion_texto : '—'),
            'creditos' => (int) ($m->creditos ?? 0),
            'estatus' => match ($clasificacion) {
                'aprobada' => 'Aprobada',
                'reprobada' => 'Reprobada',
                default => 'En curso',
            },
        ];
    }

    protected function clasificarMateria(MateriaCursada $m, float $umbral): string
    {
        $estado = strtolower((string) ($m->estado ?? ''));

        if (in_array($estado, ['acreditada', 'aprobada', 'acreditado'], true)) {
            return 'aprobada';
        }
        if (in_array($estado, ['no_acreditada', 'reprobada', 'reprobado'], true)) {
            return 'reprobada';
        }

        if ($m->calificacion !== null) {
            return (float) $m->calificacion >= $umbral ? 'aprobada' : 'reprobada';
        }

        return 'en_curso';
    }

    protected function badgePromedio(?float $promedio): string
    {
        if ($promedio === null) {
            return 'Pendiente';
        }

        return match (true) {
            $promedio >= 9.0 => 'Excelente',
            $promedio >= 8.0 => 'Bueno',
            $promedio >= 7.0 => 'Satisfactorio',
            default => 'Regular',
        };
    }

    protected function etiquetaRiesgo(int $reprobadas): string
    {
        return match (true) {
            $reprobadas >= 4 => 'Alto',
            $reprobadas >= 2 => 'Medio',
            default => 'Bajo',
        };
    }

    protected function subRiesgo(int $reprobadas): string
    {
        return match (true) {
            $reprobadas >= 4 => 'Revisar regularización urgente',
            $reprobadas >= 2 => 'Seguimiento recomendado',
            default => 'Sin alertas críticas',
        };
    }

    protected function badgeRiesgo(int $reprobadas): string
    {
        return match (true) {
            $reprobadas >= 4 => 'Alto',
            $reprobadas >= 2 => 'En riesgo',
            default => 'Estable',
        };
    }

    protected function nombreCompleto(Alumno $alumno): string
    {
        return trim(implode(' ', array_filter([
            $alumno->nombre,
            $alumno->primer_apellido,
            $alumno->segundo_apellido,
        ])));
    }
}
