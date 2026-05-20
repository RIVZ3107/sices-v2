<?php

declare(strict_types=1);

namespace App\Services\ControlEscolar;

use App\Enums\Certificacion\EstadoWorkflow;
use App\Enums\Certificacion\TipoDocumentoAcademico;
use App\Models\Alumno;
use App\Models\DocumentoAcademico;
use App\Models\DocumentoObservacion;
use App\Models\InscripcionPeriodo;
use App\Models\Matricula;
use App\Models\OfertaAcademica;
use App\Models\SolicitudMatricula;
use App\Models\User;
use App\Services\Certificacion\CertificacionAlcanceService;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class ControlEscolarSolicitudesService
{
    /** Máximo de filas por fuente antes de fusionar (evita escanear toda la BD). */
    private const LIMITE_POR_FUENTE = 80;

    private const ESTADOS_MATRICULA_ACTIVA = ['activa', 'vigente'];

    private const ESTATUS_INSCRIPCION_ACTIVA = ['activa', 'inscrita', 'cursando'];

    /** @var list<string> */
    private const WORKFLOW_INACTIVOS = [
        EstadoWorkflow::CANCELADO->value,
        EstadoWorkflow::APROBADO->value,
    ];

    /** @var list<string> */
    private const CATEGORIAS_TIPO = [
        'Constancias',
        'Bajas',
        'Cambios',
        'Reinscripciones',
        'Documentos oficiales',
        'Matrícula',
        'Inscripciones',
        'Reconocimientos',
        'Otros trámites',
    ];

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
            $filas = $this->recolectarFilas($user, $search);
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
                'tipos_solicitud' => $this->tiposSolicitud($filas),
                'comentarios_recientes' => $this->comentariosRecientes($user),
            ];
        });
    }

    /**
     * @return Collection<int, array<string, mixed>>
     */
    protected function recolectarFilas(User $user, ?string $search): Collection
    {
        $filas = collect();
        $term = trim((string) $search);
        $termLower = strtolower($term);

        if ($user->can('ver_solicitud_matricula') || $user->can('solicitudes_matricula.ver')) {
            foreach ($this->querySolicitudesMatricula($user)->get() as $s) {
                $fila = $this->filaDesdeSolicitudMatricula($s);
                if ($this->coincideBusqueda($fila, $termLower)) {
                    $filas->push($fila);
                }
            }
        }

        foreach ($this->queryDocumentos($user, $term !== '' ? $term : null)->get() as $doc) {
            $fila = $this->filaDesdeDocumento($doc);
            if ($this->coincideBusqueda($fila, $termLower)) {
                $filas->push($fila);
            }
        }

        foreach ($this->queryInscripcionesPendientes($user, $term !== '' ? $term : null)->get() as $ins) {
            $fila = $this->filaDesdeInscripcion($ins);
            if ($this->coincideBusqueda($fila, $termLower)) {
                $filas->push($fila);
            }
        }

        foreach ($this->queryMatriculasTramiteBaja($user, $term !== '' ? $term : null)->get() as $mat) {
            $fila = $this->filaDesdeMatriculaTramite($mat);
            if ($this->coincideBusqueda($fila, $termLower)) {
                $filas->push($fila);
            }
        }

        return $filas->sortByDesc(fn (array $f) => $f['orden_at'] ?? '')->values();
    }

    /**
     * @return Builder<SolicitudMatricula>
     */
    protected function querySolicitudesMatricula(User $user): Builder
    {
        $q = SolicitudMatricula::query()
            ->with([
                'alumno:id,nombre,primer_apellido,segundo_apellido,curp',
                'alumno.matriculaActiva:id,alumno_id,matricula',
            ])
            ->where('estado', '!=', SolicitudMatricula::ESTADO_CANCELADA)
            ->orderByDesc('updated_at')
            ->limit(self::LIMITE_POR_FUENTE);

        if ($user->hasAnyRole(['superadmin', 'admin', 'educacion_superior'])) {
            return $q;
        }

        if (! $user->can('ver_solicitud_matricula') && ! $user->can('solicitudes_matricula.ver')) {
            return $q->whereRaw('1 = 0');
        }

        $ofertas = OfertaAcademica::query();
        $this->alcance->aplicarAlcanceOfertasAcademicas($ofertas, $user);
        $ids = $ofertas->pluck('id');

        return $q->whereIn('oferta_academica_id', $ids);
    }

    /**
     * @param  array<string, mixed>  $fila
     */
    protected function coincideBusqueda(array $fila, string $termLower): bool
    {
        if ($termLower === '') {
            return true;
        }

        $haystack = strtolower(implode(' ', array_filter([
            (string) ($fila['folio'] ?? ''),
            (string) ($fila['tipo'] ?? ''),
            (string) ($fila['alumno'] ?? ''),
            (string) ($fila['id'] ?? ''),
            (string) ($fila['estatus'] ?? ''),
        ])));

        return str_contains($haystack, $termLower);
    }

    /**
     * @return array<string, mixed>
     */
    protected function filaDesdeSolicitudMatricula(SolicitudMatricula $s): array
    {
        $alumno = $s->alumno;
        $dt = $s->updated_at ?? $s->created_at ?? now();
        $estatus = $this->estatusSolicitudMatricula((string) $s->estado);

        return $this->armarFila(
            clave: 'sm-'.$s->id,
            folio: 'SOL-MAT-'.str_pad((string) $s->id, 5, '0', STR_PAD_LEFT),
            tipo: 'Solicitud de matrícula',
            alumno: $alumno,
            identificador: $this->identificadorAlumno($alumno, (string) ($s->alumno?->matriculaActiva?->matricula ?? '')),
            prioridad: $this->prioridadSolicitudMatricula((string) $s->estado),
            fecha: $dt,
            estatus: $estatus,
            detalle_url: '/app/solicitudes-matricula',
            categoria: 'Matrícula',
        );
    }

    /**
     * @return array<string, mixed>
     */
    protected function filaDesdeDocumento(DocumentoAcademico $doc): array
    {
        $tipoEnum = TipoDocumentoAcademico::tryFrom((string) $doc->tipo_documento);
        $tipo = $tipoEnum?->label() ?? ucfirst(str_replace('_', ' ', (string) $doc->tipo_documento));
        $workflow = EstadoWorkflow::tryFrom((string) $doc->estado_workflow);
        $estatus = $workflow?->label() ?? ucfirst((string) $doc->estado_workflow);
        $estatusUi = $this->estatusDesdeWorkflow($estatus);
        $dt = $doc->fecha_solicitud ?? $doc->updated_at ?? $doc->created_at ?? now();
        $folio = trim((string) ($doc->folio_interno ?? ''));
        if ($folio === '') {
            $folio = 'DOC-'.str_pad((string) $doc->id, 5, '0', STR_PAD_LEFT);
        }

        return $this->armarFila(
            clave: 'doc-'.$doc->id,
            folio: $folio,
            tipo: $tipo,
            alumno: $doc->alumno,
            identificador: $this->identificadorAlumno($doc->alumno, (string) ($doc->matricula?->matricula ?? '')),
            prioridad: in_array($estatusUi, ['En revisión', 'Rechazada'], true) ? 'Alta' : 'Media',
            fecha: $dt,
            estatus: $estatusUi,
            detalle_url: '/app/control-escolar/documentos',
            categoria: 'Documentos oficiales',
        );
    }

    /**
     * @return array<string, mixed>
     */
    protected function filaDesdeInscripcion(InscripcionPeriodo $ins): array
    {
        $alumno = $ins->matricula?->alumno;
        $dt = $ins->updated_at ?? $ins->created_at ?? now();

        return $this->armarFila(
            clave: 'ins-'.$ins->id,
            folio: 'INS-'.str_pad((string) $ins->id, 5, '0', STR_PAD_LEFT),
            tipo: 'Inscripción de periodo',
            alumno: $alumno,
            identificador: $this->identificadorAlumno($alumno, (string) ($ins->matricula?->matricula ?? '')),
            prioridad: 'Media',
            fecha: $dt,
            estatus: 'Pendiente',
            detalle_url: $alumno ? '/app/alumnos/'.$alumno->id.'/expediente' : '/app/control-escolar/inscripciones',
            categoria: 'Inscripciones',
        );
    }

    /**
     * @return array<string, mixed>
     */
    protected function filaDesdeMatriculaTramite(Matricula $mat): array
    {
        $alumno = $mat->alumno;
        $meta = array_merge(
            (array) ($alumno?->metadata ?? []),
            (array) ($mat->metadata ?? []),
        );
        $tipoRaw = trim((string) ($meta['tipo_tramite'] ?? $meta['tipo_cambio'] ?? $meta['tramite'] ?? 'Baja temporal'));
        $tipo = ucfirst(str_replace('_', ' ', $tipoRaw));
        $dt = $mat->updated_at ?? $mat->created_at ?? now();
        $estatusRaw = trim((string) ($meta['estatus_tramite'] ?? 'pendiente'));
        $estatusUi = match (strtolower($estatusRaw)) {
            'en_revision', 'en revisión', 'revision' => 'En revisión',
            'resuelta', 'aprobada', 'completada' => 'Resuelta',
            'rechazada' => 'Rechazada',
            default => 'Pendiente',
        };

        return $this->armarFila(
            clave: 'baj-'.$mat->id,
            folio: 'SOL-'.str_pad((string) $mat->id, 5, '0', STR_PAD_LEFT),
            tipo: $tipo,
            alumno: $alumno,
            identificador: $this->identificadorAlumno($alumno, (string) ($mat->matricula ?? '')),
            prioridad: str_contains(strtolower($tipo), 'definitiva') ? 'Alta' : 'Media',
            fecha: $dt,
            estatus: $estatusUi,
            detalle_url: $alumno ? '/app/alumnos/'.$alumno->id.'/expediente' : '/app/control-escolar/bajas-cambios',
            categoria: $this->categoriaDesdeTipo($tipo),
        );
    }

    /**
     * @return array<string, mixed>
     */
    protected function armarFila(
        string $clave,
        string $folio,
        string $tipo,
        ?Alumno $alumno,
        string $identificador,
        string $prioridad,
        mixed $fecha,
        string $estatus,
        string $detalle_url,
        string $categoria,
    ): array {
        $carbon = $fecha instanceof Carbon ? $fecha : Carbon::parse($fecha);
        $tz = config('app.timezone');

        return [
            'clave' => $clave,
            'folio' => $folio,
            'tipo' => $tipo,
            'alumno' => $this->nombreAlumno($alumno),
            'id' => $identificador,
            'prioridad' => $prioridad,
            'fecha' => $carbon->timezone($tz)->format('d/m/Y'),
            'hora' => $carbon->timezone($tz)->format('h:i a'),
            'estatus' => $estatus,
            'detalle_url' => $detalle_url,
            'categoria' => $categoria,
            'orden_at' => $carbon->toIso8601String(),
        ];
    }

    /**
     * @param  Collection<int, array<string, mixed>>  $filas
     * @return array{
     *   pendientes: int,
     *   urgentes: int,
     *   en_revision: int,
     *   resueltas: int,
     *   pendientes_trend: string,
     *   urgentes_trend: string,
     *   en_revision_trend: string,
     *   resueltas_trend: string
     * }
     */
    protected function metricasDesdeFilas(Collection $filas): array
    {
        $pendientes = $filas->filter(fn (array $f) => ($f['estatus'] ?? '') === 'Pendiente')->count();
        $enRevision = $filas->filter(fn (array $f) => ($f['estatus'] ?? '') === 'En revisión')->count();
        $resueltas = $filas->filter(fn (array $f) => ($f['estatus'] ?? '') === 'Resuelta')->count();
        $urgentes = $filas->filter(
            fn (array $f) => ($f['prioridad'] ?? '') === 'Alta'
                && in_array($f['estatus'] ?? '', ['Pendiente', 'En revisión'], true)
        )->count();

        return [
            'pendientes' => $pendientes,
            'urgentes' => $urgentes,
            'en_revision' => $enRevision,
            'resueltas' => $resueltas,
            'pendientes_trend' => '— En tu alcance actual',
            'urgentes_trend' => $urgentes > 0 ? '↑ Requieren atención prioritaria' : '— Sin urgencias',
            'urgentes_trend_color' => $urgentes > 0 ? '#991B1B' : '#64748b',
            'en_revision_trend' => '— Bandeja operativa',
            'resueltas_trend' => '— Histórico en alcance',
            'pendientes_trend_color' => '#64748b',
            'en_revision_trend_color' => '#BA7517',
            'resueltas_trend_color' => '#0F6E56',
        ];
    }

    /**
     * @param  Collection<int, array<string, mixed>>  $filas
     * @return list<array{tipo: string, n: string}>
     */
    protected function tiposSolicitud(Collection $filas): array
    {
        $conteos = [];
        foreach (self::CATEGORIAS_TIPO as $cat) {
            $conteos[$cat] = 0;
        }

        foreach ($filas as $fila) {
            $cat = (string) ($fila['categoria'] ?? 'Otros trámites');
            if (! isset($conteos[$cat])) {
                $cat = 'Otros trámites';
            }
            $conteos[$cat]++;
        }

        $items = [];
        foreach (self::CATEGORIAS_TIPO as $cat) {
            if (($conteos[$cat] ?? 0) > 0) {
                $items[] = [
                    'tipo' => $cat,
                    'n' => (string) $conteos[$cat],
                ];
            }
        }

        return $items;
    }

    /**
     * @return list<array{autor: string, rol: string, tiempo: string, texto: string, folio: string, url: string}>
     */
    protected function comentariosRecientes(User $user): array
    {
        $items = collect();

        $docQuery = DocumentoObservacion::query()
            ->with(['documentoAcademico.alumno', 'creadaPor.roles'])
            ->whereHas('documentoAcademico', function (Builder $q) use ($user): void {
                $this->alcance->aplicarAlcanceDocumentosAcademicos($q, $user);
            })
            ->orderByDesc('created_at')
            ->limit(8)
            ->get();

        foreach ($docQuery as $obs) {
            $doc = $obs->documentoAcademico;
            $folio = trim((string) ($doc?->folio_interno ?? ''));
            if ($folio === '' && $doc !== null) {
                $folio = 'DOC-'.str_pad((string) $doc->id, 5, '0', STR_PAD_LEFT);
            }
            $items->push([
                'autor' => $obs->creadaPor?->name ?? 'Usuario',
                'rol' => $this->rolEtiqueta($obs->creadaPor),
                'tiempo' => $this->tiempoRelativo($obs->created_at),
                'texto' => Str::limit(trim((string) $obs->observacion), 160),
                'folio' => $folio,
                'url' => '/app/control-escolar/documentos',
                'orden_at' => $obs->created_at?->toIso8601String() ?? '',
            ]);
        }

        if ($user->can('ver_solicitud_matricula') || $user->can('solicitudes_matricula.ver')) {
            $this->querySolicitudesMatricula($user)
                ->whereNotNull('observaciones')
                ->where('observaciones', '!=', '')
                ->reorder('updated_at', 'desc')
                ->limit(5)
                ->get()
                ->each(function (SolicitudMatricula $s) use ($items): void {
                    $items->push([
                        'autor' => 'Educación Superior',
                        'rol' => 'Revisión',
                        'tiempo' => $this->tiempoRelativo($s->updated_at),
                        'texto' => Str::limit(trim((string) $s->observaciones), 160),
                        'folio' => 'SOL-MAT-'.str_pad((string) $s->id, 5, '0', STR_PAD_LEFT),
                        'url' => '/app/solicitudes-matricula',
                        'orden_at' => $s->updated_at?->toIso8601String() ?? '',
                    ]);
                });
        }

        return $items
            ->sortByDesc('orden_at')
            ->take(5)
            ->map(fn (array $row) => array_diff_key($row, ['orden_at' => true]))
            ->values()
            ->all();
    }

    /**
     * @return Builder<DocumentoAcademico>
     */
    protected function queryDocumentos(User $user, ?string $search): Builder
    {
        $query = DocumentoAcademico::query()
            ->with(['alumno:id,nombre,primer_apellido,segundo_apellido,curp', 'matricula:id,matricula'])
            ->whereNotIn('estado_workflow', self::WORKFLOW_INACTIVOS)
            ->orderByDesc('updated_at')
            ->limit(self::LIMITE_POR_FUENTE);
        $this->alcance->aplicarAlcanceDocumentosAcademicos($query, $user);

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
     * @return Builder<InscripcionPeriodo>
     */
    protected function queryInscripcionesPendientes(User $user, ?string $search): Builder
    {
        $query = InscripcionPeriodo::query()
            ->with(['matricula:id,matricula,alumno_id', 'matricula.alumno:id,nombre,primer_apellido,segundo_apellido,curp'])
            ->whereIn('estatus', self::ESTATUS_INSCRIPCION_ACTIVA)
            ->whereDoesntHave('cargasAcademicas')
            ->whereHas('matricula', function (Builder $m) use ($user): void {
                $m->whereIn('estado', self::ESTADOS_MATRICULA_ACTIVA)
                    ->whereHas('alumno', function (Builder $alumno) use ($user): void {
                        $alumno->whereIn('id', $this->dashboard->queryAlumnosEnAlcance($user)->select('id'));
                    });
            })
            ->orderByDesc('updated_at')
            ->limit(self::LIMITE_POR_FUENTE);

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

    /**
     * @return Builder<Matricula>
     */
    protected function queryMatriculasTramiteBaja(User $user, ?string $search): Builder
    {
        $query = Matricula::query()
            ->with(['alumno:id,nombre,primer_apellido,segundo_apellido,curp'])
            ->whereHas('alumno', function (Builder $alumno) use ($user): void {
                $alumno->whereIn('id', $this->dashboard->queryAlumnosEnAlcance($user)->select('id'));
            })
            ->where(function (Builder $q): void {
                $q->whereNotIn('estado', self::ESTADOS_MATRICULA_ACTIVA)
                    ->orWhereNotNull('metadata->tipo_tramite')
                    ->orWhereNotNull('metadata->tipo_cambio')
                    ->orWhereNotNull('metadata->tramite');
            })
            ->orderByDesc('updated_at')
            ->limit(self::LIMITE_POR_FUENTE);

        $term = trim((string) $search);
        if ($term !== '') {
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

        return $query;
    }

    protected function estatusSolicitudMatricula(string $estado): string
    {
        return match ($estado) {
            SolicitudMatricula::ESTADO_MATRICULA_ASIGNADA => 'Resuelta',
            SolicitudMatricula::ESTADO_RECHAZADA => 'Rechazada',
            SolicitudMatricula::ESTADO_EN_REVISION,
            SolicitudMatricula::ESTADO_CON_OBSERVACIONES,
            SolicitudMatricula::ESTADO_APROBADA => 'En revisión',
            default => 'Pendiente',
        };
    }

    protected function prioridadSolicitudMatricula(string $estado): string
    {
        return match ($estado) {
            SolicitudMatricula::ESTADO_CON_OBSERVACIONES,
            SolicitudMatricula::ESTADO_ENVIADA,
            SolicitudMatricula::ESTADO_EN_REVISION => 'Alta',
            SolicitudMatricula::ESTADO_MATRICULA_ASIGNADA => 'Baja',
            default => 'Media',
        };
    }

    protected function estatusDesdeWorkflow(string $label): string
    {
        $v = strtolower($label);

        return match (true) {
            str_contains($v, 'rechaz') => 'Rechazada',
            str_contains($v, 'aprobad') => 'Resuelta',
            str_contains($v, 'revisión') || str_contains($v, 'revision') => 'En revisión',
            default => 'Pendiente',
        };
    }

    protected function categoriaDesdeTipo(string $tipo): string
    {
        $t = strtolower($tipo);

        return match (true) {
            str_contains($t, 'constancia') => 'Constancias',
            str_contains($t, 'baja') => 'Bajas',
            str_contains($t, 'cambio') || str_contains($t, 'grupo') || str_contains($t, 'turno') => 'Cambios',
            str_contains($t, 'reinscrip') => 'Reinscripciones',
            str_contains($t, 'reconoc') || str_contains($t, 'import') => 'Reconocimientos',
            default => 'Otros trámites',
        };
    }

    protected function nombreAlumno(?Alumno $alumno): string
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

    protected function identificadorAlumno(?Alumno $alumno, string $matricula = ''): string
    {
        if ($matricula !== '') {
            return $matricula;
        }

        if ($alumno === null) {
            return '—';
        }

        $curp = trim((string) ($alumno->curp ?? ''));
        if ($curp !== '') {
            return strlen($curp) > 12 ? substr($curp, 0, 12).'…' : $curp;
        }

        return 'A'.str_pad((string) $alumno->id, 8, '0', STR_PAD_LEFT);
    }

    protected function rolEtiqueta(?User $user): string
    {
        if ($user === null) {
            return 'Usuario';
        }

        if ($user->hasRole('control_escolar_escuela')) {
            return 'Control Escolar';
        }

        if ($user->hasRole('docente')) {
            return 'Docente';
        }

        if ($user->hasRole('educacion_superior')) {
            return 'Educación Superior';
        }

        return 'Usuario';
    }

    protected function tiempoRelativo(mixed $dt): string
    {
        if ($dt === null) {
            return '—';
        }

        $carbon = $dt instanceof Carbon ? $dt : Carbon::parse($dt);
        $diff = $carbon->diffInDays(now());

        if ($diff === 0) {
            return 'Hoy, '.$carbon->timezone(config('app.timezone'))->format('h:i a');
        }

        if ($diff === 1) {
            return 'Ayer, '.$carbon->timezone(config('app.timezone'))->format('h:i a');
        }

        return $carbon->timezone(config('app.timezone'))->format('d/m/Y h:i a');
    }
}
