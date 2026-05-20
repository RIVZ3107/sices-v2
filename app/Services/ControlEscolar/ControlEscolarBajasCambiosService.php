<?php

declare(strict_types=1);

namespace App\Services\ControlEscolar;

use App\Models\Alumno;
use App\Models\AuditoriaEvento;
use App\Models\InscripcionPeriodo;
use App\Models\Matricula;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class ControlEscolarBajasCambiosService
{
    private const LIMITE_FILAS = 250;

    private const ESTADOS_MATRICULA_ACTIVA = ['activa', 'vigente'];

    /** @var list<string> */
    private const ESTATUS_ALUMNO_BAJA = ['baja_temporal', 'baja_definitiva', 'inactivo'];

    /** @var list<string> */
    private const ESTADOS_MATRICULA_BAJA = ['baja', 'suspendida', 'cancelada', 'baja_temporal', 'baja_definitiva'];

    /** @var list<string> */
    private const ESTATUS_INSCRIPCION_BAJA = ['baja', 'cancelada'];

    public function __construct(
        protected ControlEscolarDashboardService $dashboard,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function gestion(User $user, ?string $search, ?string $estatusFiltro, int $page, int $perPage): array
    {
        $perPage = max(1, min(50, $perPage));
        $page = max(1, $page);

        return $this->dashboard->conAlcanceUsuario($user, function () use ($user, $search, $estatusFiltro, $page, $perPage): array {
            $filas = $this->recolectarFilas($user, $search, $estatusFiltro);
            $metricas = $this->metricasDesdeFilas($filas);
            $total = $filas->count();
            $slice = $filas->forPage($page, $perPage)->values();

            return [
                'actualizado_en' => now()->toIso8601String(),
                'metricas' => $metricas,
                'listado' => [
                    'data' => $slice->all(),
                    'meta' => [
                        'current_page' => $page,
                        'last_page' => max(1, (int) ceil($total / $perPage)),
                        'per_page' => $perPage,
                        'total' => $total,
                        'from' => $total === 0 ? null : (($page - 1) * $perPage) + 1,
                        'to' => $total === 0 ? null : min($page * $perPage, $total),
                    ],
                ],
                'motivos_frecuentes' => $this->motivosFrecuentes($filas),
                'cambios_recientes' => $this->cambiosRecientes($user, $filas),
            ];
        });
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    protected function recolectarFilas(User $user, ?string $search, ?string $estatusFiltro): Collection
    {
        $filas = collect();
        $vistos = [];

        foreach ($this->queryMatriculasBaja($user, $search)
            ->with(['alumno'])
            ->orderByDesc('updated_at')
            ->limit(self::LIMITE_FILAS)
            ->get() as $mat) {
            $key = 'mat-'.$mat->id;
            if (isset($vistos[$key])) {
                continue;
            }
            $vistos[$key] = true;
            $filas->push($this->filaDesdeMatricula($mat));
        }

        foreach ($this->queryInscripcionesBaja($user, $search)
            ->with(['matricula.alumno', 'grupo'])
            ->orderByDesc('updated_at')
            ->limit(self::LIMITE_FILAS)
            ->get() as $ins) {
            $key = 'ins-'.$ins->id;
            if (isset($vistos[$key])) {
                continue;
            }
            $vistos[$key] = true;
            $filas->push($this->filaDesdeInscripcion($ins));
        }

        $filas = $filas->sortByDesc(fn (array $f) => $f['orden_at'] ?? '')->values();

        $filtro = trim((string) $estatusFiltro);
        if ($filtro !== '' && strtolower($filtro) !== 'todos' && strtolower($filtro) !== 'todos los estatus') {
            $filtroNorm = strtolower($filtro);
            $filas = $filas->filter(
                fn (array $f) => strtolower((string) ($f['estatus'] ?? '')) === $filtroNorm
            )->values();
        }

        return $filas;
    }

    /**
     * @return Builder<Matricula>
     */
    protected function queryMatriculasBaja(User $user, ?string $search): Builder
    {
        $query = Matricula::query()
            ->whereHas('alumno', fn (Builder $a) => $a->whereIn(
                'id',
                $this->dashboard->queryAlumnosEnAlcance($user)->select('id')
            ))
            ->where(function (Builder $q): void {
                $q->whereNotIn('estado', self::ESTADOS_MATRICULA_ACTIVA)
                    ->orWhereHas('alumno', fn (Builder $a) => $a->whereIn('estatus', self::ESTATUS_ALUMNO_BAJA));
            });

        $this->aplicarBusquedaMatricula($query, $search);

        return $query;
    }

    /**
     * @return Builder<InscripcionPeriodo>
     */
    protected function queryInscripcionesBaja(User $user, ?string $search): Builder
    {
        $query = InscripcionPeriodo::query()
            ->whereIn('estatus', self::ESTATUS_INSCRIPCION_BAJA)
            ->whereHas('matricula', function (Builder $mat) use ($user): void {
                $mat->whereHas('alumno', fn (Builder $a) => $a->whereIn(
                    'id',
                    $this->dashboard->queryAlumnosEnAlcance($user)->select('id')
                ));
            });

        $term = trim((string) $search);
        if ($term !== '') {
            $like = '%'.$term.'%';
            $query->where(function (Builder $q) use ($like): void {
                $q->whereHas('matricula', fn (Builder $m) => $m->where('matricula', 'like', $like))
                    ->orWhereHas('matricula.alumno', function (Builder $a) use ($like): void {
                        $a->where('nombre', 'like', $like)
                            ->orWhere('primer_apellido', 'like', $like)
                            ->orWhere('segundo_apellido', 'like', $like)
                            ->orWhere('curp', 'like', $like);
                    });
            });
        }

        return $query;
    }

    protected function aplicarBusquedaMatricula(Builder $query, ?string $search): void
    {
        $term = trim((string) $search);
        if ($term === '') {
            return;
        }

        $like = '%'.$term.'%';
        $query->where(function (Builder $q) use ($like): void {
            $q->where('matricula', 'like', $like)
                ->orWhereHas('alumno', function (Builder $a) use ($like): void {
                    $a->where('nombre', 'like', $like)
                        ->orWhere('primer_apellido', 'like', $like)
                        ->orWhere('segundo_apellido', 'like', $like)
                        ->orWhere('curp', 'like', $like);
                });
        });
    }

    /**
     * @return array<string, mixed>
     */
    protected function filaDesdeMatricula(Matricula $mat): array
    {
        $alumno = $mat->alumno;
        $meta = array_merge(
            (array) ($alumno?->metadata ?? []),
            (array) ($mat->metadata ?? []),
        );
        $tipo = $this->resolverTipo($meta, (string) $mat->estado, (string) ($alumno?->estatus ?? ''));
        $estatus = $this->resolverEstatus($meta, (string) $mat->estado, (string) ($alumno?->estatus ?? ''));
        $dt = $mat->updated_at ?? $mat->created_at ?? now();

        return $this->armarFila(
            id: 'mat-'.$mat->id,
            alumno: $alumno,
            matricula: (string) $mat->matricula,
            tipo: $tipo,
            motivo: $this->resolverMotivo($meta, $tipo),
            fecha: $dt,
            estatus: $estatus,
            detalle_url: $alumno !== null ? '/app/alumnos/'.$alumno->id.'/expediente' : '#',
        );
    }

    /**
     * @return array<string, mixed>
     */
    protected function filaDesdeInscripcion(InscripcionPeriodo $ins): array
    {
        $mat = $ins->matricula;
        $alumno = $mat?->alumno;
        $meta = array_merge(
            (array) ($alumno?->metadata ?? []),
            (array) ($mat?->metadata ?? []),
            (array) ($ins->metadata ?? []),
        );
        $tipo = $this->resolverTipoInscripcion($meta, $ins);
        $estatus = $this->resolverEstatusInscripcion($meta, (string) $ins->estatus);
        $dt = $ins->updated_at ?? $ins->created_at ?? now();

        return $this->armarFila(
            id: 'ins-'.$ins->id,
            alumno: $alumno,
            matricula: (string) ($mat?->matricula ?? '—'),
            tipo: $tipo,
            motivo: $this->resolverMotivo($meta, $tipo),
            fecha: $dt,
            estatus: $estatus,
            detalle_url: $alumno !== null ? '/app/alumnos/'.$alumno->id.'/expediente' : '#',
        );
    }

    /**
     * @param  array<string, mixed>  $meta
     * @return array<string, mixed>
     */
    protected function armarFila(
        string $id,
        ?Alumno $alumno,
        string $matricula,
        string $tipo,
        string $motivo,
        mixed $fecha,
        string $estatus,
        string $detalle_url,
    ): array {
        $carbon = $fecha instanceof Carbon ? $fecha : Carbon::parse($fecha);
        $visual = $this->estatusVisual($estatus);

        return [
            'id' => $id,
            'alumno' => $this->nombreAlumno($alumno),
            'matricula' => $matricula,
            'tipo' => $tipo,
            'motivo' => $motivo,
            'fecha' => $carbon->timezone(config('app.timezone'))->format('d/m/Y'),
            'hora' => $carbon->timezone(config('app.timezone'))->format('h:i a'),
            'estatus' => $visual['label'],
            'tone' => $visual['tone'],
            'type_key' => $this->typeKey($tipo),
            'type_color' => $this->typeColor($tipo),
            'detalle_url' => $detalle_url,
            'orden_at' => $carbon->toIso8601String(),
        ];
    }

    /**
     * @param  array<string, mixed>  $meta
     */
    protected function resolverTipo(array $meta, string $estadoMatricula, string $estatusAlumno): string
    {
        $explicito = trim((string) ($meta['tipo_cambio'] ?? $meta['tipo_tramite'] ?? $meta['tramite'] ?? ''));
        if ($explicito !== '') {
            return ucfirst(str_replace('_', ' ', $explicito));
        }

        if ($estatusAlumno === 'baja_temporal' || $estadoMatricula === 'baja_temporal') {
            return 'Baja temporal';
        }

        if ($estatusAlumno === 'baja_definitiva' || in_array($estadoMatricula, ['baja', 'cancelada', 'baja_definitiva'], true)) {
            return 'Baja definitiva';
        }

        if ($estadoMatricula === 'suspendida') {
            return 'Cambio de turno';
        }

        return 'Baja temporal';
    }

    /**
     * @param  array<string, mixed>  $meta
     */
    protected function resolverTipoInscripcion(array $meta, InscripcionPeriodo $ins): string
    {
        $explicito = trim((string) ($meta['tipo_cambio'] ?? $meta['tipo_tramite'] ?? ''));
        if ($explicito !== '') {
            return ucfirst(str_replace('_', ' ', $explicito));
        }

        if ($ins->grupo_id !== null) {
            return 'Cambio de grupo';
        }

        return 'Cambio de programa';
    }

    /**
     * @param  array<string, mixed>  $meta
     */
    protected function resolverMotivo(array $meta, string $tipo): string
    {
        $motivo = trim((string) ($meta['motivo'] ?? $meta['motivo_baja'] ?? $meta['motivo_cambio'] ?? ''));
        if ($motivo !== '') {
            return $motivo;
        }

        return match (true) {
            str_contains(strtolower($tipo), 'salud') => 'Problemas de salud',
            str_contains(strtolower($tipo), 'baja temporal') => 'Suspensión temporal de estudios',
            str_contains(strtolower($tipo), 'baja definitiva') => 'Baja definitiva de estudios',
            str_contains(strtolower($tipo), 'grupo') => 'Reorganización académica',
            str_contains(strtolower($tipo), 'turno') => 'Compatibilidad de horarios',
            str_contains(strtolower($tipo), 'programa') => 'Cambio de área de estudio',
            default => 'Trámite registrado en el sistema',
        };
    }

    /**
     * @param  array<string, mixed>  $meta
     */
    protected function resolverEstatus(array $meta, string $estadoMatricula, string $estatusAlumno): string
    {
        $explicito = trim((string) ($meta['estatus_tramite'] ?? $meta['estatus_solicitud'] ?? ''));
        if ($explicito !== '') {
            return $explicito;
        }

        return match (true) {
            $estadoMatricula === 'suspendida' => 'En revisión',
            in_array($estatusAlumno, ['baja_temporal', 'baja_definitiva'], true)
                && in_array($estadoMatricula, ['baja', 'cancelada', 'baja_temporal', 'baja_definitiva'], true) => 'Aprobada',
            $estadoMatricula === 'baja' => 'Pendiente',
            default => 'En revisión',
        };
    }

    /**
     * @param  array<string, mixed>  $meta
     */
    protected function resolverEstatusInscripcion(array $meta, string $estatusIns): string
    {
        $explicito = trim((string) ($meta['estatus_tramite'] ?? ''));
        if ($explicito !== '') {
            return $explicito;
        }

        return match ($estatusIns) {
            'cancelada' => 'Rechazada',
            'baja' => 'Observada',
            default => 'En revisión',
        };
    }

    /**
     * @return array{label: string, tone: string}
     */
    protected function estatusVisual(string $estatus): array
    {
        $v = strtolower(trim($estatus));

        return match ($v) {
            'aprobada', 'aprobado', 'concluida', 'concluido' => ['label' => 'Aprobada', 'tone' => 'green'],
            'rechazada', 'rechazado', 'cancelada', 'cancelado' => ['label' => 'Rechazada', 'tone' => 'red'],
            'observada', 'observado' => ['label' => 'Observada', 'tone' => 'red'],
            'pendiente' => ['label' => 'Pendiente', 'tone' => 'green'],
            default => ['label' => 'En revisión', 'tone' => 'blue'],
        };
    }

    protected function typeKey(string $tipo): string
    {
        $t = strtolower($tipo);

        return match (true) {
            str_contains($t, 'baja temporal') => 'lock',
            str_contains($t, 'baja definitiva') => 'boxX',
            str_contains($t, 'grupo') => 'users',
            str_contains($t, 'turno') => 'clock',
            str_contains($t, 'programa') => 'graduationCap',
            default => 'lock',
        };
    }

    protected function typeColor(string $tipo): string
    {
        $t = strtolower($tipo);

        return match (true) {
            str_contains($t, 'baja temporal') => '#DC2626',
            str_contains($t, 'baja definitiva') => '#6B21A8',
            str_contains($t, 'grupo') => '#185FA5',
            str_contains($t, 'turno') => '#0F6E56',
            str_contains($t, 'programa') => '#534AB7',
            default => '#64748b',
        };
    }

    /**
     * @param  Collection<int, array<string, mixed>>  $filas
     * @return array{
     *   bajas_temporales: int,
     *   bajas_definitivas: int,
     *   cambios_pendientes: int,
     *   solicitudes_observadas: int
     * }
     */
    protected function metricasDesdeFilas(Collection $filas): array
    {
        $temporales = 0;
        $definitivas = 0;
        $pendientes = 0;
        $observadas = 0;

        foreach ($filas as $f) {
            $tipo = strtolower((string) ($f['tipo'] ?? ''));
            $estatus = strtolower((string) ($f['estatus'] ?? ''));

            if (str_contains($tipo, 'baja temporal')) {
                $temporales++;
            }
            if (str_contains($tipo, 'baja definitiva')) {
                $definitivas++;
            }
            if (in_array($estatus, ['pendiente', 'en revisión'], true)) {
                $pendientes++;
            }
            if ($estatus === 'observada') {
                $observadas++;
            }
        }

        return [
            'bajas_temporales' => $temporales,
            'bajas_definitivas' => $definitivas,
            'cambios_pendientes' => $pendientes,
            'solicitudes_observadas' => $observadas,
        ];
    }

    /**
     * @param  Collection<int, array<string, mixed>>  $filas
     * @return list<array{label: string, pct: int, count: int, color: string}>
     */
    protected function motivosFrecuentes(Collection $filas): array
    {
        $colores = ['#185FA5', '#0F6E56', '#EA580C', '#6B21A8', '#EAB308', '#64748b'];
        $conteo = $filas
            ->groupBy(fn (array $f) => trim((string) ($f['motivo'] ?? 'Sin motivo')))
            ->map->count()
            ->sortDesc()
            ->take(6);

        $total = max(1, $conteo->sum());
        $i = 0;

        return $conteo->map(function (int $count, string $label) use ($total, $colores, &$i): array {
            return [
                'label' => $label,
                'count' => $count,
                'pct' => (int) round(($count / $total) * 100),
                'color' => $colores[$i++ % count($colores)],
            ];
        })->values()->all();
    }

    /**
     * @return list<array{text: string, subtext: string, date: string, color: string}>
     */
    /**
     * @param  Collection<int, array<string, mixed>>  $filasRecolectadas
     * @return list<array{text: string, subtext: string, date: string, color: string}>
     */
    protected function cambiosRecientes(User $user, Collection $filasRecolectadas): array
    {
        $eventos = AuditoriaEvento::query()
            ->where('evento', 'matricula.actualizada')
            ->where('entidad_tipo', Matricula::class)
            ->whereIn('entidad_id', Matricula::query()
                ->select('id')
                ->whereIn('alumno_id', $this->dashboard->queryAlumnosEnAlcance($user)->select('id')))
            ->latest('created_at')
            ->limit(8)
            ->get();

        $items = [];

        foreach ($eventos as $evento) {
            $cambios = (array) (($evento->payload ?? [])['cambios'] ?? []);
            if (! array_key_exists('estado', $cambios)) {
                continue;
            }

            $mat = Matricula::query()->with('alumno')->find($evento->entidad_id);
            if ($mat === null || $mat->alumno === null) {
                continue;
            }

            $nuevo = (string) ($cambios['estado'] ?? '');
            $tipo = $this->resolverTipo([], $nuevo, (string) $mat->alumno->estatus);
            $dt = $evento->created_at ?? now();
            $carbon = $dt instanceof Carbon ? $dt : Carbon::parse($dt);

            $items[] = [
                'text' => $tipo.' registrado',
                'subtext' => $this->nombreAlumno($mat->alumno).' ('.$mat->matricula.')',
                'date' => $carbon->timezone(config('app.timezone'))->format('d/m/Y h:i a'),
                'color' => $this->typeColor($tipo),
            ];

            if (count($items) >= 5) {
                break;
            }
        }

        if ($items !== []) {
            return $items;
        }

        return $filasRecolectadas
            ->take(5)
            ->map(fn (array $f) => [
                'text' => ((string) ($f['tipo'] ?? 'Trámite')).' — '.((string) ($f['estatus'] ?? '')),
                'subtext' => ((string) ($f['alumno'] ?? '')).' ('.((string) ($f['matricula'] ?? '')).')',
                'date' => trim(((string) ($f['fecha'] ?? '')).' '.((string) ($f['hora'] ?? ''))),
                'color' => (string) ($f['type_color'] ?? '#185FA5'),
            ])
            ->all();
    }

    protected function nombreAlumno(?Alumno $alumno): string
    {
        if ($alumno === null) {
            return '—';
        }

        return trim(implode(' ', array_filter([
            $alumno->nombre,
            $alumno->primer_apellido,
            $alumno->segundo_apellido,
        ]))) ?: '—';
    }
}
