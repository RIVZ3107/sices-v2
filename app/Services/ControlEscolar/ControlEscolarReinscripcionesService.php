<?php

declare(strict_types=1);

namespace App\Services\ControlEscolar;

use App\Models\Alumno;
use App\Models\CargaAcademica;
use App\Models\CicloEscolar;
use App\Models\DocumentoAcademico;
use App\Models\DocumentoObservacion;
use App\Models\ImportacionHistoricaMaterias;
use App\Models\InscripcionPeriodo;
use App\Models\Matricula;
use App\Models\OfertaAcademica;
use App\Models\ProgramaEstudio;
use App\Models\Sede;
use App\Models\User;
use App\Services\Certificacion\AuditoriaService;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ControlEscolarReinscripcionesService
{
    private const ESTATUS_INSCRIPCION_ACTIVA = ['activa', 'inscrita', 'cursando'];

    private const ESTADOS_MATRICULA_ACTIVA = ['activa', 'vigente'];

    /** @var array<string, string> */
    private const MOTIVOS_CODIGO = [
        'calificaciones_pendientes' => 'Calificaciones pendientes',
        'observaciones_pendientes' => 'Observaciones pendientes',
        'documentos_incompletos' => 'Documentos incompletos',
        'validacion_normativa_pendiente' => 'Validación normativa pendiente',
        'trayectoria_incompleta' => 'Trayectoria no consolidada',
        'adeudos_detectados' => 'Adeudos detectados',
    ];

    /** @var list<array{key: string, nombre: string}> */
    private const REQUISITOS = [
        ['key' => 'matricula', 'nombre' => 'Matrícula activa'],
        ['key' => 'continuidad', 'nombre' => 'Continuidad académica'],
        ['key' => 'calificaciones', 'nombre' => 'Calificaciones capturadas'],
        ['key' => 'documentos', 'nombre' => 'Documentos validados'],
        ['key' => 'adeudos', 'nombre' => 'Sin adeudos'],
        ['key' => 'observaciones', 'nombre' => 'Sin observaciones abiertas'],
        ['key' => 'normativa', 'nombre' => 'Validación normativa'],
    ];

    public function __construct(
        protected ControlEscolarDashboardService $dashboard,
        protected AuditoriaService $auditoria,
    ) {}

    /**
     * @param  array<string, mixed>  $filtros
     * @return array<string, mixed>
     */
    public function gestion(User $user, array $filtros): array
    {
        $page = max(1, (int) ($filtros['page'] ?? 1));
        $perPage = max(1, min(50, (int) ($filtros['per_page'] ?? 10)));

        return $this->dashboard->conAlcanceUsuario($user, function () use ($user, $filtros, $page, $perPage): array {
            $metricas = $this->metricas($user);
            $paginator = $this->queryListado($user, $filtros)->paginate($perPage, ['*'], 'page', $page);

            return [
                'actualizado_en' => now()->toIso8601String(),
                'metricas' => $metricas,
                'regla_continuidad' => 'La reinscripción aplica a alumnos con matrícula activa y continuidad académica registrada en tu alcance.',
                'catalogos' => $this->catalogosFiltro($user),
                'permisos' => $this->permisosUi($user),
                'listado' => [
                    'data' => collect($paginator->items())->map(fn (InscripcionPeriodo $ins) => $this->filaListado($ins))->values()->all(),
                    'meta' => [
                        'current_page' => $paginator->currentPage(),
                        'last_page' => $paginator->lastPage(),
                        'per_page' => $paginator->perPage(),
                        'total' => $paginator->total(),
                        'from' => $paginator->firstItem(),
                        'to' => $paginator->lastItem(),
                    ],
                ],
                'motivos_bloqueo' => $this->motivosBloqueoApi($user),
                'flujo' => $this->flujo($user),
            ];
        });
    }

    /**
     * @return array<string, mixed>
     */
    public function resumen(User $user): array
    {
        return $this->dashboard->conAlcanceUsuario($user, function () use ($user): array {
            $m = $this->metricas($user);

            return array_merge($m, [
                'adeudos_detectados' => $m['adeudos'],
                'ultima_actualizacion' => now()->toIso8601String(),
            ]);
        });
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function motivosBloqueoApi(User $user): array
    {
        return $this->dashboard->conAlcanceUsuario($user, fn (): array => $this->motivosBloqueo($user));
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function flujo(User $user): array
    {
        return $this->dashboard->conAlcanceUsuario($user, function () use ($user): array {
            $base = $this->queryListado($user, []);
            $total = max(1, (clone $base)->count());
            $iniciadas = (clone $base)->count();
            $enRevision = (clone $base)->where(fn (Builder $q) => $this->filtroEstatus($q, 'en_revision'))->count();
            $desbloqueadas = (clone $base)->where(fn (Builder $q) => $this->filtroEstatus($q, 'desbloqueada'))->count();
            $completadas = (clone $base)->where(fn (Builder $q) => $this->filtroEstatus($q, 'completada'))->count();

            return [
                $this->pasoFlujo('solicitud', 'Solicitud iniciada', 'Alumno solicita reinscripción.', 1, $iniciadas, $total, $iniciadas >= $total ? 'completado' : 'en_proceso'),
                $this->pasoFlujo('validacion', 'Validación y revisión', 'Revisión de documentos y adeudos.', 2, $enRevision, $total, $enRevision > 0 ? 'en_proceso' : ($iniciadas > 0 ? 'pendiente' : 'bloqueado')),
                $this->pasoFlujo('desbloqueo', 'Aprobación / Desbloqueo', 'Se autoriza el proceso.', 3, $desbloqueadas, $total, $desbloqueadas > 0 ? 'en_proceso' : 'pendiente'),
                $this->pasoFlujo('completada', 'Reinscripción completada', 'Alumno reinscrito exitosamente.', 4, $completadas, $total, $completadas > 0 ? 'completado' : 'pendiente'),
            ];
        });
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function elegibles(User $user, int $limit = 50): array
    {
        return $this->dashboard->conAlcanceUsuario($user, function () use ($user, $limit): array {
            $ciclo = CicloEscolar::query()->where('es_actual', true)->orWhere('activo', true)->orderByDesc('id')->first();
            $items = [];
            $this->dashboard->queryAlumnosEnAlcance($user)
                ->with(['matriculaActiva.ofertaAcademica.planEstudio.programaEstudio'])
                ->limit($limit)
                ->get()
                ->each(function (Alumno $alumno) use (&$items, $ciclo): void {
                    $mat = $alumno->matriculaActiva;
                    if ($mat === null || ! in_array((string) $mat->estado, self::ESTADOS_MATRICULA_ACTIVA, true)) {
                        return;
                    }
                    $ins = InscripcionPeriodo::query()->where('matricula_id', $mat->id)->latest('id')->first();
                    $bloqueos = $ins ? $this->bloqueosRequisitos($ins) : ['Sin inscripción de periodo previa.'];
                    $items[] = [
                        'alumno_id' => $alumno->id,
                        'nombre' => $this->nombreCompleto($alumno),
                        'matricula' => $mat->matricula,
                        'curp' => $alumno->curp,
                        'programa' => $mat->ofertaAcademica?->planEstudio?->programaEstudio?->nombre ?? '—',
                        'periodo_actual' => $this->nombrePeriodo($ins?->cicloEscolar, $ins?->etiqueta_periodo_curricular),
                        'periodo_siguiente_id' => $ciclo?->id,
                        'bloqueos' => $bloqueos,
                    ];
                });

            return $items;
        });
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    public function crear(User $user, array $data): array
    {
        return $this->dashboard->conAlcanceUsuario($user, function () use ($user, $data): array {
            $alumno = $this->alumnoEnAlcance($user, (int) $data['alumno_id']);
            $mat = $alumno->matriculaActiva;
            if ($mat === null || ! in_array((string) $mat->estado, self::ESTADOS_MATRICULA_ACTIVA, true)) {
                throw ValidationException::withMessages(['alumno_id' => ['El alumno no tiene matrícula activa.']]);
            }
            $cicloId = (int) $data['ciclo_escolar_id'];
            $dup = InscripcionPeriodo::query()
                ->where('matricula_id', $mat->id)
                ->where('ciclo_escolar_id', $cicloId)
                ->whereNotIn('estatus', ['cancelada', 'baja'])
                ->exists();
            if ($dup) {
                throw ValidationException::withMessages(['ciclo_escolar_id' => ['Ya existe una reinscripción activa para este periodo.']]);
            }
            $wf = ['iniciada_at' => now()->toIso8601String(), 'creado_por' => $user->id];
            $ins = InscripcionPeriodo::query()->create([
                'matricula_id' => $mat->id,
                'ciclo_escolar_id' => $cicloId,
                'semestre' => (int) ($data['semestre'] ?? 1),
                'tipo_periodo_curricular' => 'semestre',
                'numero_periodo_curricular' => (int) ($data['semestre'] ?? 1),
                'estatus' => 'inscrita',
                'fecha_inscripcion' => now(),
                'metadata' => ['reinscripcion_workflow' => $wf],
            ]);
            $ins->load($this->eagerListado());
            $bloqueos = $this->bloqueosRequisitos($ins);
            $codigo = $bloqueos === [] ? 'en_revision' : ($this->tieneObservaciones($ins) ? 'observada' : 'bloqueada');
            $this->touchWorkflow($ins, ['estatus_codigo' => $codigo]);
            $ins = $ins->fresh($this->eagerListado());
            $this->registrarAuditoria($user, 'reinscripcion.crear', $ins->id, $alumno->id, ['folio' => $this->folioReinscripcion($ins->id), 'bloqueos' => $bloqueos]);

            return $this->filaListado($ins);
        });
    }

    public function desbloquear(User $user, int $id, string $motivo, string $comentario): array
    {
        return $this->dashboard->conAlcanceUsuario($user, function () use ($user, $id, $motivo, $comentario): array {
            $ins = $this->inscripcionEnAlcance($user, $id);
            $codigo = $this->codigoEstatus($ins);
            if (! in_array($codigo, ['bloqueada', 'observada'], true)) {
                throw ValidationException::withMessages(['reinscripcion' => ['La reinscripción no está bloqueada u observada.']]);
            }
            $bloqueos = $this->bloqueosRequisitos($ins);
            if ($bloqueos !== [] && ! $user->can('reinscripciones.autorizar_excepcion')) {
                throw ValidationException::withMessages(['bloqueos' => $bloqueos]);
            }
            $this->touchWorkflow($ins, [
                'estatus_codigo' => 'desbloqueada',
                'desbloqueada_at' => now()->toIso8601String(),
                'desbloqueada_por' => $user->id,
                'motivo_desbloqueo' => $motivo,
                'comentario_desbloqueo' => $comentario,
            ]);
            $this->registrarAuditoria($user, 'reinscripcion.desbloquear', $ins->id, $ins->matricula?->alumno_id, compact('motivo', 'comentario'));

            return $this->filaListado($ins->fresh($this->eagerListado()));
        });
    }

    public function completar(User $user, int $id, ?string $comentario = null): array
    {
        return $this->dashboard->conAlcanceUsuario($user, function () use ($user, $id, $comentario): array {
            $ins = $this->inscripcionEnAlcance($user, $id);
            $bloqueos = $this->bloqueosRequisitos($ins);
            if ($bloqueos !== []) {
                throw ValidationException::withMessages(['requisitos' => $bloqueos]);
            }
            if ($ins->cargasAcademicas->isEmpty()) {
                CargaAcademica::query()->create([
                    'inscripcion_periodo_id' => $ins->id,
                    'estatus' => 'activa',
                    'metadata' => ['origen' => 'reinscripcion_completar'],
                ]);
            }
            $ins->update(['estatus' => 'cursando']);
            $this->touchWorkflow($ins, [
                'estatus_codigo' => 'completada',
                'completada_at' => now()->toIso8601String(),
                'completada_por' => $user->id,
                'comentario_completado' => $comentario,
            ]);
            $this->registrarAuditoria($user, 'reinscripcion.completar', $ins->id, $ins->matricula?->alumno_id, ['comentario' => $comentario]);

            return $this->filaListado($ins->fresh($this->eagerListado()));
        });
    }

    public function observar(User $user, int $id, string $motivo, ?string $descripcion = null): array
    {
        return $this->dashboard->conAlcanceUsuario($user, function () use ($user, $id, $motivo, $descripcion): array {
            $ins = $this->inscripcionEnAlcance($user, $id);
            $doc = $ins->matricula?->alumno?->documentosAcademicos?->first();
            if ($doc !== null) {
                DocumentoObservacion::query()->create([
                    'documento_academico_id' => $doc->id,
                    'tipo' => 'reinscripcion',
                    'observacion' => $motivo.($descripcion ? ': '.$descripcion : ''),
                    'estado' => 'pendiente',
                    'prioridad' => 'alta',
                    'creada_por' => $user->id,
                ]);
            }
            $this->touchWorkflow($ins, ['estatus_codigo' => 'observada', 'observada_at' => now()->toIso8601String(), 'motivo' => $motivo]);
            $this->registrarAuditoria($user, 'reinscripcion.observar', $ins->id, $ins->matricula?->alumno_id, ['motivo' => $motivo]);

            return $this->filaListado($ins->fresh($this->eagerListado()));
        });
    }

    public function cancelar(User $user, int $id, string $motivo): array
    {
        return $this->dashboard->conAlcanceUsuario($user, function () use ($user, $id, $motivo): array {
            $ins = $this->inscripcionEnAlcance($user, $id);
            if ($this->codigoEstatus($ins) === 'completada') {
                throw ValidationException::withMessages(['reinscripcion' => ['No se puede cancelar una reinscripción completada.']]);
            }
            $ins->update(['estatus' => 'cancelada']);
            $this->touchWorkflow($ins, ['estatus_codigo' => 'cancelada', 'cancelada_at' => now()->toIso8601String(), 'motivo_cancelacion' => $motivo]);
            $this->registrarAuditoria($user, 'reinscripcion.cancelar', $ins->id, $ins->matricula?->alumno_id, ['motivo' => $motivo]);

            return $this->filaListado($ins->fresh($this->eagerListado()));
        });
    }

    /**
     * @param  list<int>  $ids
     * @return array{procesados: int, bloqueados: list<array<string, mixed>>, errores: list<string>}
     */
    public function desbloquearMasivo(User $user, array $ids, string $motivo, string $comentario): array
    {
        return $this->procesarMasivo($user, $ids, fn (int $id) => $this->desbloquear($user, $id, $motivo, $comentario), 'reinscripcion.desbloquear_masivo');
    }

    /**
     * @param  list<int>  $ids
     * @return array{procesados: int, bloqueados: list<array<string, mixed>>, errores: list<string>}
     */
    public function completarMasivo(User $user, array $ids): array
    {
        return $this->procesarMasivo($user, $ids, fn (int $id) => $this->completar($user, $id), 'reinscripcion.completar_masivo');
    }

    /**
     * @param  array<string, mixed>  $filtros
     */
    public function exportarCsv(User $user, array $filtros): StreamedResponse
    {
        /** @var StreamedResponse $response */
        $response = $this->dashboard->conAlcanceUsuario($user, function () use ($user, $filtros): StreamedResponse {
            $this->registrarAuditoria($user, 'reinscripcion.exportar', null, null, ['filtros' => $filtros]);

            return response()->streamDownload(function () use ($user, $filtros): void {
                $out = fopen('php://output', 'w');
                if ($out === false) {
                    return;
                }
                fputcsv($out, ['folio', 'alumno', 'matricula', 'curp', 'programa', 'periodo', 'motivo', 'avance', 'estatus', 'actualizado']);
                $this->queryListado($user, $filtros)->chunk(150, function ($rows) use ($out): void {
                    foreach ($rows as $ins) {
                        $f = $this->filaListado($ins);
                        fputcsv($out, [
                            $f['folio'], $f['alumno'], $f['matricula'], $f['curp'], $f['programa'], $f['periodo'],
                            $f['motivo_bloqueo'], $f['avance']['completados'].'/'.$f['avance']['total'],
                            $f['estatus']['label'], $f['actualizado_en'],
                        ]);
                    }
                });
                fclose($out);
            }, 'reinscripciones_'.now()->format('Y-m-d_His').'.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
        });

        return $response;
    }

    public function ficha(User $user, int $id): \Symfony\Component\HttpFoundation\Response
    {
        return $this->dashboard->conAlcanceUsuario($user, function () use ($user, $id): \Symfony\Component\HttpFoundation\Response {
            $ins = $this->inscripcionEnAlcance($user, $id);
            $codigo = $this->codigoEstatus($ins);
            if (! in_array($codigo, ['desbloqueada', 'en_revision', 'por_completar', 'completada'], true)
                && ! $user->can('reinscripciones.autorizar_excepcion')) {
                throw ValidationException::withMessages(['reinscripcion' => ['La ficha solo está disponible para reinscripciones en proceso avanzado o completadas.']]);
            }
            $f = $this->filaListado($ins);
            $html = '<html><body style="font-family:DejaVu Sans,sans-serif;padding:24px">'
                .'<h1>Ficha de reinscripción</h1>'
                .'<p><strong>Folio:</strong> '.e($f['folio']).'</p>'
                .'<p><strong>Alumno:</strong> '.e($f['alumno']).'</p>'
                .'<p><strong>Matrícula:</strong> '.e($f['matricula']).'</p>'
                .'<p><strong>Periodo:</strong> '.e($f['periodo']).'</p>'
                .'<p><strong>Estatus:</strong> '.e($f['estatus']['label']).'</p>'
                .'<p>Generado: '.now()->format('d/m/Y H:i').'</p></body></html>';
            $this->registrarAuditoria($user, 'reinscripcion.ficha', $ins->id, $ins->matricula?->alumno_id, []);

            return Pdf::loadHTML($html)->download('ficha_'.$f['folio'].'.pdf');
        });
    }

    /**
     * @return array{en_proceso: int, bloqueadas: int, completadas: int, adeudos: int, total_alcance: int}
     */
    protected function metricas(User $user): array
    {
        $base = $this->queryListado($user, []);
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

        $adeudos = (clone $base)->where(function (Builder $q): void {
            $q->whereHas('matricula.alumno.documentosAcademicos', fn (Builder $d) => $d->where('estado_workflow', 'rechazado'))
                ->orWhereIn('matricula_id', ImportacionHistoricaMaterias::query()
                    ->whereIn('estado', ['error', 'rechazada'])
                    ->pluck('matricula_id'));
        })->count();

        return [
            'en_proceso' => $enProceso,
            'bloqueadas' => $bloqueadas,
            'completadas' => $completadas,
            'adeudos' => $adeudos,
            'total_alcance' => $total,
        ];
    }

    /**
     * @param  array<string, mixed>  $filtros
     * @return Builder<InscripcionPeriodo>
     */
    protected function queryListado(User $user, array $filtros): Builder
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
                'matricula.trayectoriaAcademica',
                'cicloEscolar:id,nombre,clave,fecha_inicio,fecha_fin',
                'cargasAcademicas.materiasCursadas:id,carga_academica_id,calificacion,estatus_acreditacion',
            ])
            ->whereIn('id', $latestPorMatricula)
            ->orderByDesc('updated_at')
            ->orderByDesc('id');

        $term = trim((string) ($filtros['search'] ?? ''));
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
                    ->orWhereHas('cicloEscolar', fn (Builder $c) => $c->where('nombre', 'like', $like)->orWhere('clave', 'like', $like));
                if ($folioId !== null) {
                    $q->orWhere('id', $folioId);
                }
            });
        }

        $estatus = trim((string) ($filtros['estatus'] ?? ''));
        if ($estatus !== '') {
            $query->where(fn (Builder $q) => $this->filtroEstatus($q, $estatus));
        }

        $periodoId = (int) ($filtros['periodo_id'] ?? 0);
        if ($periodoId > 0) {
            $query->where('ciclo_escolar_id', $periodoId);
        }

        $programaId = (int) ($filtros['programa_id'] ?? 0);
        if ($programaId > 0) {
            $query->whereHas('matricula.ofertaAcademica', fn (Builder $o) => $o->where('programa_estudio_id', $programaId));
        }

        $sedeId = (int) ($filtros['sede_id'] ?? 0);
        if ($sedeId > 0) {
            $query->whereHas('matricula.ofertaAcademica', fn (Builder $o) => $o->where('sede_id', $sedeId));
        }

        $motivo = trim((string) ($filtros['motivo_bloqueo'] ?? ''));
        if ($motivo !== '') {
            $query->where(fn (Builder $q) => $this->filtroMotivoBloqueo($q, $motivo));
        }

        if (($filtros['con_observaciones'] ?? '') === '1' || ($filtros['con_observaciones'] ?? '') === 'true') {
            $query->whereHas('matricula.alumno.documentosAcademicos.observacionesPendientes');
        }

        if (($filtros['con_calificaciones_pendientes'] ?? '') === '1') {
            $query->whereHas('cargasAcademicas.materiasCursadas', fn (Builder $m) => $m->whereNull('calificacion'));
        }

        if (($filtros['validacion_normativa_pendiente'] ?? '') === '1') {
            $query->whereIn('matricula_id', ImportacionHistoricaMaterias::query()
                ->whereIn('estado', ['error', 'rechazada'])
                ->pluck('matricula_id'));
        }

        if (($filtros['con_adeudos'] ?? '') === '1') {
            $query->whereHas('matricula.alumno.documentosAcademicos', fn (Builder $d) => $d->where('estado_workflow', 'rechazado'));
        }

        $desde = trim((string) ($filtros['fecha_desde'] ?? ''));
        if ($desde !== '') {
            $query->whereDate('updated_at', '>=', $desde);
        }
        $hasta = trim((string) ($filtros['fecha_hasta'] ?? ''));
        if ($hasta !== '') {
            $query->whereDate('updated_at', '<=', $hasta);
        }

        $sort = (string) ($filtros['sort'] ?? 'updated_at');
        $dir = strtolower((string) ($filtros['direction'] ?? 'desc')) === 'asc' ? 'asc' : 'desc';
        $query->orderBy(match ($sort) {
            'folio', 'id' => 'id',
            'nombre' => 'id',
            default => 'updated_at',
        }, $dir);

        return $query;
    }

    /**
     * @return list<array{codigo: string, nombre: string, total: int, severidad: string, filtro: string}>
     */
    protected function motivosBloqueo(User $user): array
    {
        $conteos = array_fill_keys(array_keys(self::MOTIVOS_CODIGO), 0);

        $this->queryListado($user, [])
            ->with($this->eagerListado())
            ->orderByDesc('id')
            ->limit(200)
            ->get()
            ->each(function (InscripcionPeriodo $ins) use (&$conteos): void {
                $codigo = $this->resolverMotivoBloqueoCodigo($ins);
                if ($codigo !== null) {
                    $conteos[$codigo]++;
                }
            });

        $items = [];
        foreach (self::MOTIVOS_CODIGO as $codigo => $nombre) {
            $n = (int) ($conteos[$codigo] ?? 0);
            if ($n > 0) {
                $items[] = [
                    'codigo' => $codigo,
                    'nombre' => $nombre,
                    'total' => $n,
                    'n' => $n,
                    'label' => $nombre,
                    'severidad' => match ($codigo) {
                        'calificaciones_pendientes', 'adeudos_detectados' => 'danger',
                        'observaciones_pendientes' => 'warning',
                        default => 'info',
                    },
                    'filtro' => $codigo,
                ];
            }
        }

        usort($items, static fn (array $a, array $b): int => $b['total'] <=> $a['total']);

        return $items;
    }

    /**
     * @return array<string, mixed>
     */
    protected function filaListado(InscripcionPeriodo $ins): array
    {
        $alumno = $ins->matricula?->alumno;
        $codigoMotivo = $this->resolverMotivoBloqueoCodigo($ins);
        $estatus = $this->estatusEstructura($ins);
        $reqs = $this->evaluarRequisitos($ins);
        $completados = count(array_filter($reqs, fn ($r) => $r['cumple']));
        $total = count($reqs);
        $pct = $total > 0 ? (int) round(($completados / $total) * 100) : 0;
        $bloqueos = $this->bloqueosRequisitos($ins);

        return [
            'reinscripcion_id' => $ins->id,
            'alumno_id' => $alumno?->id,
            'folio' => $this->folioReinscripcion($ins->id),
            'alumno' => $this->nombreCompleto($alumno),
            'matricula' => $ins->matricula?->matricula ?? '—',
            'curp' => (string) ($alumno?->curp ?? '—'),
            'programa' => $ins->matricula?->ofertaAcademica?->planEstudio?->programaEstudio?->nombre ?? '—',
            'periodo' => $this->nombrePeriodo($ins->cicloEscolar, $ins->etiqueta_periodo_curricular),
            'tipo_inscripcion' => 'Reinscripción de periodo',
            'motivo' => $codigoMotivo ? (self::MOTIVOS_CODIGO[$codigoMotivo] ?? '—') : 'Ninguno',
            'motivo_bloqueo' => $codigoMotivo ? (self::MOTIVOS_CODIGO[$codigoMotivo] ?? '—') : 'Ninguno',
            'avance' => ['completados' => $completados, 'total' => $total, 'porcentaje' => $pct],
            'actualizado_en' => $ins->updated_at?->toIso8601String(),
            'estatus' => $estatus,
            'puede_desbloquear' => in_array($estatus['codigo'], ['bloqueada', 'observada'], true),
            'puede_completar' => $bloqueos === [] && ! in_array($estatus['codigo'], ['completada', 'cancelada'], true),
            'puede_ficha' => in_array($estatus['codigo'], ['desbloqueada', 'en_revision', 'por_completar', 'completada'], true),
            'bloqueos_confirmacion' => $bloqueos,
            'urls' => [
                'ver' => '/app/control-escolar/reinscripciones?search='.$this->folioReinscripcion($ins->id),
                'expediente' => $alumno ? '/app/alumnos/'.$alumno->id.'/expediente' : '/app/control-escolar/expedientes',
                'trayectoria' => $alumno ? '/app/control-escolar/trayectoria?search='.urlencode((string) $alumno->curp) : '/app/control-escolar/trayectoria',
                'ficha' => '/api/v1/control-escolar/reinscripciones/'.$ins->id.'/ficha',
            ],
            'expediente_url' => $alumno ? '/app/alumnos/'.$alumno->id.'/expediente' : '/app/control-escolar/expedientes',
        ];
    }

    /**
     * @return array{codigo: string, label: string}
     */
    protected function estatusEstructura(InscripcionPeriodo $ins): array
    {
        $codigo = $this->codigoEstatus($ins);
        $labels = [
            'iniciada' => 'Iniciada',
            'en_revision' => 'En revisión',
            'bloqueada' => 'Bloqueada',
            'observada' => 'Observada',
            'por_completar' => 'Por completar',
            'desbloqueada' => 'Desbloqueada',
            'completada' => 'Completada',
            'cancelada' => 'Cancelada',
        ];

        return ['codigo' => $codigo, 'label' => $labels[$codigo] ?? ucfirst($codigo)];
    }

    protected function codigoEstatus(InscripcionPeriodo $ins): string
    {
        $wf = $ins->metadata['reinscripcion_workflow'] ?? [];
        if (! empty($wf['estatus_codigo'])) {
            return (string) $wf['estatus_codigo'];
        }
        if ((string) $ins->estatus === 'cancelada') {
            return 'cancelada';
        }
        if ($this->resolverMotivoBloqueoCodigo($ins) === 'observaciones_pendientes') {
            return 'observada';
        }
        if ($this->resolverMotivoBloqueoCodigo($ins) !== null) {
            return 'bloqueada';
        }
        if ($ins->cargasAcademicas->isNotEmpty() && in_array((string) $ins->estatus, self::ESTATUS_INSCRIPCION_ACTIVA, true)) {
            return 'completada';
        }

        return 'en_revision';
    }

    protected function resolverMotivoBloqueoCodigo(InscripcionPeriodo $ins): ?string
    {
        if ($this->tieneCalificacionesPendientes($ins)) {
            return 'calificaciones_pendientes';
        }
        if ($this->tieneObservaciones($ins)) {
            return 'observaciones_pendientes';
        }
        if ($this->tieneDocumentosRechazados($ins)) {
            return 'documentos_incompletos';
        }
        if ($this->tieneImportacionBloqueada($ins)) {
            return 'validacion_normativa_pendiente';
        }
        if ($this->tieneTrayectoriaNoConsolidada($ins)) {
            return 'trayectoria_incompleta';
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
        $nombre = trim(implode(' ', array_filter([
            $alumno->nombre,
            $alumno->primer_apellido,
            $alumno->segundo_apellido,
        ])));
        if (stripos($nombre, 'demosynthetic') !== false) {
            return 'Alumno institucional';
        }

        return $nombre !== '' ? $nombre : 'Alumno sin nombre';
    }

    protected function nombrePeriodo(?CicloEscolar $ciclo, ?string $etiqueta): string
    {
        $nombre = $ciclo?->nombre ?? $etiqueta ?? '—';
        if (stripos($nombre, 'demo') !== false) {
            return $ciclo?->clave ? 'Ciclo '.$ciclo->clave : 'Periodo escolar';
        }

        return $nombre;
    }

    /**
     * @return list<array{key: string, nombre: string, cumple: bool}>
     */
    protected function evaluarRequisitos(InscripcionPeriodo $ins): array
    {
        $mat = $ins->matricula;
        $map = [
            'matricula' => $mat !== null && in_array((string) $mat->estado, self::ESTADOS_MATRICULA_ACTIVA, true),
            'continuidad' => $mat !== null && InscripcionPeriodo::query()->where('matricula_id', $mat->id)->where('id', '<', $ins->id)->exists(),
            'calificaciones' => ! $this->tieneCalificacionesPendientes($ins) && $ins->cargasAcademicas->isNotEmpty(),
            'documentos' => ! $this->tieneDocumentosRechazados($ins),
            'adeudos' => ! $this->tieneImportacionBloqueada($ins) && ! $this->tieneDocumentosRechazados($ins),
            'observaciones' => ! $this->tieneObservaciones($ins),
            'normativa' => ! $this->tieneImportacionBloqueada($ins),
        ];
        $out = [];
        foreach (self::REQUISITOS as $r) {
            $out[] = ['key' => $r['key'], 'nombre' => $r['nombre'], 'cumple' => (bool) ($map[$r['key']] ?? false)];
        }

        return $out;
    }

    /**
     * @return list<string>
     */
    protected function bloqueosRequisitos(InscripcionPeriodo $ins): array
    {
        $bloqueos = [];
        foreach ($this->evaluarRequisitos($ins) as $r) {
            if (! $r['cumple']) {
                $bloqueos[] = 'Pendiente: '.$r['nombre'].'.';
            }
        }

        return $bloqueos;
    }

    protected function filtroEstatus(Builder $query, string $estatus): void
    {
        match ($estatus) {
            'completada' => $query->whereHas('cargasAcademicas')->whereIn('estatus', self::ESTATUS_INSCRIPCION_ACTIVA),
            'bloqueada' => $query->where(function (Builder $q): void {
                $q->whereHas('cargasAcademicas.materiasCursadas', fn (Builder $m) => $m->whereNull('calificacion'))
                    ->orWhereIn('matricula_id', ImportacionHistoricaMaterias::query()->whereIn('estado', ['error', 'rechazada'])->pluck('matricula_id'));
            }),
            'observada' => $query->where(fn (Builder $q) => $this->filtroMotivoBloqueo($q, 'observaciones_pendientes')),
            'en_proceso' => $query->whereDoesntHave('cargasAcademicas'),
            default => null,
        };
    }

    protected function filtroMotivoBloqueo(Builder $query, string $codigo): void
    {
        match ($codigo) {
            'calificaciones_pendientes' => $query->whereHas('cargasAcademicas.materiasCursadas', fn (Builder $m) => $m->whereNull('calificacion')),
            'observaciones_pendientes' => $query->whereHas('matricula.alumno.documentosAcademicos.observacionesPendientes'),
            'documentos_incompletos' => $query->whereHas('matricula.alumno.documentosAcademicos', fn (Builder $d) => $d->where('estado_workflow', 'rechazado')),
            'validacion_normativa_pendiente' => $query->whereIn('matricula_id', ImportacionHistoricaMaterias::query()->whereIn('estado', ['error', 'rechazada'])->pluck('matricula_id')),
            default => null,
        };
    }

    /**
     * @return list<string>
     */
    protected function eagerListado(): array
    {
        return [
            'matricula.alumno:id,nombre,primer_apellido,segundo_apellido,curp',
            'matricula:id,matricula,alumno_id,oferta_academica_id,estado',
            'matricula.ofertaAcademica.planEstudio.programaEstudio',
            'matricula.ofertaAcademica',
            'matricula.trayectoriaAcademica',
            'matricula.alumno.documentosAcademicos.observacionesPendientes',
            'cicloEscolar:id,nombre,clave',
            'cargasAcademicas.materiasCursadas',
        ];
    }

    protected function inscripcionEnAlcance(User $user, int $id): InscripcionPeriodo
    {
        $ins = $this->queryListado($user, [])->where('id', $id)->first();
        if ($ins === null) {
            throw ValidationException::withMessages(['reinscripcion_id' => ['Reinscripción fuera de su alcance.']]);
        }

        return $ins;
    }

    protected function alumnoEnAlcance(User $user, int $alumnoId): Alumno
    {
        $alumno = $this->dashboard->queryAlumnosEnAlcance($user)->where('id', $alumnoId)->first();
        if ($alumno === null) {
            throw ValidationException::withMessages(['alumno_id' => ['Alumno fuera de su alcance.']]);
        }

        return $alumno;
    }

    /**
     * @param  array<string, mixed>  $patch
     */
    protected function touchWorkflow(InscripcionPeriodo $ins, array $patch): void
    {
        $meta = $ins->metadata ?? [];
        $meta['reinscripcion_workflow'] = array_merge($meta['reinscripcion_workflow'] ?? [], $patch);
        $ins->update(['metadata' => $meta]);
    }

    /**
     * @return array{codigo: string, nombre: string, descripcion: string, orden: int, estado: string, total_relacionado: int, accion_sugerida: ?string}
     */
    protected function pasoFlujo(string $codigo, string $nombre, string $desc, int $orden, int $rel, int $total, string $estado): array
    {
        return [
            'codigo' => $codigo,
            'nombre' => $nombre,
            'descripcion' => $desc,
            'orden' => $orden,
            'estado' => $estado,
            'total_relacionado' => $rel,
            'accion_sugerida' => match ($codigo) {
                'validacion' => 'Validar pendientes',
                'desbloqueo' => 'Desbloquear listas',
                'completada' => 'Confirmar listas',
                default => null,
            },
        ];
    }

    /**
     * @param  callable(int): array<string, mixed>  $accion
     * @return array{procesados: int, bloqueados: list<array<string, mixed>>, errores: list<string>}
     */
    protected function procesarMasivo(User $user, array $ids, callable $accion, string $evento): array
    {
        $procesados = 0;
        $bloqueados = [];
        foreach ($ids as $id) {
            try {
                $accion((int) $id);
                $procesados++;
            } catch (ValidationException $e) {
                $bloqueados[] = [
                    'id' => (int) $id,
                    'folio' => $this->folioReinscripcion((int) $id),
                    'errores' => array_values($e->errors()['requisitos'] ?? $e->errors()['bloqueos'] ?? ['No cumple requisitos.']),
                ];
            }
        }
        $this->registrarAuditoria($user, $evento, null, null, ['ids' => $ids, 'procesados' => $procesados]);

        return ['procesados' => $procesados, 'bloqueados' => $bloqueados, 'errores' => []];
    }

    protected function registrarAuditoria(User $user, string $evento, ?int $inscripcionId, ?int $alumnoId, array $payload): void
    {
        $this->auditoria->registrar(
            $evento,
            'inscripcion_periodo',
            $inscripcionId,
            $payload,
            $user->id,
            request()->ip(),
            (string) request()->userAgent(),
            ['modulo' => 'control_escolar_reinscripciones', 'alumno_id' => $alumnoId],
        );
    }

    /**
     * @return array{programas: list<array{id: int, nombre: string}>, sedes: list<array{id: int, nombre: string}>, periodos: list<array{id: int, nombre: string}>, estatus: list<array{value: string, label: string}>}
     */
    protected function catalogosFiltro(User $user): array
    {
        $ofertaIds = Matricula::query()
            ->whereIn('alumno_id', $this->dashboard->queryAlumnosEnAlcance($user)->select('id'))
            ->distinct()
            ->pluck('oferta_academica_id');
        $ofertas = OfertaAcademica::query()->whereIn('id', $ofertaIds)->get(['programa_estudio_id', 'sede_id']);

        return [
            'programas' => ProgramaEstudio::query()->whereIn('id', $ofertas->pluck('programa_estudio_id')->filter())->orderBy('nombre')->get(['id', 'nombre'])
                ->map(fn ($p) => ['id' => $p->id, 'nombre' => $p->nombre])->values()->all(),
            'sedes' => Sede::query()->whereIn('id', $ofertas->pluck('sede_id')->filter())->orderBy('nombre')->get(['id', 'nombre'])
                ->map(fn ($s) => ['id' => $s->id, 'nombre' => $s->nombre])->values()->all(),
            'periodos' => CicloEscolar::query()->orderByDesc('id')->limit(10)->get(['id', 'nombre', 'clave'])
                ->map(fn ($c) => ['id' => $c->id, 'nombre' => $this->nombrePeriodo($c, null)])->values()->all(),
            'estatus' => [
                ['value' => '', 'label' => 'Todos'],
                ['value' => 'en_proceso', 'label' => 'En proceso'],
                ['value' => 'bloqueada', 'label' => 'Bloqueada'],
                ['value' => 'observada', 'label' => 'Observada'],
                ['value' => 'completada', 'label' => 'Completada'],
            ],
            'motivos_bloqueo' => collect(self::MOTIVOS_CODIGO)->map(fn ($label, $code) => ['value' => $code, 'label' => $label])->values()->all(),
        ];
    }

    /**
     * @return array<string, bool>
     */
    protected function permisosUi(User $user): array
    {
        return [
            'ver' => $user->can('reinscripciones.ver'),
            'crear' => $user->can('reinscripciones.crear'),
            'desbloquear' => $user->can('reinscripciones.desbloquear'),
            'completar' => $user->can('reinscripciones.completar'),
            'observar' => $user->can('reinscripciones.observar'),
            'cancelar' => $user->can('reinscripciones.cancelar'),
            'exportar' => $user->can('reinscripciones.exportar') || $user->can('reportes.ver'),
            'ficha' => $user->can('reinscripciones.ficha.generar') || $user->can('reinscripciones.ficha.descargar'),
        ];
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
