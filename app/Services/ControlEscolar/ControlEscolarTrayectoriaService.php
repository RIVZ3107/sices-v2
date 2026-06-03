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
use App\Services\Certificacion\AuditoriaService;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ControlEscolarTrayectoriaService
{
    private const ESTADOS_MATRICULA_ACTIVA = ['activa', 'vigente'];

    public function __construct(
        protected ControlEscolarDashboardService $dashboard,
        protected AuditoriaService $auditoria,
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
            'periodo' => $this->nombrePeriodo((string) ($m->periodo ?? $m->etiqueta_periodo_curricular ?? '')),
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
        $nombre = trim(implode(' ', array_filter([
            $alumno->nombre,
            $alumno->primer_apellido,
            $alumno->segundo_apellido,
        ])));
        if (stripos($nombre, 'demosynthetic') !== false) {
            return 'Alumno institucional';
        }

        return $nombre !== '' ? $nombre : 'Alumno sin nombre';
    }

    protected function nombrePeriodo(?string $periodo): string
    {
        $p = trim((string) $periodo);
        if ($p === '' || stripos($p, 'demo') !== false) {
            return 'Periodo escolar';
        }

        return $p;
    }

    /**
     * @param  array<string, mixed>  $filtros
     * @return array{data: list<array<string, mixed>>, meta: array<string, int>}
     */
    public function buscarAlumnos(User $user, array $filtros): array
    {
        return $this->dashboard->conAlcanceUsuario($user, function () use ($user, $filtros): array {
            $term = trim((string) ($filtros['search'] ?? ''));
            $perPage = max(1, min(25, (int) ($filtros['per_page'] ?? 10)));
            $paginator = $this->queryAlumnosTrayectoria($user, $term !== '' ? $term : null)
                ->paginate($perPage, ['*'], 'page', max(1, (int) ($filtros['page'] ?? 1)));

            return [
                'data' => collect($paginator->items())->map(fn (Alumno $a) => [
                    'alumno_id' => $a->id,
                    'nombre' => $this->nombreCompleto($a),
                    'matricula' => (string) ($a->matriculaActiva?->matricula ?? '—'),
                    'curp' => (string) $a->curp,
                    'programa' => $a->matriculaActiva?->ofertaAcademica?->planEstudio?->programaEstudio?->nombre ?? '—',
                ])->values()->all(),
                'meta' => [
                    'current_page' => $paginator->currentPage(),
                    'last_page' => $paginator->lastPage(),
                    'total' => $paginator->total(),
                ],
            ];
        });
    }

    /**
     * @return array<string, mixed>
     */
    public function alumnoDetalle(User $user, int $alumnoId): array
    {
        return $this->dashboard->conAlcanceUsuario($user, function () use ($user, $alumnoId): array {
            $data = $this->consulta($user, null, $alumnoId, null, null);
            if ($data['alumno'] === null) {
                throw ValidationException::withMessages(['alumno_id' => ['Alumno fuera de su alcance o no encontrado.']]);
            }
            $this->registrarAuditoria($user, 'trayectoria.consultar', $alumnoId);

            return $data;
        });
    }

    /**
     * @return array<string, mixed>
     */
    public function resumenKpis(User $user, int $alumnoId): array
    {
        $data = $this->alumnoDetalle($user, $alumnoId);
        $m = $data['metricas'] ?? [];
        $mr = $data['materias_resumen'] ?? [];
        $ac = $data['avance_curricular'] ?? [];

        return [
            'promedio_general' => is_numeric(str_replace('—', '', (string) ($m['promedio'] ?? ''))) ? (float) $m['promedio'] : null,
            'escala_promedio' => '0-10',
            'creditos_aprobados' => (int) ($ac['aprobados'] ?? $m['creditos_aprobados'] ?? 0),
            'creditos_totales' => (int) ($m['creditos_totales'] ?? 0),
            'porcentaje_creditos' => (float) ($m['pct_avance'] ?? 0),
            'materias_aprobadas' => (int) ($mr['aprobadas'] ?? 0),
            'materias_totales' => max(1, (int) ($mr['total'] ?? 0)),
            'porcentaje_materias' => (float) ($mr['pct_aprobadas'] ?? 0),
            'materias_reprobadas' => (int) ($mr['reprobadas'] ?? 0),
            'antiguedad' => $this->calcularAntiguedad($user, $alumnoId),
            'periodos_cursados' => count(array_unique(array_column($data['historial']['data'] ?? [], 'periodo'))),
            'avance_global' => (float) ($m['pct_avance'] ?? 0),
            'estado' => ($mr['total'] ?? 0) > 0 ? 'con_trayectoria' : 'sin_trayectoria',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function ultimoPeriodo(User $user, int $alumnoId): array
    {
        $data = $this->alumnoDetalle($user, $alumnoId);
        $historial = $data['historial']['data'] ?? [];
        if ($historial === []) {
            return ['periodo' => '—', 'materias_cursadas' => 0, 'materias_aprobadas' => 0, 'materias_reprobadas' => 0, 'promedio_periodo' => null, 'creditos_periodo' => 0, 'estatus' => 'sin_datos'];
        }
        $porPeriodo = [];
        foreach ($historial as $h) {
            $p = $this->nombrePeriodo((string) ($h['periodo'] ?? ''));
            $porPeriodo[$p][] = $h;
        }
        $ultimo = array_key_last($porPeriodo);
        $items = $porPeriodo[$ultimo] ?? [];
        $ap = count(array_filter($items, fn ($i) => ($i['estatus'] ?? '') === 'Aprobada'));
        $rep = count(array_filter($items, fn ($i) => ($i['estatus'] ?? '') === 'Reprobada'));
        $cals = array_filter(array_map(fn ($i) => is_numeric($i['calificacion'] ?? null) ? (float) $i['calificacion'] : null, $items));

        return [
            'periodo' => $ultimo,
            'materias_cursadas' => count($items),
            'materias_aprobadas' => $ap,
            'materias_reprobadas' => $rep,
            'promedio_periodo' => $cals !== [] ? round(array_sum($cals) / count($cals), 2) : null,
            'creditos_periodo' => array_sum(array_column($items, 'creditos')),
            'estatus' => $rep > 0 ? 'con_observaciones' : ($ap === count($items) ? 'aprobado' : 'en_curso'),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function kardex(User $user, int $alumnoId): array
    {
        $data = $this->alumnoDetalle($user, $alumnoId);
        $agrupado = [];
        foreach ($data['historial']['data'] ?? [] as $h) {
            $p = $this->nombrePeriodo((string) ($h['periodo'] ?? 'Sin periodo'));
            $agrupado[$p]['materias'][] = $h;
        }
        $periodos = [];
        foreach ($agrupado as $nombre => $bloque) {
            $mats = $bloque['materias'];
            $cals = array_filter(array_map(fn ($m) => is_numeric($m['calificacion'] ?? null) ? (float) $m['calificacion'] : null, $mats));
            $periodos[] = [
                'periodo' => $nombre,
                'materias' => $mats,
                'promedio' => $cals !== [] ? round(array_sum($cals) / count($cals), 2) : null,
                'creditos' => array_sum(array_column($mats, 'creditos')),
            ];
        }

        return ['periodos' => $periodos, 'resumen' => $data['metricas']];
    }

    /**
     * @return array<string, mixed>
     */
    public function planEstudios(User $user, int $alumnoId): array
    {
        $data = $this->alumnoDetalle($user, $alumnoId);
        $mr = $data['materias_resumen'] ?? [];

        return [
            'plan' => $data['alumno']['programa'] ?? '—',
            'creditos_totales' => (int) ($data['metricas']['creditos_totales'] ?? 0),
            'materias_totales' => (int) ($mr['total'] ?? 0),
            'avance_creditos' => (float) ($data['metricas']['pct_avance'] ?? 0),
            'avance_materias' => (float) ($mr['pct_aprobadas'] ?? 0),
            'materias_por_periodo' => $this->kardex($user, $alumnoId)['periodos'],
            'materias_pendientes' => (int) ($mr['en_curso'] ?? 0),
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function historialPeriodos(User $user, int $alumnoId): array
    {
        return $this->kardex($user, $alumnoId)['periodos'];
    }

    /**
     * @return array<string, mixed>
     */
    public function estadisticas(User $user, int $alumnoId): array
    {
        $data = $this->alumnoDetalle($user, $alumnoId);
        $mr = $data['materias_resumen'] ?? [];
        $dist = [
            ['rango' => '9.0-10', 'total' => 0],
            ['rango' => '8.0-8.9', 'total' => 0],
            ['rango' => '7.0-7.9', 'total' => 0],
            ['rango' => '6.0-6.9', 'total' => 0],
            ['rango' => 'Menor a 6', 'total' => 0],
        ];
        foreach ($data['historial']['data'] ?? [] as $h) {
            $c = is_numeric($h['calificacion'] ?? null) ? (float) $h['calificacion'] : null;
            if ($c === null) {
                continue;
            }
            $idx = match (true) {
                $c >= 9 => 0,
                $c >= 8 => 1,
                $c >= 7 => 2,
                $c >= 6 => 3,
                default => 4,
            };
            $dist[$idx]['total']++;
        }
        $total = max(1, array_sum(array_column($dist, 'total')));
        foreach ($dist as &$d) {
            $d['porcentaje'] = round(($d['total'] / $total) * 100, 1);
        }

        return [
            'distribucion_calificaciones' => $dist,
            'promedio_por_periodo' => array_map(fn ($p) => ['periodo' => $p['periodo'], 'promedio' => $p['promedio']], $this->kardex($user, $alumnoId)['periodos']),
            'avance_creditos' => $data['avance_curricular'] ?? [],
            'aprobadas_reprobadas' => [
                'aprobadas' => (int) ($mr['aprobadas'] ?? 0),
                'reprobadas' => (int) ($mr['reprobadas'] ?? 0),
                'en_curso' => (int) ($mr['en_curso'] ?? 0),
            ],
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function equivalencias(User $user, int $alumnoId): array
    {
        return [];
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function actividadReciente(User $user, int $alumnoId, int $limit = 8): array
    {
        $data = $this->alumnoDetalle($user, $alumnoId);
        $items = [];
        foreach (($data['alertas'] ?? []) as $a) {
            $items[] = [
                'id' => md5($a['titulo'] ?? uniqid()),
                'tipo' => $a['tipo'] ?? 'info',
                'titulo' => $a['titulo'] ?? 'Actividad',
                'descripcion' => $a['desc'] ?? '',
                'tiempo_relativo' => 'Reciente',
                'severidad' => $a['tipo'] === 'warning' ? 'warning' : 'info',
            ];
        }

        return array_slice($items, 0, $limit);
    }

    public function exportarCsv(User $user, int $alumnoId): StreamedResponse
    {
        $data = $this->alumnoDetalle($user, $alumnoId);
        $this->registrarAuditoria($user, 'trayectoria.exportar', $alumnoId);

        return response()->streamDownload(function () use ($data): void {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['clave', 'materia', 'periodo', 'calificacion', 'creditos', 'estatus']);
            foreach ($data['historial']['data'] ?? [] as $h) {
                fputcsv($out, [$h['clave'], $h['nombre'], $h['periodo'], $h['calificacion'], $h['creditos'], $h['estatus']]);
            }
            fclose($out);
        }, 'trayectoria_'.$alumnoId.'_'.now()->format('Y-m-d').'.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    public function constanciaPdf(User $user, int $alumnoId, ?string $tipo = null): \Symfony\Component\HttpFoundation\Response
    {
        $data = $this->alumnoDetalle($user, $alumnoId);
        $this->registrarAuditoria($user, 'trayectoria.constancia', $alumnoId, ['tipo' => $tipo]);
        $html = '<html><body style="font-family:DejaVu Sans;padding:24px"><h1>Constancia académica</h1>'
            .'<p><strong>Alumno:</strong> '.e($data['alumno']['nombre'] ?? '').'</p>'
            .'<p><strong>Matrícula:</strong> '.e($data['alumno']['matricula'] ?? '').'</p>'
            .'<p><strong>Programa:</strong> '.e($data['alumno']['programa'] ?? '').'</p>'
            .'<p>Generado: '.now()->format('d/m/Y H:i').'</p></body></html>';

        return Pdf::loadHTML($html)->download('constancia_'.$alumnoId.'.pdf');
    }

    public function kardexPdf(User $user, int $alumnoId): \Symfony\Component\HttpFoundation\Response
    {
        $k = $this->kardex($user, $alumnoId);
        $this->registrarAuditoria($user, 'trayectoria.kardex_pdf', $alumnoId);
        $rows = '';
        foreach ($k['periodos'] as $p) {
            $rows .= '<tr><td colspan="4"><strong>'.e($p['periodo']).'</strong></td></tr>';
            foreach ($p['materias'] as $m) {
                $rows .= '<tr><td>'.e($m['clave']).'</td><td>'.e($m['nombre']).'</td><td>'.e($m['calificacion']).'</td><td>'.e($m['creditos']).'</td></tr>';
            }
        }
        $html = '<html><body style="font-family:DejaVu Sans;padding:24px;font-size:11px"><h1>Kardex académico</h1><table border="1" cellpadding="4" width="100%"><tr><th>Clave</th><th>Materia</th><th>Calif.</th><th>Créd.</th></tr>'.$rows.'</table></body></html>';

        return Pdf::loadHTML($html)->download('kardex_'.$alumnoId.'.pdf');
    }

    protected function calcularAntiguedad(User $user, int $alumnoId): string
    {
        $alumno = $this->queryAlumnosTrayectoria($user, null)->where('id', $alumnoId)->first();
        if ($alumno === null) {
            return '—';
        }
        $mat = $alumno->matriculaActiva;
        $desde = MateriaCursada::query()->where('matricula_id', $mat?->id)->min('created_at')
            ?? $mat?->created_at
            ?? $alumno->created_at;
        if ($desde === null) {
            return '—';
        }
        $diff = Carbon::parse($desde)->diff(now());
        $parts = [];
        if ($diff->y > 0) {
            $parts[] = $diff->y.' año'.($diff->y !== 1 ? 's' : '');
        }
        if ($diff->m > 0) {
            $parts[] = $diff->m.' mes'.($diff->m !== 1 ? 'es' : '');
        }

        return $parts !== [] ? implode(', ', $parts) : 'Menos de un mes';
    }

    protected function registrarAuditoria(User $user, string $evento, int $alumnoId, array $meta = []): void
    {
        $this->auditoria->registrar(
            $evento,
            'alumno',
            $alumnoId,
            $meta,
            $user->id,
            request()->ip(),
            (string) request()->userAgent(),
            ['modulo' => 'control_escolar_trayectoria'],
        );
    }
}
