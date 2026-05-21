<?php

declare(strict_types=1);

namespace App\Services\ControlEscolar;

use App\Models\Alumno;
use App\Models\CicloEscolar;
use App\Models\DocumentoAcademico;
use App\Models\DocumentoObservacion;
use App\Models\ImportacionHistoricaMaterias;
use App\Models\InscripcionPeriodo;
use App\Models\Matricula;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;

class ControlEscolarReportesService
{
    private const ESTADOS_MATRICULA_ACTIVA = ['activa', 'vigente'];

    private const ESTATUS_INSCRIPCION_ACTIVA = ['activa', 'inscrita', 'cursando'];

    /** @var list<string> */
    private const COLORES_PROGRAMA = ['#185FA5', '#0F6E56', '#BA7517', '#534AB7', '#C2410C', '#64748b'];

    public function __construct(
        protected ControlEscolarDashboardService $dashboard,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function indicadores(User $user): array
    {
        return $this->dashboard->conAlcanceUsuario($user, function () use ($user): array {
            $alumnosIds = $this->dashboard->queryAlumnosEnAlcance($user)->select('id');
            $matriculaTotal = $this->matriculasActivasQuery($alumnosIds)->count();
            $expedientes = $this->expedientesResumen($user);
            $reinscripciones = $this->reinscripcionesResumen($alumnosIds);
            $inscripciones = $this->inscripcionesResumen($alumnosIds);
            $pendientes = $this->pendientesOperativos($user);
            $matriculaPrograma = $this->matriculaPorPrograma($alumnosIds, $matriculaTotal);
            $tramitesMes = $this->tramitesPorMes($alumnosIds);

            $tasaReinscripcion = $matriculaTotal > 0
                ? round(($reinscripciones['completadas'] / $matriculaTotal) * 100, 1)
                : 0.0;
            $pctExpedientesCompletos = $matriculaTotal > 0
                ? round(($expedientes['completos'] / $matriculaTotal) * 100, 1)
                : 0.0;

            return [
                'actualizado_en' => now()->toIso8601String(),
                'ciclo_label' => $this->cicloActivoLabel(),
                'metricas' => [
                    'matricula_total' => $matriculaTotal,
                    'matricula_total_trend' => 'Alcance territorial actual',
                    'matricula_total_trend_up' => true,
                    'reinscripciones' => $reinscripciones['completadas'],
                    'reinscripciones_trend' => $reinscripciones['en_proceso'].' en proceso',
                    'reinscripciones_trend_up' => true,
                    'nuevas_inscripciones' => $inscripciones['total'],
                    'nuevas_inscripciones_trend' => $inscripciones['confirmadas'].' confirmadas',
                    'nuevas_inscripciones_trend_up' => true,
                    'expedientes_completos' => $expedientes['completos'],
                    'expedientes_completos_trend' => $pctExpedientesCompletos.'% del total',
                    'expedientes_completos_trend_up' => true,
                    'reinscripciones_bloqueadas' => $reinscripciones['bloqueadas'],
                    'reinscripciones_bloqueadas_trend' => 'Requieren atención',
                    'reinscripciones_bloqueadas_trend_up' => false,
                    'pendientes' => $pendientes,
                    'pendientes_trend' => 'Operativos por atender',
                    'pendientes_trend_up' => false,
                ],
                'matricula_por_programa' => $matriculaPrograma,
                'expedientes_por_estatus' => $expedientes['segmentos'],
                'tramites_por_mes' => $tramitesMes,
                'indicadores_clave' => [
                    [
                        'label' => 'Tasa de reinscripción',
                        'value' => $tasaReinscripcion.'%',
                        'width' => min(100, $tasaReinscripcion).'%',
                        'bar_color' => '#534AB7',
                        'delta' => $reinscripciones['completadas'].' completadas',
                        'delta_up' => true,
                    ],
                    [
                        'label' => 'Expedientes completos',
                        'value' => $pctExpedientesCompletos.'%',
                        'width' => min(100, $pctExpedientesCompletos).'%',
                        'bar_color' => '#0F6E56',
                        'delta' => (string) $expedientes['completos'].' alumnos',
                        'delta_up' => true,
                    ],
                    [
                        'label' => 'Pendientes por atender',
                        'value' => (string) $pendientes,
                        'width' => min(100, max(8, $pendientes > 0 ? round(($pendientes / max(1, $matriculaTotal)) * 100) : 0)).'%',
                        'bar_color' => '#BA7517',
                        'delta' => 'Suma operativa',
                        'delta_up' => false,
                    ],
                    [
                        'label' => 'Reinscripciones bloqueadas',
                        'value' => (string) $reinscripciones['bloqueadas'],
                        'width' => min(100, max(8, $reinscripciones['bloqueadas'] > 0 ? round(($reinscripciones['bloqueadas'] / max(1, $matriculaTotal)) * 100) : 0)).'%',
                        'bar_color' => '#991B1B',
                        'delta' => 'Con observaciones o rechazo',
                        'delta_up' => false,
                    ],
                ],
                'reportes_frecuentes' => $this->reportesFrecuentes($user),
                'acciones_rapidas' => [
                    ['label' => 'Reporte de matrícula', 'to' => '/app/control-escolar/alumnos', 'icon' => 'users', 'color' => '#185FA5'],
                    ['label' => 'Reporte de reinscripciones', 'to' => '/app/control-escolar/reinscripciones', 'icon' => 'refreshCw', 'color' => '#0F6E56'],
                    ['label' => 'Pendientes', 'to' => '/app/control-escolar/solicitudes', 'icon' => 'alertTriangle', 'color' => '#BA7517'],
                    ['label' => 'Exportar PDF', 'to' => '/app/control-escolar/reportes', 'icon' => 'fileText', 'color' => '#991B1B'],
                    ['label' => 'Exportar Excel', 'to' => '/app/control-escolar/reportes', 'icon' => 'table', 'color' => '#0F6E56'],
                ],
            ];
        });
    }

    /**
     * @param  Builder<Alumno>|\Illuminate\Database\Query\Builder  $alumnosIds
     * @return Builder<Matricula>
     */
    protected function matriculasActivasQuery(Builder $alumnosIds): Builder
    {
        return Matricula::query()
            ->whereNull('matriculas.deleted_at')
            ->whereIn('matriculas.estado', self::ESTADOS_MATRICULA_ACTIVA)
            ->whereIn('matriculas.alumno_id', $alumnosIds);
    }

    /**
     * @param  Builder<Alumno>|\Illuminate\Database\Query\Builder  $alumnosIds
     * @return array{completadas: int, en_proceso: int, bloqueadas: int}
     */
    protected function reinscripcionesResumen(Builder $alumnosIds): array
    {
        $latestPorMatricula = InscripcionPeriodo::query()
            ->selectRaw('MAX(inscripciones_periodo.id) as id')
            ->whereIn('matricula_id', $this->matriculasActivasQuery($alumnosIds)->select('id'))
            ->groupBy('matricula_id');

        $base = InscripcionPeriodo::query()->whereIn('id', $latestPorMatricula);
        $total = (clone $base)->count();

        $completadas = (clone $base)
            ->whereIn('estatus', self::ESTATUS_INSCRIPCION_ACTIVA)
            ->whereHas('cargasAcademicas')
            ->count();

        $bloqueadas = (clone $base)
            ->whereHas('matricula.alumno.documentosAcademicos', function (Builder $q): void {
                $q->where('estado_workflow', 'rechazado')
                    ->orWhereHas('observacionesPendientes');
            })
            ->count();

        return [
            'completadas' => $completadas,
            'en_proceso' => max(0, $total - $completadas - $bloqueadas),
            'bloqueadas' => $bloqueadas,
        ];
    }

    /**
     * @param  Builder<Alumno>|\Illuminate\Database\Query\Builder  $alumnosIds
     * @return array{total: int, confirmadas: int}
     */
    protected function inscripcionesResumen(Builder $alumnosIds): array
    {
        $base = InscripcionPeriodo::query()
            ->whereIn('matricula_id', $this->matriculasActivasQuery($alumnosIds)->select('id'));

        $total = (clone $base)->count();
        $confirmadas = (clone $base)
            ->whereIn('estatus', self::ESTATUS_INSCRIPCION_ACTIVA)
            ->whereHas('cargasAcademicas')
            ->count();

        return ['total' => $total, 'confirmadas' => $confirmadas];
    }

    /**
     * @return array{
     *   total: int,
     *   completos: int,
     *   segmentos: array{total: int, items: list<array{label: string, val: string, pct: string, color: string}>, conic_gradient: string}
     * }
     */
    protected function expedientesResumen(User $user): array
    {
        $base = $this->dashboard->queryAlumnosEnAlcance($user);
        $total = (clone $base)->count();

        $conObservaciones = (clone $base)->whereHas('documentosAcademicos', function (Builder $q): void {
            $q->whereHas('observacionesPendientes');
        })->count();

        $enRevision = (clone $base)->whereHas('documentosAcademicos', function (Builder $q): void {
            $q->where('estado_workflow', 'en_revision');
        })->whereDoesntHave('documentosAcademicos', fn (Builder $q) => $q->whereHas('observacionesPendientes'))->count();

        $completos = (clone $base)->whereHas('matriculaActiva')
            ->whereHas('matriculaActiva.inscripcionesPeriodo.cargasAcademicas')
            ->whereDoesntHave('documentosAcademicos', function (Builder $q): void {
                $q->where('estado_workflow', 'rechazado')->orWhereHas('observacionesPendientes');
            })
            ->count();

        $incompletos = max(0, $total - $completos - $conObservaciones - $enRevision);

        $items = $this->segmentosDesdeConteos([
            ['label' => 'Completos', 'count' => $completos, 'color' => '#0F6E56'],
            ['label' => 'En revisión', 'count' => $enRevision, 'color' => '#BA7517'],
            ['label' => 'Incompletos', 'count' => $incompletos, 'color' => '#991B1B'],
            ['label' => 'Observados', 'count' => $conObservaciones, 'color' => '#534AB7'],
        ], $total);

        return [
            'total' => $total,
            'completos' => $completos,
            'segmentos' => [
                'total' => $total,
                'items' => $items,
                'conic_gradient' => $this->conicGradient($items),
            ],
        ];
    }

    protected function pendientesOperativos(User $user): int
    {
        $alumnosIds = $this->dashboard->queryAlumnosEnAlcance($user)->select('id');

        $obs = DocumentoObservacion::query()
            ->where('estado', 'pendiente')
            ->whereHas('documentoAcademico.matricula', fn (Builder $m) => $m->whereIn('alumno_id', $alumnosIds))
            ->count();

        $docsRevision = DocumentoAcademico::query()
            ->where('estado_workflow', 'en_revision')
            ->whereHas('matricula', fn (Builder $m) => $m->whereIn('alumno_id', $alumnosIds))
            ->count();

        $importErrores = ImportacionHistoricaMaterias::query()
            ->whereHas('matricula', fn (Builder $m) => $m->whereIn('alumno_id', $alumnosIds))
            ->where(function (Builder $q): void {
                $q->where('estado', 'error')
                    ->orWhere('validacion_payload->tiene_bloqueos', true);
            })
            ->count();

        return $obs + $docsRevision + $importErrores;
    }

    /**
     * @param  Builder<Alumno>|\Illuminate\Database\Query\Builder  $alumnosIds
     * @return array{total: int, items: list<array{label: string, val: string, pct: string, color: string}>, conic_gradient: string}
     */
    protected function matriculaPorPrograma(Builder $alumnosIds, int $totalMatriculas): array
    {
        if ($totalMatriculas === 0) {
            return ['total' => 0, 'items' => [], 'conic_gradient' => 'conic-gradient(#e2e8f0 0deg 360deg)'];
        }

        $rows = $this->matriculasActivasQuery($alumnosIds)
            ->join('ofertas_academicas as oa', 'oa.id', '=', 'matriculas.oferta_academica_id')
            ->join('programas_estudio as pe', 'pe.id', '=', 'oa.programa_estudio_id')
            ->whereNull('oa.deleted_at')
            ->whereNull('pe.deleted_at')
            ->selectRaw('pe.nombre as programa, COUNT(*) as total')
            ->groupBy('pe.id', 'pe.nombre')
            ->orderByDesc('total')
            ->limit(5)
            ->get();

        $top = $rows->sum('total');
        $otros = max(0, $totalMatriculas - $top);

        $segmentos = [];
        $i = 0;
        foreach ($rows as $row) {
            $segmentos[] = [
                'label' => (string) $row->programa,
                'count' => (int) $row->total,
                'color' => self::COLORES_PROGRAMA[$i % count(self::COLORES_PROGRAMA)],
            ];
            $i++;
        }
        if ($otros > 0) {
            $segmentos[] = ['label' => 'Otros', 'count' => $otros, 'color' => '#e2e8f0'];
        }

        $items = $this->segmentosDesdeConteos($segmentos, $totalMatriculas);

        return [
            'total' => $totalMatriculas,
            'items' => $items,
            'conic_gradient' => $this->conicGradient($items),
        ];
    }

    /**
     * @param  list<array{label: string, count: int, color: string}>  $segmentos
     * @return list<array{label: string, val: string, pct: string, color: string}>
     */
    protected function segmentosDesdeConteos(array $segmentos, int $total): array
    {
        if ($total === 0) {
            return [];
        }

        return collect($segmentos)
            ->filter(fn (array $s) => ($s['count'] ?? 0) > 0)
            ->map(function (array $s) use ($total): array {
                $count = (int) ($s['count'] ?? 0);
                $pct = round(($count / $total) * 100, 1);

                return [
                    'label' => (string) ($s['label'] ?? '—'),
                    'val' => number_format($count, 0, '.', ','),
                    'pct' => $pct.'%',
                    'pct_num' => $pct,
                    'color' => (string) ($s['color'] ?? '#64748b'),
                ];
            })
            ->values()
            ->all();
    }

    /**
     * @param  list<array{pct_num: float, color: string}>  $items
     */
    protected function conicGradient(array $items): string
    {
        if ($items === []) {
            return 'conic-gradient(#e2e8f0 0deg 360deg)';
        }

        $deg = 0.0;
        $parts = [];
        foreach ($items as $item) {
            $slice = ((float) ($item['pct_num'] ?? 0)) * 3.6;
            $next = $deg + $slice;
            $parts[] = sprintf('%s %.1fdeg %.1fdeg', $item['color'], $deg, $next);
            $deg = $next;
        }

        return 'conic-gradient('.implode(', ', $parts).')';
    }

    /**
     * @param  Builder<Alumno>|\Illuminate\Database\Query\Builder  $alumnosIds
     * @return array{labels: list<string>, datasets: list<array{label: string, color: string, stroke_width: float, dash: ?string, data: list<int>}>}
     */
    protected function tramitesPorMes(Builder $alumnosIds): array
    {
        $matriculaIds = $this->matriculasActivasQuery($alumnosIds)->select('id');
        $inicio = now()->subMonths(11)->startOfMonth();
        $labels = [];
        $inscripciones = [];
        $reinscripciones = [];
        $bajas = [];

        for ($i = 0; $i < 12; $i++) {
            $mes = $inicio->copy()->addMonths($i);
            $labels[] = $this->mesCorto($mes);
            $desde = $mes->copy()->startOfMonth();
            $hasta = $mes->copy()->endOfMonth();

            $inscripciones[] = InscripcionPeriodo::query()
                ->whereIn('matricula_id', $matriculaIds)
                ->whereBetween('created_at', [$desde, $hasta])
                ->count();

            $reinscripciones[] = InscripcionPeriodo::query()
                ->whereIn('matricula_id', $matriculaIds)
                ->whereIn('estatus', self::ESTATUS_INSCRIPCION_ACTIVA)
                ->whereBetween('updated_at', [$desde, $hasta])
                ->count();

            $bajas[] = Matricula::query()
                ->whereIn('matriculas.id', $matriculaIds)
                ->whereIn('matriculas.estado', ['baja_temporal', 'baja_definitiva', 'suspendida'])
                ->whereBetween('matriculas.updated_at', [$desde, $hasta])
                ->count();
        }

        return [
            'labels' => $labels,
            'datasets' => [
                ['label' => 'Inscripciones', 'color' => '#185FA5', 'stroke_width' => 2.5, 'dash' => null, 'data' => $inscripciones],
                ['label' => 'Reinscripciones', 'color' => '#0F6E56', 'stroke_width' => 2.5, 'dash' => '6,3', 'data' => $reinscripciones],
                ['label' => 'Bajas y cambios', 'color' => '#991B1B', 'stroke_width' => 2, 'dash' => '2,4', 'data' => $bajas],
            ],
        ];
    }

    /**
     * @return list<array{nombre: string, descripcion: string, fecha: string, icon_color: string, bg: string, icon: string, ruta: string}>
     */
    protected function reportesFrecuentes(User $user): array
    {
        $tz = config('app.timezone');
        $fmt = fn (?Carbon $dt) => $dt
            ? $dt->timezone($tz)->format('d/m/Y h:i a')
            : '—';

        $alumnosIds = $this->dashboard->queryAlumnosEnAlcance($user)->select('id');

        $ultimaMatricula = $this->matriculasActivasQuery($alumnosIds)->max('updated_at');
        $ultimaInscripcion = InscripcionPeriodo::query()
            ->whereIn('matricula_id', $this->matriculasActivasQuery($alumnosIds)->select('id'))
            ->max('updated_at');
        $ultimaObs = DocumentoObservacion::query()
            ->whereHas('documentoAcademico.matricula', fn (Builder $m) => $m->whereIn('alumno_id', $alumnosIds))
            ->max('updated_at');
        $ultimaImport = ImportacionHistoricaMaterias::query()
            ->whereHas('matricula', fn (Builder $m) => $m->whereIn('alumno_id', $alumnosIds))
            ->max('updated_at');

        $catalogo = [
            [
                'nombre' => 'Reporte de matrícula',
                'descripcion' => 'Resumen de la matrícula total por programa, grado y grupo.',
                'icon' => 'users',
                'icon_color' => '#185FA5',
                'bg' => '#DBEAFE',
                'ruta' => '/app/control-escolar/alumnos',
                'fecha' => $fmt($ultimaMatricula ? Carbon::parse($ultimaMatricula) : null),
            ],
            [
                'nombre' => 'Reporte de reinscripciones',
                'descripcion' => 'Detalle de alumnos reinscritos por programa y periodo.',
                'icon' => 'refreshCw',
                'icon_color' => '#0F6E56',
                'bg' => '#DCFCE7',
                'ruta' => '/app/control-escolar/reinscripciones',
                'fecha' => $fmt($ultimaInscripcion ? Carbon::parse($ultimaInscripcion) : null),
            ],
            [
                'nombre' => 'Reporte de pendientes',
                'descripcion' => 'Listado de pendientes por atender (documentos y trámites).',
                'icon' => 'alertTriangle',
                'icon_color' => '#BA7517',
                'bg' => '#FEF3C7',
                'ruta' => '/app/control-escolar/solicitudes',
                'fecha' => $fmt(now()),
            ],
            [
                'nombre' => 'Reporte de expedientes',
                'descripcion' => 'Estatus de los expedientes por programa y estatus.',
                'icon' => 'folder',
                'icon_color' => '#534AB7',
                'bg' => '#EEEDFE',
                'ruta' => '/app/control-escolar/expedientes',
                'fecha' => $fmt($ultimaInscripcion ? Carbon::parse($ultimaInscripcion) : null),
            ],
            [
                'nombre' => 'Reporte de observaciones',
                'descripcion' => 'Documentos y solicitudes con observaciones pendientes.',
                'icon' => 'fileText',
                'icon_color' => '#C2410C',
                'bg' => '#FFEDD5',
                'ruta' => '/app/control-escolar/observaciones',
                'fecha' => $fmt($ultimaObs ? Carbon::parse($ultimaObs) : null),
            ],
            [
                'nombre' => 'Reporte de importaciones',
                'descripcion' => 'Histórico de importaciones con errores o bloqueos.',
                'icon' => 'table',
                'icon_color' => '#185FA5',
                'bg' => '#DBEAFE',
                'ruta' => '/app/control-escolar/importaciones',
                'fecha' => $fmt($ultimaImport ? Carbon::parse($ultimaImport) : null),
            ],
        ];

        return $catalogo;
    }

    protected function cicloActivoLabel(): string
    {
        $ciclo = CicloEscolar::query()->where('activo', true)->orderByDesc('id')->first()
            ?? CicloEscolar::query()->orderByDesc('id')->first();

        if ($ciclo === null) {
            return '—';
        }

        $clave = trim((string) ($ciclo->clave ?? ''));
        if ($clave !== '') {
            return $clave;
        }

        $inicio = $ciclo->fecha_inicio ?? null;
        $fin = $ciclo->fecha_fin ?? null;
        if ($inicio && $fin) {
            return Carbon::parse($inicio)->format('Y').'-'.Carbon::parse($fin)->format('Y');
        }

        return 'Ciclo '.$ciclo->id;
    }

    protected function mesCorto(Carbon $fecha): string
    {
        $meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

        return $meses[(int) $fecha->format('n') - 1] ?? $fecha->format('M');
    }
}
