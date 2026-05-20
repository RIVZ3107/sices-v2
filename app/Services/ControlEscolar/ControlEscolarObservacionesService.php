<?php

declare(strict_types=1);

namespace App\Services\ControlEscolar;

use App\Enums\Certificacion\EstadoWorkflow;
use App\Enums\Certificacion\TipoDocumentoAcademico;
use App\Models\Alumno;
use App\Models\DocumentoAcademico;
use App\Models\DocumentoObservacion;
use App\Models\User;
use App\Services\Certificacion\CertificacionAlcanceService;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;

class ControlEscolarObservacionesService
{
    private const DIAS_VENCIDA = 30;

    private const DIAS_VENCIDA_PRIORIDAD_ALTA = 7;

    public function __construct(
        protected ControlEscolarDashboardService $dashboard,
        protected CertificacionAlcanceService $alcance,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function gestion(User $user, ?string $search, int $page, int $perPage, ?int $observacionId): array
    {
        $perPage = max(1, min(50, $perPage));
        $page = max(1, $page);

        return $this->dashboard->conAlcanceUsuario($user, function () use ($user, $search, $page, $perPage, $observacionId): array {
            $metricas = $this->metricas($user);
            $query = $this->queryListado($user, $search);
            $paginator = $query->paginate($perPage, ['*'], 'page', $page);

            $filas = collect($paginator->items())
                ->map(fn (DocumentoObservacion $obs) => $this->filaListado($obs))
                ->values()
                ->all();

            $seleccionada = $this->resolverSeleccion($user, $observacionId, $paginator->items());

            return [
                'actualizado_en' => now()->toIso8601String(),
                'metricas' => $metricas,
                'listado' => [
                    'data' => $filas,
                    'meta' => [
                        'current_page' => $paginator->currentPage(),
                        'last_page' => $paginator->lastPage(),
                        'per_page' => $paginator->perPage(),
                        'total' => $paginator->total(),
                        'from' => $paginator->firstItem(),
                        'to' => $paginator->lastItem(),
                    ],
                ],
                'detalle' => $seleccionada !== null ? $this->detalle($seleccionada) : null,
                'historial' => $seleccionada !== null ? $this->historial($seleccionada) : [],
            ];
        });
    }

    /**
     * @return array{
     *   pendientes: int,
     *   pendientes_trend: string,
     *   pendientes_trend_color: string,
     *   atendidas: int,
     *   atendidas_trend: string,
     *   atendidas_trend_color: string,
     *   devueltas: int,
     *   devueltas_trend: string,
     *   devueltas_trend_color: string,
     *   vencidas: int,
     *   vencidas_trend: string,
     *   vencidas_trend_color: string
     * }
     */
    protected function metricas(User $user): array
    {
        $base = $this->queryBase($user);
        $desde60 = now()->subDays(60);
        $hace7 = now()->subDays(7);

        $pendientes = (clone $base)->where('estado', 'pendiente')->count();
        $atendidas = (clone $base)->where('estado', 'atendida')->where('atendida_at', '>=', $desde60)->count();
        $devueltas = (clone $base)->where('estado', 'descartada')->where('updated_at', '>=', $desde60)->count();
        $vencidas = (clone $base)->where('estado', 'pendiente')->where(function (Builder $q): void {
            $q->where('created_at', '<', now()->subDays(self::DIAS_VENCIDA))
                ->orWhere(function (Builder $q2): void {
                    $q2->whereIn('prioridad', ['alta', 'critica'])
                        ->where('created_at', '<', now()->subDays(self::DIAS_VENCIDA_PRIORIDAD_ALTA));
                });
        })->count();

        $pendientesSemana = (clone $base)->where('estado', 'pendiente')->where('created_at', '>=', $hace7)->count();

        return [
            'pendientes' => $pendientes,
            'pendientes_trend' => 'Por atender',
            'pendientes_trend_color' => '#185FA5',
            'atendidas' => $atendidas,
            'atendidas_trend' => 'Últimos 60 días',
            'atendidas_trend_color' => '#0F6E56',
            'devueltas' => $devueltas,
            'devueltas_trend' => 'Requieren nueva acción',
            'devueltas_trend_color' => '#BA7517',
            'vencidas' => $vencidas,
            'vencidas_trend' => 'Prioridad alta',
            'vencidas_trend_color' => '#991B1B',
            'nuevas_semana' => $pendientesSemana,
        ];
    }

    /**
     * @return Builder<DocumentoObservacion>
     */
    protected function queryBase(User $user): Builder
    {
        $query = DocumentoObservacion::query();
        $query->whereHas('documentoAcademico', function (Builder $doc) use ($user): void {
            $this->alcance->aplicarAlcanceDocumentosAcademicos($doc, $user);
        });

        return $query;
    }

    /**
     * @return Builder<DocumentoObservacion>
     */
    protected function queryListado(User $user, ?string $search): Builder
    {
        $query = $this->queryBase($user)
            ->with([
                'documentoAcademico.alumno:id,nombre,primer_apellido,segundo_apellido,curp',
                'documentoAcademico.matricula:id,matricula,alumno_id',
                'creadaPor:id,name',
            ])
            ->orderByDesc('created_at')
            ->orderByDesc('id');

        $term = trim((string) $search);
        if ($term !== '') {
            $like = '%'.$term.'%';
            $query->where(function (Builder $q) use ($like, $term): void {
                $q->where('observacion', 'like', $like);
                if (ctype_digit($term)) {
                    $q->orWhere('id', (int) $term);
                }
                $q->orWhereHas('documentoAcademico', function (Builder $doc) use ($like): void {
                    $doc->where('folio_interno', 'like', $like)
                        ->orWhereHas('alumno', function (Builder $a) use ($like): void {
                            $a->where('nombre', 'like', $like)
                                ->orWhere('primer_apellido', 'like', $like)
                                ->orWhere('segundo_apellido', 'like', $like)
                                ->orWhere('curp', 'like', $like);
                        })
                        ->orWhereHas('matricula', fn (Builder $m) => $m->where('matricula', 'like', $like));
                });
            });
        }

        return $query;
    }

    /**
     * @param  list<DocumentoObservacion>  $paginaActual
     */
    protected function resolverSeleccion(User $user, ?int $observacionId, array $paginaActual): ?DocumentoObservacion
    {
        if ($observacionId !== null && $observacionId > 0) {
            $obs = $this->queryBase($user)
                ->with([
                    'documentoAcademico.alumno',
                    'documentoAcademico.matricula',
                    'creadaPor:id,name',
                    'atendidaPor:id,name',
                ])
                ->whereKey($observacionId)
                ->first();

            if ($obs !== null) {
                return $obs;
            }
        }

        return $paginaActual[0] ?? null;
    }

    /**
     * @return array<string, mixed>
     */
    protected function filaListado(DocumentoObservacion $obs): array
    {
        $doc = $obs->documentoAcademico;
        $alumno = $doc?->alumno;
        $dt = $obs->created_at ?? now();
        $carbon = $dt instanceof Carbon ? $dt : Carbon::parse($dt);

        return [
            'id' => $obs->id,
            'folio' => $this->folioObservacion($obs),
            'alumno' => $this->nombreAlumno($alumno),
            'alumno_id' => $alumno?->id,
            'modulo' => $this->moduloEtiqueta($obs, $doc),
            'texto' => trim((string) $obs->observacion),
            'prioridad' => $this->prioridadEtiqueta((string) $obs->prioridad),
            'estado' => $this->estadoEtiqueta($obs),
            'fecha' => $carbon->timezone(config('app.timezone'))->format('d/m/Y'),
            'documento_id' => $doc?->id,
            'detalle_url' => $doc !== null ? '/app/documentos/'.$doc->id.'/observaciones' : null,
            'expediente_url' => $alumno?->id ? '/app/alumnos/'.$alumno->id.'/expediente' : null,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    protected function detalle(DocumentoObservacion $obs): array
    {
        $doc = $obs->documentoAcademico;
        $alumno = $doc?->alumno;

        return [
            'id' => $obs->id,
            'folio' => $this->folioObservacion($obs),
            'alumno' => $this->nombreAlumno($alumno),
            'alumno_id' => $alumno?->id,
            'modulo' => $this->moduloEtiqueta($obs, $doc),
            'texto' => trim((string) $obs->observacion),
            'prioridad' => $this->prioridadEtiqueta((string) $obs->prioridad),
            'estado' => $this->estadoEtiqueta($obs),
            'respuesta' => trim((string) ($obs->respuesta ?? '')),
            'documento_id' => $doc?->id,
            'detalle_url' => $doc !== null ? '/app/documentos/'.$doc->id.'/observaciones' : null,
            'expediente_url' => $alumno?->id ? '/app/alumnos/'.$alumno->id.'/expediente' : null,
        ];
    }

    /**
     * @return list<array{titulo: string, subtitulo: string, activo: bool}>
     */
    protected function historial(DocumentoObservacion $obs): array
    {
        $eventos = [];

        if (trim((string) ($obs->respuesta ?? '')) !== '' && $obs->atendida_at !== null) {
            $eventos[] = [
                'titulo' => 'Observación atendida',
                'subtitulo' => $this->tiempoRelativo($obs->atendida_at)
                    .($obs->atendidaPor?->name ? ' · '.$obs->atendidaPor->name : ''),
                'activo' => true,
            ];
        }

        $eventos[] = [
            'titulo' => 'Creación de observación',
            'subtitulo' => ($obs->creadaPor?->name ?? 'Control Escolar')
                .' · '.$this->tiempoRelativo($obs->created_at),
            'activo' => false,
        ];

        return $eventos;
    }

    protected function folioObservacion(DocumentoObservacion $obs): string
    {
        $year = ($obs->created_at ?? now())->format('Y');

        return 'OBS-'.$year.'-'.str_pad((string) $obs->id, 4, '0', STR_PAD_LEFT);
    }

    protected function moduloEtiqueta(DocumentoObservacion $obs, ?DocumentoAcademico $doc): string
    {
        $seccion = strtolower((string) $obs->seccion);

        return match (true) {
            str_contains($seccion, 'calific') => 'Calificaciones',
            str_contains($seccion, 'inscrip') => 'Inscripciones',
            str_contains($seccion, 'exped') => 'Expediente',
            str_contains($seccion, 'docum') => 'Documentos',
            str_contains($seccion, 'matric') => 'Matrícula',
            default => TipoDocumentoAcademico::tryFrom((string) ($doc?->tipo_documento ?? ''))?->label() ?? 'Documentos',
        };
    }

    protected function prioridadEtiqueta(string $prioridad): string
    {
        return match (strtolower($prioridad)) {
            'baja' => 'Baja',
            'alta' => 'Alta',
            'critica' => 'Alta',
            default => 'Media',
        };
    }

    protected function estadoEtiqueta(DocumentoObservacion $obs): string
    {
        return match ((string) $obs->estado) {
            'atendida' => 'Atendida',
            'descartada' => 'Devuelta',
            default => $this->esVencida($obs)
                ? 'Vencida'
                : ($obs->documentoAcademico?->estado_workflow === EstadoWorkflow::EN_REVISION->value
                    ? 'En revisión'
                    : 'Pendiente'),
        };
    }

    protected function esVencida(DocumentoObservacion $obs): bool
    {
        if ($obs->estado !== 'pendiente' || $obs->created_at === null) {
            return false;
        }

        $created = $obs->created_at instanceof Carbon ? $obs->created_at : Carbon::parse($obs->created_at);

        if ($created->lt(now()->subDays(self::DIAS_VENCIDA))) {
            return true;
        }

        return in_array(strtolower((string) $obs->prioridad), ['alta', 'critica'], true)
            && $created->lt(now()->subDays(self::DIAS_VENCIDA_PRIORIDAD_ALTA));
    }

    protected function nombreAlumno(?Alumno $alumno): string
    {
        if ($alumno === null) {
            return 'Alumno no disponible';
        }

        return trim(implode(' ', array_filter([$alumno->nombre, $alumno->primer_apellido, $alumno->segundo_apellido])));
    }

    protected function tiempoRelativo(?Carbon $fecha): string
    {
        if ($fecha === null) {
            return '—';
        }

        $diff = $fecha->diffForHumans();

        return $diff !== '' ? ucfirst($diff) : '—';
    }
}
