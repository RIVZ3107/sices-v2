<?php

declare(strict_types=1);

namespace App\Services\ControlEscolar;

use App\Enums\Certificacion\EstadoWorkflow;
use App\Enums\Certificacion\TipoDocumentoAcademico;
use App\Models\Alumno;
use App\Models\DocumentoAcademico;
use App\Models\PlantillaDocumento;
use App\Models\User;
use App\Services\Certificacion\CertificacionAlcanceService;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;

class ControlEscolarDocumentosService
{
    public function __construct(
        protected ControlEscolarDashboardService $dashboard,
        protected CertificacionAlcanceService $alcance,
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
                        ->map(fn (DocumentoAcademico $doc) => $this->filaListado($doc))
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
        $enRevision = EstadoWorkflow::EN_REVISION->value;

        $row = $this->queryDocumentos($user)
            ->selectRaw(
                'COUNT(*) as total, '
                .'SUM(CASE WHEN date(created_at) = ? THEN 1 ELSE 0 END) as hoy, '
                .'SUM(CASE WHEN date(created_at) = ? THEN 1 ELSE 0 END) as ayer, '
                .'SUM(CASE WHEN estado_workflow = ? THEN 1 ELSE 0 END) as pendientes, '
                .'SUM(CASE WHEN estado_workflow = ? AND date(updated_at) = ? THEN 1 ELSE 0 END) as pendientes_ayer, '
                ."SUM(CASE WHEN estado_pdf = 'generado' THEN 1 ELSE 0 END) as listos, "
                ."SUM(CASE WHEN estado_pdf = 'generado' AND date(updated_at) = ? THEN 1 ELSE 0 END) as listos_ayer, "
                ."SUM(CASE WHEN token_consulta_publica IS NOT NULL AND token_consulta_publica != '' THEN 1 ELSE 0 END) as consultas",
                [$hoyStr, $ayerStr, $enRevision, $enRevision, $ayerStr, $ayerStr]
            )
            ->first();

        $hoy = (int) ($row?->hoy ?? 0);
        $ayer = (int) ($row?->ayer ?? 0);
        $pendientes = (int) ($row?->pendientes ?? 0);
        $pendientesAyer = (int) ($row?->pendientes_ayer ?? 0);
        $listos = (int) ($row?->listos ?? 0);
        $listosAyer = (int) ($row?->listos_ayer ?? 0);
        $consultas = (int) ($row?->consultas ?? 0);
        $plantillas = PlantillaDocumento::query()->where('activo', true)->count();

        return [
            'generados_hoy' => $hoy,
            'generados_hoy_trend' => $this->trendTexto($hoy, $ayer),
            'generados_hoy_trend_color' => $this->trendColor($hoy, $ayer),
            'pendientes_revision' => $pendientes,
            'pendientes_validacion' => $pendientes,
            'pendientes_validacion_trend' => $this->trendTexto($pendientes, $pendientesAyer),
            'pendientes_validacion_trend_color' => $this->trendColorInvertido($pendientes, $pendientesAyer),
            'consultas_publicas' => $consultas,
            'listos_descarga' => $listos,
            'listos_descarga_trend' => $this->trendTexto($listos, $listosAyer),
            'listos_descarga_trend_color' => $this->trendColor($listos, $listosAyer),
            'plantillas_disponibles' => $plantillas,
            'plantillas_trend' => '— Sin cambios',
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
            ->with(['alumno', 'matricula'])
            ->orderByDesc('updated_at')
            ->orderByDesc('id');

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
    protected function filaListado(DocumentoAcademico $doc): array
    {
        $tipo = TipoDocumentoAcademico::tryFrom((string) $doc->tipo_documento);
        $dt = $doc->updated_at ?? $doc->created_at ?? now();
        $carbon = $dt instanceof Carbon ? $dt : Carbon::parse($dt);

        return [
            'id' => $doc->id,
            'tipo' => $tipo?->label() ?? ucfirst((string) $doc->tipo_documento),
            'sub_tipo' => $this->subTipo($doc),
            'alumno' => $this->nombreAlumno($doc->alumno),
            'matricula' => (string) ($doc->matricula?->matricula ?? '—'),
            'fecha' => $carbon->timezone(config('app.timezone'))->format('d/m/Y'),
            'hora' => $carbon->timezone(config('app.timezone'))->format('h:i a'),
            'estatus' => $this->estatusVisual($doc),
            'color_tipo' => $this->colorTipo((string) $doc->tipo_documento),
            'descargable' => strtolower((string) $doc->estado_pdf) === 'generado',
            'descarga_disponible' => strtolower((string) $doc->estado_pdf) === 'generado',
            'detalle_url' => '/app/documentos/'.$doc->id,
        ];
    }

    protected function estatusVisual(DocumentoAcademico $doc): string
    {
        $wf = EstadoWorkflow::tryFrom((string) $doc->estado_workflow);

        return match ($wf) {
            EstadoWorkflow::APROBADO => 'Concluido',
            EstadoWorkflow::EN_REVISION => 'En revisión',
            EstadoWorkflow::RECHAZADO => 'Rechazado',
            EstadoWorkflow::CANCELADO => 'Cancelado',
            default => 'En proceso',
        };
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
