<?php

declare(strict_types=1);

namespace App\Services\ControlEscolar;

use App\Models\Alumno;
use App\Models\DocumentoAcademico;
use App\Models\ImportacionHistoricaMaterias;
use App\Models\InscripcionPeriodo;
use App\Models\Matricula;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

class ControlEscolarReinscripcionesService
{
    private const ESTATUS_INSCRIPCION_ACTIVA = ['activa', 'inscrita', 'cursando'];

    private const ESTADOS_MATRICULA_ACTIVA = ['activa', 'vigente'];

    /** @var list<string> */
    private const MOTIVOS_CATALOGO = [
        'Documentos incompletos',
        'Calificaciones pendientes',
        'Trayectoria no consolidada',
        'Observaciones pendientes',
        'Datos del alumno inconsistentes',
        'Validación normativa pendiente',
        'Firma de responsiva pendiente',
    ];

    public function __construct(
        protected ControlEscolarDashboardService $dashboard,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function gestion(User $user, ?string $search, int $page, int $perPage): array
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
                'regla_continuidad' => 'La reinscripción aplica a alumnos con matrícula activa y continuidad académica registrada en tu alcance.',
                'listado' => [
                    'data' => collect($paginator->items())
                        ->map(fn (InscripcionPeriodo $ins) => $this->filaListado($ins))
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
                'motivos_bloqueo' => $this->motivosBloqueo($user),
            ];
        });
    }

    /**
     * @return array{en_proceso: int, bloqueadas: int, completadas: int, adeudos: int, total_alcance: int}
     */
    protected function metricas(User $user): array
    {
        $base = $this->queryListado($user, null);
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

        $enProceso = max(0, $total - $completadas - $bloqueadas);

        return [
            'en_proceso' => $enProceso,
            'bloqueadas' => $bloqueadas,
            'completadas' => $completadas,
            'adeudos' => $bloqueadas,
            'total_alcance' => $total,
        ];
    }

    /**
     * @return Builder<InscripcionPeriodo>
     */
    protected function queryListado(User $user, ?string $search): Builder
    {
        $latestPorMatricula = InscripcionPeriodo::query()
            ->selectRaw('MAX(inscripciones_periodo.id) as id')
            ->whereIn('matricula_id', Matricula::query()
                ->select('id')
                ->whereIn('estado', self::ESTADOS_MATRICULA_ACTIVA)
                ->whereIn('alumno_id', $this->dashboard->queryAlumnosEnAlcance($user)->select('id')))
            ->groupBy('matricula_id');

        $query = InscripcionPeriodo::query()
            ->with([
                'matricula.alumno:id,nombre,primer_apellido,segundo_apellido,curp',
                'matricula:id,matricula,alumno_id',
                'matricula.ofertaAcademica.planEstudio.programaEstudio',
                'matricula.alumno.documentosAcademicos' => fn ($q) => $q->latest('id')->limit(3)->with('observacionesPendientes'),
                'cicloEscolar:id,nombre,clave',
                'cargasAcademicas.materiasCursadas:id,carga_academica_id,calificacion,estatus_acreditacion',
            ])
            ->whereIn('id', $latestPorMatricula)
            ->orderByDesc('updated_at')
            ->orderByDesc('id');

        $term = trim((string) $search);
        if ($term !== '') {
            $like = '%'.$term.'%';
            $folioId = $this->resolverReinscripcionIdDesdeFolio($term);
            $query->where(function (Builder $q) use ($like, $folioId): void {
                $q->whereHas('matricula', fn (Builder $m) => $m->where('matricula', 'like', $like))
                    ->orWhereHas('matricula.alumno', function (Builder $a) use ($like): void {
                        $a->where('curp', 'like', $like)
                            ->orWhere('nombre', 'like', $like)
                            ->orWhere('primer_apellido', 'like', $like)
                            ->orWhere('segundo_apellido', 'like', $like);
                    })
                    ->orWhereHas('cicloEscolar', fn (Builder $c) => $c->where('nombre', 'like', $like));
                if ($folioId !== null) {
                    $q->orWhere('id', $folioId);
                }
            });
        }

        return $query;
    }

    /**
     * @return list<array{label: string, n: int}>
     */
    protected function motivosBloqueo(User $user): array
    {
        $conteos = array_fill_keys(self::MOTIVOS_CATALOGO, 0);

        $this->queryListado($user, null)
            ->with(['matricula.alumno.documentosAcademicos.observacionesPendientes', 'cargasAcademicas.materiasCursadas'])
            ->orderByDesc('id')
            ->limit(120)
            ->get()
            ->each(function (InscripcionPeriodo $ins) use (&$conteos): void {
                $motivo = $this->resolverMotivoBloqueo($ins);
                if ($motivo !== null && isset($conteos[$motivo])) {
                    $conteos[$motivo]++;
                }
            });

        $items = [];
        foreach (self::MOTIVOS_CATALOGO as $label) {
            if ($conteos[$label] > 0) {
                $items[] = ['label' => $label, 'n' => $conteos[$label]];
            }
        }

        usort($items, static fn (array $a, array $b): int => $b['n'] <=> $a['n']);

        return array_slice($items, 0, 7);
    }

    /**
     * @return array<string, mixed>
     */
    protected function filaListado(InscripcionPeriodo $ins): array
    {
        $alumno = $ins->matricula?->alumno;
        $motivo = $this->resolverMotivoBloqueo($ins);

        return [
            'reinscripcion_id' => $ins->id,
            'alumno_id' => $alumno?->id,
            'folio' => $this->folioReinscripcion($ins->id),
            'alumno' => $this->nombreCompleto($alumno),
            'matricula' => $ins->matricula?->matricula ?? $this->curpAbreviada($alumno),
            'periodo' => $ins->cicloEscolar?->nombre
                ?? $ins->etiqueta_periodo_curricular
                ?? '—',
            'motivo' => $motivo ?? '—',
            'estatus' => $this->estatusVisual($ins),
            'expediente_url' => $alumno ? '/app/alumnos/'.$alumno->id.'/expediente' : '/app/control-escolar/expedientes',
        ];
    }

    protected function estatusVisual(InscripcionPeriodo $ins): string
    {
        $motivo = $this->resolverMotivoBloqueo($ins);

        if ($motivo === 'Calificaciones pendientes' || $motivo === 'Validación normativa pendiente') {
            return 'Bloqueada';
        }

        if ($motivo === 'Observaciones pendientes' || $motivo === 'Documentos incompletos') {
            return 'Observada';
        }

        if ($motivo !== null) {
            return 'Bloqueada';
        }

        if ($ins->cargasAcademicas->isNotEmpty()
            && in_array((string) $ins->estatus, self::ESTATUS_INSCRIPCION_ACTIVA, true)) {
            return 'Completada';
        }

        return 'En proceso';
    }

    protected function resolverMotivoBloqueo(InscripcionPeriodo $ins): ?string
    {
        if ($this->tieneCalificacionesPendientes($ins)) {
            return 'Calificaciones pendientes';
        }

        if ($this->tieneObservaciones($ins)) {
            return 'Observaciones pendientes';
        }

        if ($this->tieneDocumentosRechazados($ins)) {
            return 'Documentos incompletos';
        }

        if ($this->tieneImportacionBloqueada($ins)) {
            return 'Validación normativa pendiente';
        }

        if ($this->tieneTrayectoriaNoConsolidada($ins)) {
            return 'Trayectoria no consolidada';
        }

        return null;
    }

    protected function tieneCalificacionesPendientes(InscripcionPeriodo $ins): bool
    {
        if ($ins->cargasAcademicas->isEmpty()) {
            return false;
        }

        foreach ($ins->cargasAcademicas as $carga) {
            if ($carga->materiasCursadas->isEmpty()) {
                return true;
            }
            foreach ($carga->materiasCursadas as $mc) {
                if ($mc->calificacion === null) {
                    return true;
                }
            }
        }

        return false;
    }

    protected function tieneObservaciones(InscripcionPeriodo $ins): bool
    {
        $alumno = $ins->matricula?->alumno;
        if ($alumno === null) {
            return false;
        }

        return $alumno->documentosAcademicos->contains(function (DocumentoAcademico $doc): bool {
            return $doc->observacionesPendientes->isNotEmpty();
        });
    }

    protected function tieneDocumentosRechazados(InscripcionPeriodo $ins): bool
    {
        $alumno = $ins->matricula?->alumno;
        if ($alumno === null) {
            return false;
        }

        return $alumno->documentosAcademicos->contains(
            fn (DocumentoAcademico $doc): bool => $doc->estado_workflow === 'rechazado'
        );
    }

    protected function tieneImportacionBloqueada(InscripcionPeriodo $ins): bool
    {
        $matriculaId = $ins->matricula_id;
        if ($matriculaId === null) {
            return false;
        }

        return ImportacionHistoricaMaterias::query()
            ->where('matricula_id', $matriculaId)
            ->where(function (Builder $q): void {
                $q->where('estado', 'error')
                    ->orWhere('estado', 'rechazada')
                    ->orWhere('validacion_payload->tiene_bloqueos', true);
            })
            ->exists();
    }

    protected function tieneTrayectoriaNoConsolidada(InscripcionPeriodo $ins): bool
    {
        $tray = $ins->matricula?->trayectoriaAcademica;
        if ($tray === null) {
            return false;
        }

        return ! in_array((string) $tray->estado, ['consolidada', 'lista_certificacion'], true);
    }

    protected function folioReinscripcion(int $id): string
    {
        return 'REI-'.now()->format('Y').'-'.str_pad((string) $id, 4, '0', STR_PAD_LEFT);
    }

    protected function resolverReinscripcionIdDesdeFolio(string $term): ?int
    {
        if (preg_match('/^REI-\d{4}-0*(\d+)$/i', trim($term), $m) === 1) {
            return (int) $m[1];
        }

        return null;
    }

    protected function nombreCompleto(?Alumno $alumno): string
    {
        if ($alumno === null) {
            return 'Alumno no disponible';
        }

        return trim(implode(' ', array_filter([
            $alumno->nombre,
            $alumno->primer_apellido,
            $alumno->segundo_apellido,
        ])));
    }

    protected function curpAbreviada(?Alumno $alumno): string
    {
        $curp = (string) ($alumno?->curp ?? '');
        if (strlen($curp) < 8) {
            return $curp !== '' ? $curp : '—';
        }

        return 'CURP …'.substr($curp, -4);
    }
}
