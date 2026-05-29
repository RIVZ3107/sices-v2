<?php

declare(strict_types=1);

namespace App\Services\ControlEscolar;

use App\Enums\Certificacion\EstadoWorkflow;
use App\Enums\Certificacion\TipoDocumentoAcademico;
use App\Models\Alumno;
use App\Models\DocumentoAcademico;
use App\Models\PlantillaDocumento;
use App\Models\User;
use App\Enums\DocumentosAcademicos\EtapaInstitucionalDocumento;
use App\Services\Certificacion\CertificacionAlcanceService;
use App\Services\DocumentosAcademicos\BandejaEtapaInstitucionalService;
use App\Services\DocumentosAcademicos\DocumentoAcademicoWorkflowService;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;

class ControlEscolarDocumentosService
{
    public function __construct(
        protected ControlEscolarDashboardService $dashboard,
        protected CertificacionAlcanceService $alcance,
        protected DocumentoAcademicoWorkflowService $workflow,
        protected BandejaEtapaInstitucionalService $etapasInstitucionales,
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
                'listado' => [
                    'data' => collect($paginator->items())
                        ->map(fn (DocumentoAcademico $doc) => $this->filaListado($doc, $user))
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
                'plantillas_frecuentes' => $this->plantillasFrecuentes(),
                'accesos_rapidos' => $this->accesosRapidos(),
            ];
        });
    }

    /**
     * @return array{
     *   generados_hoy: int,
     *   generados_hoy_trend: string,
     *   generados_hoy_trend_color: string,
     *   pendientes_validacion: int,
     *   pendientes_validacion_trend: string,
     *   pendientes_validacion_trend_color: string,
     *   listos_descarga: int,
     *   listos_descarga_trend: string,
     *   listos_descarga_trend_color: string,
     *   plantillas_disponibles: int,
     *   plantillas_trend: string
     * }
     */
    protected function metricas(User $user): array
    {
        $hoyStr = today()->toDateString();
        $ayerStr = today()->subDay()->toDateString();
        $captura = $this->contarEtapaCe($user, EtapaInstitucionalDocumento::SOLICITADO_CONTROL_ESCOLAR->value);
        $enviadas = $this->contarEtapaCe($user, EtapaInstitucionalDocumento::EN_VALIDACION_CERTIFICADOR->value);
        $observadas = $this->contarEtapaCe($user, EtapaInstitucionalDocumento::OBSERVADO_POR_CERTIFICADOR->value);
        $rechazadas = $this->queryDocumentos($user)
            ->whereIn('estado_workflow', [EstadoWorkflow::RECHAZADO->value, EstadoWorkflow::CANCELADO->value])
            ->count();

        $hoy = $this->queryDocumentos($user)->whereDate('created_at', $hoyStr)->count();
        $ayer = $this->queryDocumentos($user)->whereDate('created_at', $ayerStr)->count();

        return [
            'solicitudes_en_captura' => $captura,
            'enviadas_validacion' => $enviadas,
            'observadas' => $observadas,
            'rechazadas_canceladas' => $rechazadas,
            'generados_hoy' => $hoy,
            'generados_hoy_trend' => $this->trendTexto($hoy, $ayer),
            'generados_hoy_trend_color' => $this->trendColor($hoy, $ayer),
            'pendientes_revision' => $enviadas,
            'pendientes_validacion' => $enviadas,
            'pendientes_validacion_trend' => "{$enviadas} en validación del certificador",
            'pendientes_validacion_trend_color' => '#BA7517',
            'consultas_publicas' => 0,
            'listos_descarga' => 0,
            'listos_descarga_trend' => '—',
            'listos_descarga_trend_color' => '#94a3b8',
            'plantillas_disponibles' => 0,
            'plantillas_trend' => '—',
        ];
    }

    /**
     * @return list<array{nombre: string, versiones: string}>
     */
    protected function plantillasFrecuentes(): array
    {
        return PlantillaDocumento::query()
            ->where('activo', true)
            ->orderBy('tipo_documento')
            ->orderBy('nombre')
            ->get()
            ->groupBy('nombre')
            ->map(function ($grupo, string $nombre): array {
                $count = $grupo->count();
                $tipo = TipoDocumentoAcademico::tryFrom((string) $grupo->first()?->tipo_documento);

                return [
                    'nombre' => $tipo?->label() ?? $nombre,
                    'versiones' => $count === 1 ? '1 versión' : "{$count} versiones",
                ];
            })
            ->values()
            ->take(5)
            ->all();
    }

    /**
     * @return list<array{nombre: string, ruta: string}>
     */
    protected function accesosRapidos(): array
    {
        return [
            ['nombre' => 'Configuración de plantillas', 'ruta' => '/app/plantillas'],
            ['nombre' => 'Catálogo de documentos', 'ruta' => '/app/documentos'],
            ['nombre' => 'Permisos y visibilidad', 'ruta' => '/app/admin/roles'],
        ];
    }

    /**
     * @return Builder<DocumentoAcademico>
     */
    protected function queryListado(User $user, ?string $search): Builder
    {
        $query = $this->queryDocumentos($user)
            ->with(['alumno', 'matricula', 'institucion', 'subsistema'])
            ->withCount([
                'observaciones as observaciones_pendientes_count' => fn (Builder $sub) => $sub->where('estado', 'pendiente'),
            ]);

        $this->etapasInstitucionales->aplicarAlcanceEtapasPorRol($query, $user);

        $query->orderByDesc('updated_at')->orderByDesc('id');

        $term = trim((string) $search);
        if ($term !== '') {
            $like = '%'.$term.'%';
            $query->where(function (Builder $q) use ($like): void {
                $q->where('folio_interno', 'like', $like)
                    ->orWhere('tipo_documento', 'like', $like)
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
     * @return Builder<DocumentoAcademico>
     */
    protected function queryDocumentos(User $user): Builder
    {
        $query = DocumentoAcademico::query();
        $this->alcance->aplicarAlcanceDocumentosAcademicos($query, $user);

        return $query;
    }

    protected function contarEtapaCe(User $user, string $etapa): int
    {
        $q = $this->queryDocumentos($user);
        $this->etapasInstitucionales->aplicarFiltroEtapaInstitucional($q, $etapa);

        return (int) $q->count();
    }

    /**
     * @return array{
     *   id: int,
     *   tipo: string,
     *   sub_tipo: string,
     *   alumno: string,
     *   matricula: string,
     *   fecha: string,
     *   hora: string,
     *   estatus: string,
     *   color_tipo: string,
     *   descargable: bool
     * }
     */
    protected function filaListado(DocumentoAcademico $doc, ?User $user = null): array
    {
        $tipo = TipoDocumentoAcademico::tryFrom((string) $doc->tipo_documento);
        $dt = $doc->updated_at ?? $doc->created_at ?? now();
        $carbon = $dt instanceof Carbon ? $dt : Carbon::parse($dt);
        $workflowResumen = $this->workflow->armarWorkflowResumen($doc, $user);

        return [
            'id' => $doc->id,
            'tipo' => $tipo?->label() ?? ucfirst((string) $doc->tipo_documento),
            'sub_tipo' => $this->subTipo($doc),
            'alumno' => $this->nombreAlumno($doc->alumno),
            'curp' => $doc->alumno?->curp,
            'matricula' => (string) ($doc->matricula?->matricula ?? '—'),
            'institucion' => $doc->institucion?->nombre,
            'subsistema' => $doc->subsistema?->nombre_corto ?? $doc->subsistema?->clave,
            'fecha' => $carbon->timezone(config('app.timezone'))->format('d/m/Y'),
            'hora' => $carbon->timezone(config('app.timezone'))->format('h:i a'),
            'estatus' => $workflowResumen['etapa_label'],
            'etapa_institucional' => $workflowResumen['etapa'],
            'workflow_resumen' => $workflowResumen,
            'siguiente_accion' => $workflowResumen['siguiente_accion_principal']['label'] ?? null,
            'color_tipo' => $this->colorTipo((string) $doc->tipo_documento),
            'detalle_url' => '/app/documentos/'.$doc->id,
        ];
    }

    protected function subTipo(DocumentoAcademico $doc): string
    {
        $folio = trim((string) ($doc->folio_interno ?? ''));
        if ($folio !== '') {
            return $folio;
        }

        return TipoDocumentoAcademico::tryFrom((string) $doc->tipo_documento)?->label() ?? 'Documento';
    }

    protected function colorTipo(string $tipo): string
    {
        return match ($tipo) {
            'titulo' => '#185FA5',
            'grado' => '#0F6E56',
            default => '#534AB7',
        };
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

    protected function trendTexto(int $actual, int $anterior): string
    {
        if ($anterior === 0) {
            return $actual > 0 ? '↑ Nuevos registros hoy' : '— Sin cambios';
        }

        $pct = (int) round((($actual - $anterior) / $anterior) * 100);
        $signo = $pct >= 0 ? '↑' : '↓';

        return "{$signo} ".abs($pct).'% vs. día anterior';
    }

    protected function trendColor(int $actual, int $anterior): string
    {
        if ($actual === $anterior) {
            return '#94a3b8';
        }

        return $actual >= $anterior ? '#0F6E56' : '#991B1B';
    }

    protected function trendColorInvertido(int $actual, int $anterior): string
    {
        if ($actual === $anterior) {
            return '#94a3b8';
        }

        return $actual <= $anterior ? '#0F6E56' : '#991B1B';
    }
}
