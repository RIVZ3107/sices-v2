<?php

declare(strict_types=1);

namespace App\Services\ControlEscolar;

use App\Models\Alumno;
use App\Models\CicloEscolar;
use App\Models\InscripcionPeriodo;
use App\Models\MateriaCursada;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class ControlEscolarCalificacionesService
{
    private const ESTADOS_MATRICULA_ACTIVA = ['activa', 'vigente'];

    private const ESTATUS_INSCRIPCION_ACTIVA = ['activa', 'inscrita', 'cursando'];

    public function __construct(
        protected ControlEscolarDashboardService $dashboard,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function gestion(User $user, ?string $search, int $page, int $perPage): array
    {
        return app(ControlEscolarCalificacionOperativoService::class)->gestionLegacy($user, $search, $page, $perPage);
    }

    /**
     * @deprecated Usar ControlEscolarCalificacionOperativoService
     */
    protected function gestionLegacyInterno(User $user, ?string $search, int $page, int $perPage): array
    {
        $perPage = max(1, min(50, $perPage));
        $page = max(1, $page);
        $term = trim((string) $search);

        return $this->dashboard->conAlcanceUsuario($user, function () use ($user, $term, $page, $perPage): array {
            $metricas = $this->metricas($user);
            $query = $this->queryListado($user, $term !== '' ? $term : null);
            $paginator = $query->paginate($perPage, ['*'], 'page', $page);

            return [
                'actualizado_en' => now()->toIso8601String(),
                'metricas' => $metricas,
                'avance_global' => [
                    'porcentaje' => $metricas['avance_global_pct'],
                    'descripcion' => $metricas['avance_global_pct'] > 0
                        ? "{$metricas['avance_global_pct']}% de las calificaciones han sido capturadas en el alcance operativo."
                        : 'Sin registros de captura en tu alcance.',
                ],
                'grupos' => $this->gruposAvance($user),
                'listado' => [
                    'data' => collect($paginator->items())
                        ->map(fn (MateriaCursada $m) => $this->filaListado($m))
                        ->values()
                        ->all(),
                    'meta' => [
                        'current_page' => $paginator->currentPage(),
                        'last_page' => $paginator->lastPage(),
                        'per_page' => $paginator->perPage(),
                        'total' => $paginator->total(),
                        'from' => $paginator->firstItem(),
                        'to' => $paginator->lastItem(),
                    ],
                ],
            ];
        });
    }

    /**
     * @return array{
     *   grupos_en_captura: int,
     *   avance_global_pct: int,
     *   pendientes_captura: int,
     *   correcciones_solicitadas: int,
     *   ciclo_label: string
     * }
     */
    protected function metricas(User $user): array
    {
        $row = $this->queryListado($user, null)
            ->selectRaw(
                'COUNT(*) as total, '
                .'SUM(CASE WHEN calificacion IS NOT NULL THEN 1 ELSE 0 END) as capturadas, '
                ."SUM(CASE WHEN LOWER(COALESCE(estatus_acreditacion, '')) LIKE '%revision%' "
                ."OR LOWER(COALESCE(estatus_acreditacion, '')) LIKE '%correccion%' "
                ."OR LOWER(COALESCE(estatus_acreditacion, '')) LIKE '%corrección%' THEN 1 ELSE 0 END) as correcciones"
            )
            ->first();

        $total = (int) ($row?->total ?? 0);
        $capturadas = (int) ($row?->capturadas ?? 0);
        $correcciones = (int) ($row?->correcciones ?? 0);
        $pendientes = max(0, $total - $capturadas);
        $pct = $total > 0 ? (int) round(($capturadas / $total) * 100) : 0;

        return [
            'grupos_en_captura' => $this->queryGruposBase($user)->count(),
            'avance_global_pct' => $pct,
            'pendientes_captura' => $pendientes,
            'correcciones_solicitadas' => $correcciones,
            'ciclo_label' => $this->etiquetaCicloActivo(),
        ];
    }

    /**
     * @return list<array{grupo: string, sede: string, avance_pct: int, pendientes: int}>
     */
    protected function gruposAvance(User $user): array
    {
        $filas = [];

        $this->queryGruposBase($user)
            ->with([
                'grupo',
                'matricula.ofertaAcademica.sede',
                'matricula.ofertaAcademica.planEstudio.programaEstudio',
                'cargasAcademicas.materiasCursadas',
            ])
            ->orderByDesc('id')
            ->limit(12)
            ->get()
            ->each(function (InscripcionPeriodo $ins) use (&$filas): void {
                /** @var Collection<int, MateriaCursada> $materias */
                $materias = $ins->cargasAcademicas
                    ->flatMap(fn ($carga) => $carga->materiasCursadas);

                $total = $materias->count();
                if ($total === 0) {
                    return;
                }

                $capturadas = $materias->filter(fn (MateriaCursada $m) => $m->calificacion !== null)->count();
                $pendientes = max(0, $total - $capturadas);
                $oferta = $ins->matricula?->ofertaAcademica;

                $filas[] = [
                    'grupo' => $this->etiquetaGrupo($ins),
                    'sede' => (string) ($oferta?->sede?->nombre ?? '—'),
                    'avance_pct' => (int) round(($capturadas / $total) * 100),
                    'pendientes' => $pendientes,
                ];
            });

        usort($filas, static fn (array $a, array $b): int => $b['pendientes'] <=> $a['pendientes']);

        return array_values($filas);
    }

    /**
     * @return Builder<MateriaCursada>
     */
    protected function queryListado(User $user, ?string $search): Builder
    {
        $query = MateriaCursada::query()
            ->with([
                'alumno',
                'matricula',
                'cargaAcademica.inscripcionPeriodo.grupo',
            ])
            ->whereHas('alumno', fn (Builder $q) => $q->whereIn('id', $this->dashboard->queryAlumnosEnAlcance($user)->select('id')))
            ->whereHas('matricula', fn (Builder $m) => $m->whereIn('estado', self::ESTADOS_MATRICULA_ACTIVA))
            ->whereHas('inscripcionPeriodo', fn (Builder $ins) => $ins->whereIn('estatus', self::ESTATUS_INSCRIPCION_ACTIVA))
            ->orderByDesc('updated_at')
            ->orderByDesc('id');

        $term = trim((string) $search);
        if ($term !== '') {
            $like = '%'.$term.'%';
            $query->where(function (Builder $q) use ($like): void {
                $q->where('nombre', 'like', $like)
                    ->orWhere('clave', 'like', $like)
                    ->orWhereHas('alumno', function (Builder $a) use ($like): void {
                        $a->where('nombre', 'like', $like)
                            ->orWhere('primer_apellido', 'like', $like)
                            ->orWhere('segundo_apellido', 'like', $like)
                            ->orWhere('curp', 'like', $like);
                    })
                    ->orWhereHas('matricula', fn (Builder $m) => $m->where('matricula', 'like', $like));
            });
        }

        return $query;
    }

    /**
     * @return Builder<InscripcionPeriodo>
     */
    protected function queryGruposBase(User $user): Builder
    {
        return InscripcionPeriodo::query()
            ->whereIn('estatus', self::ESTATUS_INSCRIPCION_ACTIVA)
            ->whereHas('cargasAcademicas')
            ->whereHas('matricula', function (Builder $mat) use ($user): void {
                $mat->whereIn('estado', self::ESTADOS_MATRICULA_ACTIVA)
                    ->whereHas('alumno', fn (Builder $alumno) => $alumno->whereIn(
                        'id',
                        $this->dashboard->queryAlumnosEnAlcance($user)->select('id')
                    ));
            });
    }

    /**
     * @return array{alumno: string, matricula: string, materia: string, calif: string, estatus: string}
     */
    protected function filaListado(MateriaCursada $m): array
    {
        $alumno = $m->alumno;

        return [
            'alumno' => $alumno !== null ? $this->nombreCompleto($alumno) : '—',
            'matricula' => (string) ($m->matricula?->matricula ?? '—'),
            'materia' => (string) ($m->nombre ?? $m->clave ?? '—'),
            'calif' => $this->formatCalificacion($m),
            'estatus' => $this->estatusVisual($m),
        ];
    }

    protected function estatusVisual(MateriaCursada $m): string
    {
        if ($this->esCorreccion($m)) {
            return 'En corrección';
        }

        if ($m->calificacion === null && ($m->calificacion_final === null || $m->calificacion_final === '')) {
            return 'Pendiente';
        }

        return 'Capturada';
    }

    protected function esCorreccion(MateriaCursada $m): bool
    {
        $estatus = strtolower((string) ($m->estatus_acreditacion ?? ''));

        return str_contains($estatus, 'revision')
            || str_contains($estatus, 'correccion')
            || str_contains($estatus, 'corrección');
    }

    protected function formatCalificacion(MateriaCursada $m): string
    {
        $valor = $m->calificacion ?? $m->calificacion_final;
        if ($valor === null || $valor === '') {
            if ($m->calificacion_texto !== null && trim((string) $m->calificacion_texto) !== '') {
                return trim((string) $m->calificacion_texto);
            }

            return '—';
        }

        return rtrim(rtrim(number_format((float) $valor, 2, '.', ''), '0'), '.');
    }

    protected function etiquetaGrupo(InscripcionPeriodo $ins): string
    {
        if ($ins->grupo !== null) {
            $clave = trim((string) ($ins->grupo->clave ?? ''));
            $nombre = trim((string) ($ins->grupo->nombre ?? ''));

            return $clave !== '' ? $clave : ($nombre !== '' ? $nombre : 'Grupo');
        }

        $programa = $ins->matricula?->ofertaAcademica?->planEstudio?->programaEstudio?->nombre;
        $semestre = $ins->semestre ?? $ins->numero_periodo_curricular;
        $partes = array_filter([
            $programa !== null ? trim((string) $programa) : null,
            $semestre !== null ? ((int) $semestre).'°' : null,
        ]);

        return $partes !== [] ? implode(' — ', $partes) : 'Sin grupo';
    }

    protected function etiquetaCicloActivo(): string
    {
        $ciclo = CicloEscolar::query()
            ->where('activo', true)
            ->orderByDesc('id')
            ->first();

        if ($ciclo === null) {
            return 'Ciclo activo';
        }

        $clave = trim((string) ($ciclo->clave ?? ''));
        $nombre = trim((string) ($ciclo->nombre ?? ''));

        return $clave !== '' ? $clave : ($nombre !== '' ? $nombre : 'Ciclo activo');
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
