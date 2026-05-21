<?php

declare(strict_types=1);

namespace App\Services\ControlEscolar;

use App\Models\Alumno;
use App\Models\DocumentoAcademico;
use App\Models\InscripcionPeriodo;
use App\Models\User;
use App\Services\Certificacion\CertificacionAlcanceService;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;

class ControlEscolarExpedientesService
{
    private const ESTATUS_INSCRIPCION_ACTIVA = ['activa', 'inscrita'];

    /** @var list<array{key: string, nombre: string, req: string}> */
    private const REQUISITOS_OPERATIVOS = [
        ['key' => 'matricula', 'nombre' => 'Matrícula activa', 'req' => 'Obligatorio'],
        ['key' => 'inscripcion', 'nombre' => 'Inscripción de periodo', 'req' => 'Obligatorio'],
        ['key' => 'carga', 'nombre' => 'Carga académica', 'req' => 'Obligatorio'],
        ['key' => 'calificaciones', 'nombre' => 'Calificaciones capturadas', 'req' => 'Obligatorio'],
        ['key' => 'documento', 'nombre' => 'Documento académico sin observaciones', 'req' => 'Obligatorio'],
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
            $stats = $this->estadisticasExpediente($user);
            $query = $this->queryListado($user, $term !== '' ? $term : null);
            $paginator = $query->paginate($perPage, ['*'], 'page', $page);

            return [
                'actualizado_en' => now()->toIso8601String(),
                'metricas' => $stats['metricas'],
                'listado' => [
                    'data' => collect($paginator->items())->map(fn (Alumno $a) => $this->filaListado($a))->values()->all(),
                    'meta' => [
                        'current_page' => $paginator->currentPage(),
                        'last_page' => $paginator->lastPage(),
                        'per_page' => $paginator->perPage(),
                        'total' => $paginator->total(),
                        'from' => $paginator->firstItem(),
                        'to' => $paginator->lastItem(),
                    ],
                ],
                'documentos_requeridos' => $stats['requisitos'],
                'promedio_documentos_completos' => $stats['metricas']['promedio_requisitos_pct'] ?? 0,
                'actividad_reciente' => $this->actividadReciente($user),
            ];
        });
    }

    /**
     * @return array{metricas: array<string, int>, requisitos: list<array<string, mixed>>}
     */
    protected function estadisticasExpediente(User $user): array
    {
        $base = $this->dashboard->queryAlumnosEnAlcance($user);
        $total = (clone $base)->count();
        $conObservaciones = (clone $base)->whereHas('documentosAcademicos', function (Builder $q): void {
            $q->where('estado_workflow', 'rechazado')
                ->orWhereHas('observacionesPendientes');
        })->count();
        $conMatricula = (clone $base)->whereHas('matriculaActiva')->count();
        $conInscripcion = (clone $base)->whereHas('matriculaActiva.inscripcionesPeriodo', function (Builder $q): void {
            $q->whereIn('estatus', self::ESTATUS_INSCRIPCION_ACTIVA);
        })->count();
        $conCarga = (clone $base)->whereHas('matriculaActiva.inscripcionesPeriodo.cargasAcademicas')->count();
        $conDocumento = (clone $base)->whereHas('documentosAcademicos', fn (Builder $q) => $q->where('estado_workflow', 'aprobado'))->count();
        $documentosFaltantes = (clone $base)->whereDoesntHave('documentosAcademicos', function (Builder $q): void {
            $q->where('estado_workflow', 'aprobado');
        })->count();
        $completos = max(0, min($conInscripcion, $total - $conObservaciones));
        $pendientes = max(0, $total - $completos - $conObservaciones);
        $promedio = $total > 0
            ? (int) round((($conMatricula + $conInscripcion) / ($total * 2)) * 100)
            : 0;

        $totalReq = max(1, $total);
        $conteosReq = [
            'matricula' => $conMatricula,
            'inscripcion' => $conInscripcion,
            'carga' => $conCarga,
            'calificaciones' => $conCarga,
            'documento' => $conDocumento,
        ];
        $requisitos = [];
        foreach (self::REQUISITOS_OPERATIVOS as $requisito) {
            $cumplen = (int) ($conteosReq[$requisito['key']] ?? 0);
            $pct = (int) round(($cumplen / $totalReq) * 100);
            $requisitos[] = [
                'nombre' => $requisito['nombre'],
                'req' => $requisito['req'],
                'comp' => number_format($cumplen).' ('.$pct.'%)',
                'ok' => $pct >= 85,
                'pct' => $pct,
            ];
        }

        return [
            'metricas' => [
                'pendientes' => $pendientes,
                'completos' => $completos,
                'con_observaciones' => $conObservaciones,
                'documentos_faltantes' => $documentosFaltantes,
                'total_alcance' => $total,
                'promedio_requisitos_pct' => $promedio,
            ],
            'requisitos' => $requisitos,
        ];
    }

    /**
     * @return Builder<Alumno>
     */
    protected function queryListado(User $user, ?string $search): Builder
    {
        $query = $this->dashboard->queryAlumnosEnAlcance($user)
            ->with([
                'matriculaActiva.ofertaAcademica.planEstudio.programaEstudio',
                'matriculaActiva.inscripcionesPeriodo' => fn ($q) => $q
                    ->whereIn('estatus', self::ESTATUS_INSCRIPCION_ACTIVA)
                    ->latest('id')
                    ->limit(1)
                    ->with(['cargasAcademicas.materiasCursadas:id,carga_academica_id,calificacion']),
                'documentosAcademicos' => fn ($q) => $q->latest('id')->limit(5)->with('observacionesPendientes'),
            ])
            ->orderByDesc('updated_at')
            ->orderByDesc('id');

        $term = trim((string) $search);
        if ($term !== '') {
            $like = '%'.$term.'%';
            $folioId = $this->resolverAlumnoIdDesdeFolio($term);
            $query->where(function (Builder $q) use ($like, $folioId): void {
                $q->where('curp', 'like', $like)
                    ->orWhere('nombre', 'like', $like)
                    ->orWhere('primer_apellido', 'like', $like)
                    ->orWhere('segundo_apellido', 'like', $like)
                    ->orWhereHas('matriculas', fn (Builder $m) => $m->where('matricula', 'like', $like))
                    ->orWhereHas('matriculaActiva.ofertaAcademica.planEstudio.programaEstudio', function (Builder $p) use ($like): void {
                        $p->where('nombre', 'like', $like)->orWhere('clave', 'like', $like);
                    });
                if ($folioId !== null) {
                    $q->orWhere('id', $folioId);
                }
            });
        }

        return $query;
    }

    /**
     * @return Builder<Alumno>
     */
    protected function queryExpedientesCompletos(User $user): Builder
    {
        return $this->queryListado($user, null)
            ->whereHas('matriculaActiva')
            ->whereHas('matriculaActiva.inscripcionesPeriodo', fn (Builder $q) => $q->whereIn('estatus', self::ESTATUS_INSCRIPCION_ACTIVA))
            ->whereHas('matriculaActiva.inscripcionesPeriodo.cargasAcademicas')
            ->whereHas('matriculaActiva.inscripcionesPeriodo.cargasAcademicas.materiasCursadas', fn (Builder $q) => $q->whereNotNull('calificacion'))
            ->whereDoesntHave('documentosAcademicos', function (Builder $q): void {
                $q->where('estado_workflow', 'rechazado')
                    ->orWhereHas('observacionesPendientes');
            });
    }

    /**
     * @return Builder<Alumno>
     */
    protected function queryConObservaciones(User $user): Builder
    {
        return $this->queryListado($user, null)->whereHas('documentosAcademicos', function (Builder $q): void {
            $q->where('estado_workflow', 'rechazado')
                ->orWhereHas('observacionesPendientes');
        });
    }

    /**
     * @return Builder<Alumno>
     */
    protected function querySinDocumentoAprobado(User $user): Builder
    {
        return $this->queryListado($user, null)->whereDoesntHave('documentosAcademicos', function (Builder $q): void {
            $q->where('estado_workflow', 'aprobado');
        });
    }

    /**
     * @return array<string, mixed>
     */
    protected function filaListado(Alumno $alumno): array
    {
        $mat = $alumno->matriculaActiva;
        $prog = $mat?->ofertaAcademica?->planEstudio?->programaEstudio;

        return [
            'alumno_id' => $alumno->id,
            'folio' => $this->folioExpediente($alumno->id),
            'alumno' => $this->nombreCompleto($alumno),
            'matricula' => $mat?->matricula ?? '—',
            'programa' => $prog?->nombre ?? '—',
            'actualizado' => $alumno->updated_at?->toIso8601String() ?? '',
            'usuario' => 'Control Escolar',
            'estatus' => $this->estatusVisual($alumno),
            'expediente_url' => '/app/alumnos/'.$alumno->id.'/expediente',
        ];
    }

    protected function estatusVisual(Alumno $alumno): string
    {
        if ($this->tieneObservacionesDocumentales($alumno)) {
            return 'Con observaciones';
        }

        if ($this->expedienteOperativoCompleto($alumno)) {
            return 'Completo';
        }

        return 'Pendiente';
    }

    protected function tieneObservacionesDocumentales(Alumno $alumno): bool
    {
        return $alumno->documentosAcademicos->contains(function (DocumentoAcademico $doc): bool {
            if ($doc->estado_workflow === 'rechazado') {
                return true;
            }

            return $doc->observacionesPendientes->isNotEmpty();
        });
    }

    protected function expedienteOperativoCompleto(Alumno $alumno): bool
    {
        $mat = $alumno->matriculaActiva;
        if ($mat === null) {
            return false;
        }

        $inscripciones = $mat->relationLoaded('inscripcionesPeriodo')
            ? $mat->inscripcionesPeriodo
            : collect();

        $activa = $inscripciones->first(
            fn (InscripcionPeriodo $ins) => in_array((string) $ins->estatus, self::ESTATUS_INSCRIPCION_ACTIVA, true)
        );

        if ($activa === null) {
            return false;
        }

        if ($activa->cargasAcademicas->isEmpty()) {
            return false;
        }

        return $activa->cargasAcademicas->contains(
            fn ($carga) => $carga->materiasCursadas->contains(fn ($m) => $m->calificacion !== null)
        );
    }

    /**
     * @return list<array{type: string, titulo: string, alumno: string, hora_relativa: string, expediente_url: string}>
     */
    protected function actividadReciente(User $user): array
    {
        $items = [];

        $docsObs = $this->documentosEnAlcance($user)
            ->with(['alumno:id,nombre,primer_apellido,segundo_apellido'])
            ->where(function (Builder $q): void {
                $q->where('estado_workflow', 'rechazado')
                    ->orWhereHas('observacionesPendientes');
            })
            ->latest('updated_at')
            ->limit(3)
            ->get();

        foreach ($docsObs as $doc) {
            $nombre = $this->nombreCompleto($doc->alumno);
            $items[] = [
                'type' => 'obs',
                'titulo' => 'Observación pendiente en expediente de',
                'alumno' => $nombre,
                'hora_relativa' => $this->horaRelativa($doc->updated_at),
                'expediente_url' => '/app/alumnos/'.$doc->alumno_id.'/expediente',
            ];
        }

        $recientes = $this->queryListado($user, null)->limit(4)->get();
        foreach ($recientes as $alumno) {
            $items[] = [
                'type' => 'upload',
                'titulo' => 'Actualización en expediente de',
                'alumno' => $this->nombreCompleto($alumno),
                'hora_relativa' => $this->horaRelativa($alumno->updated_at),
                'expediente_url' => '/app/alumnos/'.$alumno->id.'/expediente',
            ];
        }

        return array_slice($items, 0, 6);
    }

    protected function documentosEnAlcance(User $user): Builder
    {
        $query = DocumentoAcademico::query();
        app(CertificacionAlcanceService::class)
            ->aplicarAlcanceDocumentosAcademicos($query, $user);

        return $query;
    }

    protected function horaRelativa(?Carbon $fecha): string
    {
        if ($fecha === null) {
            return '—';
        }

        return $fecha->locale('es')->diffForHumans(short: true);
    }

    protected function folioExpediente(int $alumnoId): string
    {
        return 'EXP-'.str_pad((string) $alumnoId, 6, '0', STR_PAD_LEFT);
    }

    protected function resolverAlumnoIdDesdeFolio(string $term): ?int
    {
        if (preg_match('/^EXP-0*(\d+)$/i', trim($term), $m) === 1) {
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
}
