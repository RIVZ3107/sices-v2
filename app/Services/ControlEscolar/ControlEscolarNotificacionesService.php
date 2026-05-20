<?php

declare(strict_types=1);

namespace App\Services\ControlEscolar;

use App\Enums\Certificacion\EstadoWorkflow;
use App\Enums\Certificacion\TipoDocumentoAcademico;
use App\Models\Alumno;
use App\Models\DocumentoAcademico;
use App\Models\DocumentoEstadoHistorial;
use App\Models\DocumentoObservacion;
use App\Models\ImportacionHistoricaMaterias;
use App\Models\InscripcionPeriodo;
use App\Models\OfertaAcademica;
use App\Models\SolicitudMatricula;
use App\Models\User;
use App\Services\Certificacion\CertificacionAlcanceService;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class ControlEscolarNotificacionesService
{
    private const LIMITE_POR_FUENTE = 80;

    private const DIAS_RECORDATORIO = 7;

    /** @var list<string> */
    private const CATEGORIAS_ORDEN = [
        'Todas las notificaciones',
        'Académicas',
        'Administrativas',
        'Documentos',
        'Sistema',
        'Inscripciones',
        'Reinscripciones',
        'Solicitudes',
    ];

    public function __construct(
        protected ControlEscolarDashboardService $dashboard,
        protected CertificacionAlcanceService $alcance,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function gestion(
        User $user,
        ?string $search,
        ?string $categoria,
        int $page,
        int $perPage,
        ?string $notificacionId,
    ): array {
        $perPage = max(1, min(50, $perPage));
        $page = max(1, $page);

        return $this->dashboard->conAlcanceUsuario($user, function () use ($user, $search, $categoria, $page, $perPage, $notificacionId): array {
            $filas = $this->recolectarFilas($user, $search);
            $categoriaFiltro = $this->normalizarCategoriaFiltro($categoria);

            if ($categoriaFiltro !== null) {
                $filas = $filas->filter(
                    fn (array $f) => strcasecmp((string) ($f['categoria'] ?? ''), $categoriaFiltro) === 0
                )->values();
            }

            $metricas = $this->metricasDesdeFilas($filas);
            $categorias = $this->conteosCategorias($this->recolectarFilas($user, null));

            $total = $filas->count();
            $slice = $filas->forPage($page, $perPage)->values();

            $seleccionada = $this->resolverSeleccion($notificacionId, $slice->all(), $filas);

            return [
                'actualizado_en' => now()->toIso8601String(),
                'metricas' => $metricas,
                'categorias' => $categorias,
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
                'detalle' => $seleccionada !== null ? $this->detalle($seleccionada) : null,
            ];
        });
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    protected function recolectarFilas(User $user, ?string $search): Collection
    {
        $filas = collect();
        $termLower = strtolower(trim((string) $search));

        foreach ($this->queryObservaciones($user)->get() as $obs) {
            $fila = $this->filaDesdeObservacion($obs);
            if ($this->coincideBusqueda($fila, $termLower)) {
                $filas->push($fila);
            }
        }

        foreach ($this->queryHistorialWorkflow($user)->get() as $hist) {
            $fila = $this->filaDesdeHistorial($hist);
            if ($fila !== null && $this->coincideBusqueda($fila, $termLower)) {
                $filas->push($fila);
            }
        }

        if ($user->can('ver_solicitud_matricula') || $user->can('solicitudes_matricula.ver')) {
            foreach ($this->querySolicitudesMatricula($user)->get() as $s) {
                $fila = $this->filaDesdeSolicitudMatricula($s);
                if ($this->coincideBusqueda($fila, $termLower)) {
                    $filas->push($fila);
                }
            }
        }

        foreach ($this->queryInscripciones($user)->get() as $ins) {
            $fila = $this->filaDesdeInscripcion($ins);
            if ($this->coincideBusqueda($fila, $termLower)) {
                $filas->push($fila);
            }
        }

        foreach ($this->queryImportaciones($user)->get() as $imp) {
            $fila = $this->filaDesdeImportacion($imp);
            if ($fila !== null && $this->coincideBusqueda($fila, $termLower)) {
                $filas->push($fila);
            }
        }

        return $filas
            ->unique('id')
            ->sortByDesc(fn (array $f) => $f['fecha_iso'] ?? '')
            ->values();
    }

    /**
     * @return Builder<DocumentoObservacion>
     */
    protected function queryObservaciones(User $user): Builder
    {
        $query = DocumentoObservacion::query()
            ->whereHas('documentoAcademico', function (Builder $doc) use ($user): void {
                $this->alcance->aplicarAlcanceDocumentosAcademicos($doc, $user);
            })
            ->with([
                'documentoAcademico.alumno:id,nombre,primer_apellido,segundo_apellido',
                'documentoAcademico.matricula:id,matricula,alumno_id',
                'creadaPor:id,name',
            ])
            ->orderByDesc('created_at')
            ->limit(self::LIMITE_POR_FUENTE);

        return $query;
    }

    /**
     * @return Builder<DocumentoEstadoHistorial>
     */
    protected function queryHistorialWorkflow(User $user): Builder
    {
        return DocumentoEstadoHistorial::query()
            ->where('campo', 'estado_workflow')
            ->whereHas('documentoAcademico', function (Builder $doc) use ($user): void {
                $this->alcance->aplicarAlcanceDocumentosAcademicos($doc, $user);
            })
            ->with([
                'documentoAcademico.alumno:id,nombre,primer_apellido,segundo_apellido',
                'documentoAcademico.matricula:id,matricula,alumno_id',
                'changedBy:id,name',
            ])
            ->orderByDesc('created_at')
            ->limit(self::LIMITE_POR_FUENTE);
    }

    /**
     * @return Builder<SolicitudMatricula>
     */
    protected function querySolicitudesMatricula(User $user): Builder
    {
        $q = SolicitudMatricula::query()
            ->with(['alumno.matriculaActiva:id,matricula,alumno_id'])
            ->whereNotIn('estado', [SolicitudMatricula::ESTADO_BORRADOR, SolicitudMatricula::ESTADO_CANCELADA])
            ->orderByDesc('updated_at')
            ->limit(self::LIMITE_POR_FUENTE);

        if ($user->hasAnyRole(['superadmin', 'admin', 'educacion_superior'])) {
            return $q;
        }

        $ofertas = OfertaAcademica::query();
        $this->alcance->aplicarAlcanceOfertasAcademicas($ofertas, $user);

        return $q->whereIn('oferta_academica_id', $ofertas->pluck('id'));
    }

    /**
     * @return Builder<InscripcionPeriodo>
     */
    protected function queryInscripciones(User $user): Builder
    {
        return InscripcionPeriodo::query()
            ->with(['matricula.alumno:id,nombre,primer_apellido,segundo_apellido'])
            ->whereHas('matricula', function (Builder $mat) use ($user): void {
                $mat->whereHas('alumno', function (Builder $alumno) use ($user): void {
                    $alumno->whereIn('id', $this->dashboard->queryAlumnosEnAlcance($user)->select('id'));
                });
            })
            ->where('created_at', '>=', now()->subDays(120))
            ->orderByDesc('created_at')
            ->limit(self::LIMITE_POR_FUENTE);
    }

    /**
     * @return Builder<ImportacionHistoricaMaterias>
     */
    protected function queryImportaciones(User $user): Builder
    {
        return ImportacionHistoricaMaterias::query()
            ->with(['matricula.alumno:id,nombre,primer_apellido,segundo_apellido', 'user:id,name'])
            ->whereHas('matricula', function (Builder $mat) use ($user): void {
                $mat->whereHas('alumno', function (Builder $alumno) use ($user): void {
                    $alumno->whereIn('id', $this->dashboard->queryAlumnosEnAlcance($user)->select('id'));
                });
            })
            ->orderByDesc('updated_at')
            ->limit(self::LIMITE_POR_FUENTE);
    }

    /**
     * @return array<string, mixed>
     */
    protected function filaDesdeObservacion(DocumentoObservacion $obs): array
    {
        $doc = $obs->documentoAcademico;
        $alumno = $doc?->alumno;
        $dt = $obs->created_at ?? now();
        $categoria = $this->categoriaDesdeModulo($obs, $doc);
        $prioridad = $this->prioridadEtiqueta((string) $obs->prioridad);
        $pendiente = (string) $obs->estado === 'pendiente';

        return $this->armarFila(
            id: 'obs-'.$obs->id,
            tipo: $pendiente ? 'alert_triangle' : 'info',
            categoria: $categoria,
            titulo: $pendiente ? 'Observación pendiente en expediente' : 'Observación atendida',
            subtitulo: Str::limit(trim((string) $obs->observacion), 120),
            alumno: $alumno,
            matricula: (string) ($doc?->matricula?->matricula ?? ''),
            fecha: $dt,
            prioridad: $prioridad,
            leida: ! $pendiente,
            automatica: false,
            critica: in_array(strtolower((string) $obs->prioridad), ['alta', 'critica'], true),
            recordatorio: $pendiente,
            fuente: $obs->creadaPor?->name ?? 'Control Escolar',
            expediente_url: $alumno?->id ? '/app/alumnos/'.$alumno->id.'/expediente' : null,
            motivo: trim((string) $obs->observacion),
            acciones: $pendiente
                ? ['Revisar la observación en el expediente del alumno.']
                : [],
        );
    }

    /**
     * @return array<string, mixed>|null
     */
    protected function filaDesdeHistorial(DocumentoEstadoHistorial $hist): ?array
    {
        $nuevo = strtolower((string) $hist->estado_nuevo);
        if (! in_array($nuevo, [
            EstadoWorkflow::RECHAZADO->value,
            EstadoWorkflow::EN_REVISION->value,
            EstadoWorkflow::APROBADO->value,
            EstadoWorkflow::PENDIENTE->value,
        ], true)) {
            return null;
        }

        $doc = $hist->documentoAcademico;
        $alumno = $doc?->alumno;
        $dt = $hist->created_at ?? now();
        $tipoDoc = TipoDocumentoAcademico::tryFrom((string) ($doc?->tipo_documento ?? ''))?->label()
            ?? 'Documento académico';

        [$titulo, $tipo, $prioridad, $critica] = match ($nuevo) {
            EstadoWorkflow::RECHAZADO->value => ['Documento rechazado', 'alert_triangle', 'Alta', true],
            EstadoWorkflow::EN_REVISION->value => ['Documento en revisión', 'clock', 'Media', false],
            EstadoWorkflow::APROBADO->value => ['Documento aprobado', 'check_circle', 'Baja', false],
            default => ['Cambio de estatus en documento', 'file_text', 'Media', false],
        };

        $leida = $nuevo === EstadoWorkflow::APROBADO->value
            || ($hist->created_at !== null && Carbon::parse($hist->created_at)->lt(now()->subDays(14)));

        return $this->armarFila(
            id: 'hist-'.$hist->id,
            tipo: $tipo,
            categoria: 'Documentos',
            titulo: $titulo,
            subtitulo: $tipoDoc.($hist->motivo ? ': '.Str::limit((string) $hist->motivo, 80) : ''),
            alumno: $alumno,
            matricula: (string) ($doc?->matricula?->matricula ?? ''),
            fecha: $dt,
            prioridad: $prioridad,
            leida: $leida,
            automatica: true,
            critica: $critica,
            recordatorio: $nuevo === EstadoWorkflow::EN_REVISION->value,
            fuente: $hist->changedBy?->name ?? 'Sistema',
            expediente_url: $alumno?->id ? '/app/alumnos/'.$alumno->id.'/expediente' : null,
            motivo: trim((string) ($hist->motivo ?? '')),
            acciones: $nuevo === EstadoWorkflow::RECHAZADO->value
                ? ['Carga un nuevo documento desde el expediente del alumno.']
                : [],
        );
    }

    /**
     * @return array<string, mixed>
     */
    protected function filaDesdeSolicitudMatricula(SolicitudMatricula $s): array
    {
        $alumno = $s->alumno;
        $dt = $s->updated_at ?? $s->created_at ?? now();
        $estado = (string) $s->estado;

        [$titulo, $tipo, $prioridad, $leida, $critica] = match ($estado) {
            SolicitudMatricula::ESTADO_RECHAZADA => ['Solicitud de matrícula rechazada', 'alert_triangle', 'Alta', true, true],
            SolicitudMatricula::ESTADO_CON_OBSERVACIONES => ['Solicitud con observaciones', 'alert_triangle', 'Alta', false, true],
            SolicitudMatricula::ESTADO_EN_REVISION, SolicitudMatricula::ESTADO_ENVIADA => ['Solicitud de matrícula en revisión', 'clock', 'Media', false, false],
            SolicitudMatricula::ESTADO_MATRICULA_ASIGNADA => ['Matrícula asignada', 'check_circle', 'Baja', true, false],
            SolicitudMatricula::ESTADO_APROBADA => ['Solicitud de matrícula aprobada', 'check_circle', 'Baja', true, false],
            default => ['Actualización en solicitud de matrícula', 'file_text', 'Media', false, false],
        };

        return $this->armarFila(
            id: 'sol-'.$s->id,
            tipo: $tipo,
            categoria: 'Solicitudes',
            titulo: $titulo,
            subtitulo: trim((string) ($s->observaciones ?: $s->motivo_rechazo ?: 'Solicitud de matrícula')),
            alumno: $alumno,
            matricula: (string) ($alumno?->matriculaActiva?->matricula ?? ''),
            fecha: $dt,
            prioridad: $prioridad,
            leida: $leida,
            automatica: false,
            critica: $critica,
            recordatorio: in_array($estado, [SolicitudMatricula::ESTADO_ENVIADA, SolicitudMatricula::ESTADO_EN_REVISION], true),
            fuente: 'Solicitudes de matrícula',
            expediente_url: $alumno?->id ? '/app/alumnos/'.$alumno->id.'/expediente' : '/app/control-escolar/solicitudes',
            motivo: trim((string) ($s->motivo_rechazo ?? $s->observaciones ?? '')),
            acciones: $estado === SolicitudMatricula::ESTADO_CON_OBSERVACIONES
                ? ['Atiende las observaciones y vuelve a enviar la solicitud.']
                : [],
        );
    }

    /**
     * @return array<string, mixed>
     */
    protected function filaDesdeInscripcion(InscripcionPeriodo $ins): array
    {
        $alumno = $ins->matricula?->alumno;
        $dt = $ins->created_at ?? now();
        $meta = (array) ($ins->metadata ?? []);
        $esReinscripcion = str_contains(strtolower(json_encode($meta, JSON_THROW_ON_ERROR)), 'reinscri');

        return $this->armarFila(
            id: 'ins-'.$ins->id,
            tipo: 'file_text',
            categoria: $esReinscripcion ? 'Reinscripciones' : 'Inscripciones',
            titulo: $esReinscripcion ? 'Reinscripción registrada' : 'Nueva inscripción registrada',
            subtitulo: 'Se completó el registro en el periodo escolar.',
            alumno: $alumno,
            matricula: (string) ($ins->matricula?->matricula ?? ''),
            fecha: $dt,
            prioridad: 'Media',
            leida: $dt instanceof Carbon ? $dt->lt(now()->subDays(30)) : false,
            automatica: true,
            critica: false,
            recordatorio: false,
            fuente: 'Inscripciones',
            expediente_url: $alumno?->id ? '/app/alumnos/'.$alumno->id.'/expediente' : '/app/control-escolar/inscripciones',
            motivo: '',
            acciones: [],
        );
    }

    /**
     * @return array<string, mixed>|null
     */
    protected function filaDesdeImportacion(ImportacionHistoricaMaterias $imp): ?array
    {
        $estado = strtolower((string) $imp->estado);
        $validacion = (array) ($imp->validacion_payload ?? []);
        $errores = (int) ($validacion['errores'] ?? $validacion['total_errores'] ?? 0);
        $tieneErrores = $errores > 0 || str_contains($estado, 'error');

        if (! $tieneErrores && ! in_array($estado, ['validada', 'confirmada', 'prevalidada'], true)) {
            return null;
        }

        $alumno = $imp->matricula?->alumno;
        $dt = $imp->updated_at ?? $imp->created_at ?? now();

        return $this->armarFila(
            id: 'imp-'.$imp->id,
            tipo: $tieneErrores ? 'alert_triangle' : 'info',
            categoria: 'Sistema',
            titulo: $tieneErrores ? 'Importación con errores' : 'Importación procesada',
            subtitulo: $tieneErrores
                ? "Se detectaron {$errores} error(es) en la validación."
                : 'La importación histórica fue procesada correctamente.',
            alumno: $alumno,
            matricula: (string) ($imp->matricula?->matricula ?? ''),
            fecha: $dt,
            prioridad: $tieneErrores ? 'Alta' : 'Baja',
            leida: ! $tieneErrores,
            automatica: true,
            critica: $tieneErrores,
            recordatorio: false,
            fuente: $imp->user?->name ?? 'Sistema',
            expediente_url: $alumno?->id ? '/app/alumnos/'.$alumno->id.'/expediente' : '/app/control-escolar/importaciones',
            motivo: $tieneErrores ? 'Revisa el archivo importado y corrige los registros con error.' : '',
            acciones: $tieneErrores ? ['Concilia o corrige el archivo antes de confirmar la importación.'] : [],
        );
    }

    /**
     * @param  list<string>  $acciones
     * @return array<string, mixed>
     */
    protected function armarFila(
        string $id,
        string $tipo,
        string $categoria,
        string $titulo,
        string $subtitulo,
        ?Alumno $alumno,
        string $matricula,
        mixed $fecha,
        string $prioridad,
        bool $leida,
        bool $automatica,
        bool $critica,
        bool $recordatorio,
        string $fuente,
        ?string $expediente_url,
        string $motivo,
        array $acciones,
    ): array {
        $carbon = $fecha instanceof Carbon ? $fecha : Carbon::parse($fecha);
        $tz = config('app.timezone');
        $nombre = $this->nombreAlumno($alumno);

        return [
            'id' => $id,
            'tipo' => $tipo,
            'categoria' => $categoria,
            'titulo' => $titulo,
            'subtitulo' => $subtitulo,
            'alumno' => $nombre !== 'Sistema' ? $nombre : 'Sistema',
            'matricula' => $matricula,
            'fecha' => $carbon->timezone($tz)->format('d/m/Y'),
            'hora' => $carbon->timezone($tz)->format('h:i a'),
            'fecha_iso' => $carbon->toIso8601String(),
            'prioridad' => $prioridad,
            'leida' => $leida,
            'automatica' => $automatica,
            'critica' => $critica,
            'recordatorio' => $recordatorio,
            'fuente' => $fuente,
            'expediente_url' => $expediente_url,
            'motivo' => $motivo,
            'acciones' => $acciones,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    protected function detalle(array $fila): array
    {
        return [
            'id' => $fila['id'],
            'titulo' => $fila['titulo'],
            'subtitulo' => $fila['subtitulo'],
            'categoria' => $fila['categoria'],
            'prioridad' => $fila['prioridad'],
            'alumno' => $fila['alumno'],
            'matricula' => $fila['matricula'],
            'fecha' => ($fila['fecha'] ?? '').' '.($fila['hora'] ?? ''),
            'fuente' => $fila['fuente'],
            'motivo' => $fila['motivo'] ?? '',
            'acciones' => $fila['acciones'] ?? [],
            'expediente_url' => $fila['expediente_url'] ?? null,
            'leida' => (bool) ($fila['leida'] ?? false),
        ];
    }

    /**
     * @param  list<array<string, mixed>>  $paginaActual
     * @param  Collection<int, array<string, mixed>>  $todas
     * @return array<string, mixed>|null
     */
    protected function resolverSeleccion(?string $notificacionId, array $paginaActual, Collection $todas): ?array
    {
        if ($notificacionId !== null && $notificacionId !== '') {
            $found = $todas->firstWhere('id', $notificacionId);
            if ($found !== null) {
                return $found;
            }
        }

        return $paginaActual[0] ?? null;
    }

    /**
     * @param  Collection<int, array<string, mixed>>  $filas
     * @return array<string, int|mixed>
     */
    protected function metricasDesdeFilas(Collection $filas): array
    {
        $total = $filas->count();
        $noLeidas = $filas->where('leida', false)->count();
        $criticas = $filas->where('critica', true)->where('leida', false)->count();
        $recordatorios = $filas->where('recordatorio', true)->where('leida', false)->count();
        $automaticas = $filas->where('automatica', true)->count();

        return [
            'no_leidas' => $noLeidas,
            'no_leidas_trend' => $total > 0 ? "de {$total} notificaciones" : 'sin notificaciones',
            'criticas' => $criticas,
            'criticas_trend' => 'requieren atención',
            'recordatorios' => $recordatorios,
            'recordatorios_trend' => 'pendientes de seguimiento',
            'automaticas' => $automaticas,
            'automaticas_trend' => 'generadas por el sistema',
            'total' => $total,
        ];
    }

    /**
     * @param  Collection<int, array<string, mixed>>  $filas
     * @return list<array{label: string, n: int, key: string}>
     */
    protected function conteosCategorias(Collection $filas): array
    {
        $conteos = ['Todas las notificaciones' => $filas->count()];
        foreach ($filas as $fila) {
            $cat = (string) ($fila['categoria'] ?? 'Administrativas');
            $conteos[$cat] = ($conteos[$cat] ?? 0) + 1;
        }

        $out = [];
        foreach (self::CATEGORIAS_ORDEN as $label) {
            if (! array_key_exists($label, $conteos) && $label !== 'Todas las notificaciones') {
                continue;
            }
            $out[] = [
                'label' => $label,
                'key' => $label === 'Todas las notificaciones' ? 'todas' : Str::slug($label),
                'n' => (int) ($conteos[$label] ?? 0),
            ];
        }

        return $out;
    }

    protected function normalizarCategoriaFiltro(?string $categoria): ?string
    {
        $c = trim((string) $categoria);
        if ($c === '' || $c === 'todas' || strcasecmp($c, 'Todas las notificaciones') === 0) {
            return null;
        }

        foreach (self::CATEGORIAS_ORDEN as $label) {
            if (strcasecmp($c, $label) === 0 || strcasecmp($c, Str::slug($label)) === 0) {
                return $label;
            }
        }

        return ucfirst($c);
    }

    /**
     * @param  array<string, mixed>  $fila
     */
    protected function coincideBusqueda(array $fila, string $termLower): bool
    {
        if ($termLower === '') {
            return true;
        }

        $blob = strtolower(implode(' ', [
            (string) ($fila['titulo'] ?? ''),
            (string) ($fila['subtitulo'] ?? ''),
            (string) ($fila['alumno'] ?? ''),
            (string) ($fila['matricula'] ?? ''),
            (string) ($fila['categoria'] ?? ''),
        ]));

        return str_contains($blob, $termLower);
    }

    protected function categoriaDesdeModulo(DocumentoObservacion $obs, ?DocumentoAcademico $doc): string
    {
        $seccion = strtolower((string) $obs->seccion);

        return match (true) {
            str_contains($seccion, 'calific') => 'Académicas',
            str_contains($seccion, 'inscrip') => 'Inscripciones',
            str_contains($seccion, 'reinscrip') => 'Reinscripciones',
            str_contains($seccion, 'solic') => 'Solicitudes',
            str_contains($seccion, 'docum'), str_contains($seccion, 'exped') => 'Documentos',
            default => 'Documentos',
        };
    }

    protected function prioridadEtiqueta(string $prioridad): string
    {
        return match (strtolower($prioridad)) {
            'baja' => 'Baja',
            'alta', 'critica' => 'Alta',
            default => 'Media',
        };
    }

    protected function nombreAlumno(?Alumno $alumno): string
    {
        if ($alumno === null) {
            return 'Sistema';
        }

        return trim(implode(' ', array_filter([$alumno->nombre, $alumno->primer_apellido, $alumno->segundo_apellido])));
    }
}
