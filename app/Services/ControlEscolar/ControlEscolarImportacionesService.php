<?php

declare(strict_types=1);

namespace App\Services\ControlEscolar;

use App\Models\Alumno;
use App\Models\ImportacionHistoricaMaterias;
use App\Models\OfertaAcademica;
use App\Models\User;
use App\Services\Certificacion\CertificacionAlcanceService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Str;

class ControlEscolarImportacionesService
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

        return $this->dashboard->conAlcanceUsuario($user, function () use ($user, $search, $page, $perPage): array {
            $metricas = $this->metricas($user);
            $query = $this->queryListado($user, $search);
            $paginator = $query->paginate($perPage, ['*'], 'page', $page);

            $filas = collect($paginator->items())
                ->map(fn (ImportacionHistoricaMaterias $imp) => $this->filaListado($imp))
                ->values()
                ->all();

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
                'errores_frecuentes' => $this->erroresFrecuentes($user),
            ];
        });
    }

    /**
     * @return array{
     *   recientes: int,
     *   recientes_trend: string,
     *   recientes_trend_color: string,
     *   prevalidadas: int,
     *   prevalidadas_trend: string,
     *   prevalidadas_trend_color: string,
     *   con_errores: int,
     *   con_errores_trend: string,
     *   con_errores_trend_color: string,
     *   pendientes: int,
     *   pendientes_trend: string,
     *   pendientes_trend_color: string
     * }
     */
    protected function metricas(User $user): array
    {
        $base = $this->queryBase($user);
        $desde30 = now()->subDays(30);

        $recientes = (clone $base)->where('created_at', '>=', $desde30)->count();
        $prevalidadas = (clone $base)->where('estado', 'pre_validada')->count();
        $conErrores = (clone $base)->where(function (Builder $q): void {
            $q->whereIn('estado', ['error', 'rechazada'])
                ->orWhere('validacion_payload->tiene_bloqueos', true);
        })->count();
        $pendientes = (clone $base)->whereIn('estado', ['borrador', 'pendiente', 'pendiente_conciliacion'])->count();

        return [
            'recientes' => $recientes,
            'recientes_trend' => 'Últimos 30 días',
            'recientes_trend_color' => '#185FA5',
            'prevalidadas' => $prevalidadas,
            'prevalidadas_trend' => 'Listas para conciliar',
            'prevalidadas_trend_color' => '#0F6E56',
            'con_errores' => $conErrores,
            'con_errores_trend' => 'Requieren corrección',
            'con_errores_trend_color' => '#991B1B',
            'pendientes' => $pendientes,
            'pendientes_trend' => 'En cola operativa',
            'pendientes_trend_color' => '#BA7517',
        ];
    }

    /**
     * @return Builder<ImportacionHistoricaMaterias>
     */
    protected function queryBase(User $user): Builder
    {
        $ofertas = OfertaAcademica::query();
        $this->alcance->aplicarAlcanceOfertasAcademicas($ofertas, $user);
        $ids = $ofertas->pluck('id');

        return ImportacionHistoricaMaterias::query()
            ->whereHas('matricula', fn (Builder $mat) => $mat->whereIn('oferta_academica_id', $ids));
    }

    /**
     * @return Builder<ImportacionHistoricaMaterias>
     */
    protected function queryListado(User $user, ?string $search): Builder
    {
        $query = $this->queryBase($user)
            ->with([
                'matricula.alumno:id,nombre,primer_apellido,segundo_apellido',
                'matricula:id,matricula,alumno_id,oferta_academica_id',
                'matricula.ofertaAcademica.planEstudio.programaEstudio:id,nombre,clave',
                'user:id,name',
            ])
            ->orderByDesc('updated_at')
            ->orderByDesc('id');

        $term = trim((string) $search);
        if ($term !== '') {
            $like = '%'.$term.'%';
            $folioId = $this->resolverImportacionIdDesdeFolio($term);
            $query->where(function (Builder $q) use ($like, $folioId, $term): void {
                $q->whereHas('matricula', fn (Builder $m) => $m->where('matricula', 'like', $like))
                    ->orWhereHas('matricula.alumno', function (Builder $a) use ($like): void {
                        $a->where('nombre', 'like', $like)
                            ->orWhere('primer_apellido', 'like', $like)
                            ->orWhere('segundo_apellido', 'like', $like);
                    })
                    ->orWhereHas('matricula.ofertaAcademica.planEstudio.programaEstudio', function (Builder $p) use ($like): void {
                        $p->where('nombre', 'like', $like)->orWhere('clave', 'like', $like);
                    });
                if ($folioId !== null) {
                    $q->orWhere('id', $folioId);
                }
                if (ctype_digit($term)) {
                    $q->orWhere('id', (int) $term);
                }
            });
        }

        return $query;
    }

    /**
     * @return list<array{label: string, n: int}>
     */
    protected function erroresFrecuentes(User $user): array
    {
        $conteos = [];

        $this->queryBase($user)
            ->where(function (Builder $q): void {
                $q->whereIn('estado', ['error', 'rechazada'])
                    ->orWhere('validacion_payload->tiene_bloqueos', true);
            })
            ->orderByDesc('updated_at')
            ->limit(40)
            ->get(['validacion_payload'])
            ->each(function (ImportacionHistoricaMaterias $imp) use (&$conteos): void {
                $payload = (array) ($imp->validacion_payload ?? []);
                $errores = $payload['errores'] ?? $payload['mensajes'] ?? [];
                if (! is_array($errores)) {
                    return;
                }
                foreach ($errores as $msg) {
                    $label = trim((string) $msg);
                    if ($label === '') {
                        continue;
                    }
                    $key = Str::limit($label, 80, '');
                    $conteos[$key] = ($conteos[$key] ?? 0) + 1;
                }
            });

        arsort($conteos);

        return collect($conteos)
            ->take(6)
            ->map(fn (int $n, string $label) => ['label' => $label, 'n' => $n])
            ->values()
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    protected function filaListado(ImportacionHistoricaMaterias $imp): array
    {
        $alumno = $imp->matricula?->alumno;
        $programa = $imp->matricula?->ofertaAcademica?->planEstudio?->programaEstudio;
        $meta = (array) ($imp->metadata ?? []);
        $validacion = (array) ($imp->validacion_payload ?? []);
        $errores = $this->contarErrores($imp, $validacion);

        return [
            'id' => $imp->id,
            'folio' => $this->folioImportacion($imp),
            'archivo' => $this->nombreArchivo($imp, $meta),
            'alumno' => $this->etiquetaAlumnoPrograma($alumno, $programa?->nombre),
            'registros' => $this->contarRegistros($imp),
            'errores' => $errores,
            'estado' => $this->estadoEtiqueta((string) $imp->estado, $validacion),
            'detalle_url' => '/app/importaciones',
            'importacion_id' => $imp->id,
        ];
    }

    protected function folioImportacion(ImportacionHistoricaMaterias $imp): string
    {
        $year = ($imp->created_at ?? now())->format('Y');

        return 'IMP-'.$year.'-'.str_pad((string) $imp->id, 4, '0', STR_PAD_LEFT);
    }

    /**
     * @param  array<string, mixed>  $meta
     */
    protected function nombreArchivo(ImportacionHistoricaMaterias $imp, array $meta): string
    {
        foreach (['nombre_archivo', 'archivo', 'archivo_origen', 'filename'] as $key) {
            $nombre = trim((string) ($meta[$key] ?? ''));
            if ($nombre !== '') {
                return $nombre;
            }
        }

        $tipo = trim((string) ($meta['tipo_importacion'] ?? 'historial'));

        return 'importacion_'.$tipo.'_'.$imp->id.'.json';
    }

    protected function etiquetaAlumnoPrograma(?Alumno $alumno, ?string $programa): string
    {
        $nombre = $this->nombreAlumno($alumno);
        $prog = trim((string) $programa);

        if ($prog !== '' && $nombre !== 'Alumno no disponible') {
            return $nombre.' / '.$prog;
        }

        return $nombre !== 'Alumno no disponible' ? $nombre : ($prog !== '' ? $prog : 'Varios');
    }

    protected function contarRegistros(ImportacionHistoricaMaterias $imp): int
    {
        $filas = $imp->filas_payload;
        if (is_array($filas)) {
            return count($filas);
        }

        $recon = (array) ($imp->reconciliacion_payload ?? []);

        return (int) ($recon['total_filas'] ?? $recon['registros'] ?? 0);
    }

    /**
     * @param  array<string, mixed>  $validacion
     */
    protected function contarErrores(ImportacionHistoricaMaterias $imp, array $validacion): int
    {
        if (in_array((string) $imp->estado, ['error', 'rechazada'], true)) {
            $errores = $validacion['errores'] ?? [];

            return is_array($errores) ? count($errores) : 1;
        }

        if ((bool) ($validacion['tiene_bloqueos'] ?? false)) {
            return (int) ($validacion['total_errores'] ?? $validacion['errores_count'] ?? 1);
        }

        $errores = $validacion['errores'] ?? [];

        return is_array($errores) ? count($errores) : 0;
    }

    /**
     * @param  array<string, mixed>  $validacion
     */
    protected function estadoEtiqueta(string $estado, array $validacion): string
    {
        if (in_array($estado, ['error', 'rechazada'], true) || (bool) ($validacion['tiene_bloqueos'] ?? false)) {
            return 'Con errores';
        }

        return match ($estado) {
            'pre_validada' => 'Prevalidada',
            'confirmada' => 'Completada',
            'borrador' => 'Pendiente',
            'pendiente', 'pendiente_conciliacion' => 'Pendiente de conciliación',
            'cancelada' => 'Cancelada',
            default => ucfirst(str_replace('_', ' ', $estado)),
        };
    }

    protected function resolverImportacionIdDesdeFolio(string $term): ?int
    {
        if (preg_match('/IMP-\d{4}-(\d+)/i', $term, $m) === 1) {
            return (int) $m[1];
        }

        return null;
    }

    protected function nombreAlumno(?Alumno $alumno): string
    {
        if ($alumno === null) {
            return 'Alumno no disponible';
        }

        return trim(implode(' ', array_filter([$alumno->nombre, $alumno->primer_apellido, $alumno->segundo_apellido])));
    }
}
