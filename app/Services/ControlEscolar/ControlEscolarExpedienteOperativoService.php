<?php

declare(strict_types=1);

namespace App\Services\ControlEscolar;

use App\Models\Alumno;
use App\Models\AuditoriaEvento;
use App\Models\CicloEscolar;
use App\Models\DocumentoAcademico;
use App\Models\DocumentoObservacion;
use App\Models\InscripcionPeriodo;
use App\Models\Matricula;
use App\Models\OfertaAcademica;
use App\Models\ProgramaEstudio;
use App\Models\Sede;
use App\Models\User;
use App\Services\Certificacion\AuditoriaService;
use App\Services\Certificacion\CertificacionAlcanceService;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\UploadedFile;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ControlEscolarExpedienteOperativoService
{
    private const ESTATUS_INSCRIPCION_ACTIVA = ['activa', 'inscrita', 'cursando'];

    /** @var list<array{key: string, nombre: string, codigo: string}> */
    private const REQUISITOS = [
        ['key' => 'matricula', 'nombre' => 'Matrícula activa', 'codigo' => 'matricula'],
        ['key' => 'inscripcion', 'nombre' => 'Inscripción de periodo', 'codigo' => 'inscripcion'],
        ['key' => 'carga', 'nombre' => 'Carga académica', 'codigo' => 'carga'],
        ['key' => 'calificaciones', 'nombre' => 'Calificaciones capturadas', 'codigo' => 'calificaciones'],
        ['key' => 'documento', 'nombre' => 'Documento académico sin observaciones', 'codigo' => 'documento'],
    ];

    public function __construct(
        protected ControlEscolarDashboardService $dashboard,
        protected AuditoriaService $auditoria,
        protected CertificacionAlcanceService $alcance,
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
            $stats = $this->estadisticasExpediente($user);
            $query = $this->queryListado($user, $filtros);
            $paginator = $query->paginate($perPage, ['*'], 'page', $page);

            return [
                'success' => true,
                'actualizado_en' => now()->toIso8601String(),
                'metricas' => $stats['metricas'],
                'catalogos' => $this->catalogosFiltro($user),
                'permisos' => $this->permisosUi($user),
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
                'promedio_cumplimiento' => $stats['metricas']['promedio_requisitos_pct'] ?? 0,
                'actividad_reciente' => $this->actividadReciente($user),
            ];
        });
    }

    /**
     * @return array<string, mixed>
     */
    public function resumen(User $user): array
    {
        return $this->dashboard->conAlcanceUsuario($user, function () use ($user): array {
            $stats = $this->estadisticasExpediente($user);

            return array_merge($stats['metricas'], [
                'ultima_actualizacion' => now()->toIso8601String(),
            ]);
        });
    }

    /**
     * @return array{documentos: list<array<string, mixed>>, promedio_cumplimiento: int}
     */
    public function documentosRequeridos(User $user): array
    {
        return $this->dashboard->conAlcanceUsuario($user, function () use ($user): array {
            $stats = $this->estadisticasExpediente($user);

            return [
                'documentos' => $stats['requisitos'],
                'promedio_cumplimiento' => (int) ($stats['metricas']['promedio_requisitos_pct'] ?? 0),
            ];
        });
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function actividadReciente(User $user, int $limit = 8): array
    {
        return $this->dashboard->conAlcanceUsuario($user, fn (): array => $this->actividadRecienteInterno($user, $limit));
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    public function crear(User $user, array $data): array
    {
        return $this->dashboard->conAlcanceUsuario($user, function () use ($user, $data): array {
            $alumno = $this->alumnoEnAlcance($user, (int) $data['alumno_id']);
            $meta = $alumno->metadata ?? [];
            $operativo = $meta['expediente_operativo'] ?? [];

            if (! empty($operativo['creado_at']) && ($operativo['estatus'] ?? '') !== 'rechazado') {
                throw ValidationException::withMessages([
                    'alumno_id' => ['Ya existe un expediente operativo activo para este alumno.'],
                ]);
            }

            $cicloId = (int) ($data['ciclo_escolar_id'] ?? 0);
            if ($cicloId <= 0) {
                $cicloId = (int) (CicloEscolar::query()->where('es_actual', true)->orWhere('activo', true)->orderByDesc('id')->value('id') ?? 0);
            }

            $operativo = [
                'estatus' => 'pendiente',
                'creado_at' => now()->toIso8601String(),
                'creado_por' => $user->id,
                'ciclo_escolar_id' => $cicloId,
                'tipo' => (string) ($data['tipo_expediente'] ?? 'operativo'),
            ];
            $meta['expediente_operativo'] = $operativo;
            $alumno->update(['metadata' => $meta]);

            $this->registrarAuditoria($user, 'expediente.crear', $alumno->id, ['folio' => $this->folioExpediente($alumno->id)]);

            return $this->filaListado($alumno->fresh($this->eagerListado()));
        });
    }

    /**
     * @return array<string, mixed>
     */
    public function cargarDocumento(User $user, int $alumnoId, string $tipoDocumento, UploadedFile $archivo): array
    {
        return $this->dashboard->conAlcanceUsuario($user, function () use ($user, $alumnoId, $tipoDocumento, $archivo): array {
            $alumno = $this->alumnoEnAlcance($user, $alumnoId);
            $this->assertNoValidado($alumno);

            $mat = $alumno->matriculaActiva;
            $path = $archivo->store('expedientes/'.$alumno->id, 'local');

            $doc = DocumentoAcademico::query()->create([
                'alumno_id' => $alumno->id,
                'matricula_id' => $mat?->id,
                'oferta_academica_id' => $mat?->oferta_academica_id,
                'tipo_documento' => $tipoDocumento,
                'estado_workflow' => 'borrador',
                'folio_interno' => 'EXP-DOC-'.$alumno->id.'-'.now()->format('YmdHis'),
                'fecha_solicitud' => now(),
                'created_by' => $user->id,
                'metadata' => [
                    'archivo_path' => $path,
                    'archivo_nombre' => $archivo->getClientOriginalName(),
                    'origen' => 'control_escolar_expediente',
                ],
            ]);

            $this->touchExpediente($alumno, 'en_revision');
            $this->registrarAuditoria($user, 'expediente.documento_cargar', $alumno->id, [
                'documento_id' => $doc->id,
                'tipo' => $tipoDocumento,
            ]);

            return $this->filaListado($alumno->fresh($this->eagerListado()));
        });
    }

    /**
     * @return array<string, mixed>
     */
    public function validar(User $user, int $alumnoId, ?string $comentario = null): array
    {
        return $this->dashboard->conAlcanceUsuario($user, function () use ($user, $alumnoId, $comentario): array {
            $alumno = $this->alumnoEnAlcance($user, $alumnoId);
            $bloqueos = $this->bloqueosValidacion($alumno);
            if ($bloqueos !== []) {
                throw ValidationException::withMessages([
                    'documentos' => $bloqueos,
                ])->status(422);
            }

            $meta = $alumno->metadata ?? [];
            $meta['expediente_operativo'] = array_merge($meta['expediente_operativo'] ?? [], [
                'estatus' => 'validado',
                'validado_at' => now()->toIso8601String(),
                'validado_por' => $user->id,
                'comentario_validacion' => $comentario,
            ]);
            $alumno->update(['metadata' => $meta]);

            $this->registrarAuditoria($user, 'expediente.validar', $alumno->id, ['comentario' => $comentario]);

            return $this->filaListado($alumno->fresh($this->eagerListado()));
        });
    }

    /**
     * @return array<string, mixed>
     */
    public function observar(User $user, int $alumnoId, string $motivo, ?string $descripcion = null): array
    {
        return $this->dashboard->conAlcanceUsuario($user, function () use ($user, $alumnoId, $motivo, $descripcion): array {
            $alumno = $this->alumnoEnAlcance($user, $alumnoId);
            $doc = $alumno->documentosAcademicos()->latest('id')->first();

            if ($doc !== null) {
                DocumentoObservacion::query()->create([
                    'documento_academico_id' => $doc->id,
                    'tipo' => 'expediente_operativo',
                    'observacion' => $motivo.($descripcion ? ': '.$descripcion : ''),
                    'estado' => 'pendiente',
                    'prioridad' => 'alta',
                    'creada_por' => $user->id,
                ]);
                $doc->update(['estado_workflow' => 'rechazado']);
            }

            $meta = $alumno->metadata ?? [];
            $meta['expediente_operativo'] = array_merge($meta['expediente_operativo'] ?? [], [
                'estatus' => 'observado',
                'observado_at' => now()->toIso8601String(),
                'observado_por' => $user->id,
                'motivo' => $motivo,
            ]);
            $alumno->update(['metadata' => $meta]);

            $this->registrarAuditoria($user, 'expediente.observar', $alumno->id, ['motivo' => $motivo]);

            return $this->filaListado($alumno->fresh($this->eagerListado()));
        });
    }

    /**
     * @param  list<int>  $ids
     * @return array{procesados: int, bloqueados: list<array{id: int, folio: string, errores: list<string>}>, errores: list<string>}
     */
    public function validarMasivo(User $user, array $ids): array
    {
        return $this->dashboard->conAlcanceUsuario($user, function () use ($user, $ids): array {
            $procesados = 0;
            $bloqueados = [];

            foreach ($ids as $id) {
                try {
                    $this->validar($user, (int) $id);
                    $procesados++;
                } catch (ValidationException $e) {
                    $bloqueados[] = [
                        'id' => (int) $id,
                        'folio' => $this->folioExpediente((int) $id),
                        'errores' => array_values($e->errors()['documentos'] ?? ['No cumple requisitos.']),
                    ];
                }
            }

            $this->registrarAuditoria($user, 'expediente.validar_masivo', null, ['ids' => $ids, 'procesados' => $procesados]);

            return compact('procesados', 'bloqueados') + ['errores' => []];
        });
    }

    /**
     * @param  list<int>  $ids
     * @return array{procesados: int, errores: list<string>}
     */
    public function observarMasivo(User $user, array $ids, string $motivo, ?string $descripcion = null): array
    {
        return $this->dashboard->conAlcanceUsuario($user, function () use ($user, $ids, $motivo, $descripcion): array {
            $procesados = 0;
            foreach ($ids as $id) {
                $this->observar($user, (int) $id, $motivo, $descripcion);
                $procesados++;
            }
            $this->registrarAuditoria($user, 'expediente.observar_masivo', null, ['ids' => $ids, 'procesados' => $procesados]);

            return ['procesados' => $procesados, 'errores' => []];
        });
    }

    /**
     * @param  array<string, mixed>  $filtros
     */
    public function exportarCsv(User $user, array $filtros): StreamedResponse
    {
        /** @var StreamedResponse $response */
        $response = $this->dashboard->conAlcanceUsuario($user, function () use ($user, $filtros): StreamedResponse {
            $this->registrarAuditoria($user, 'expediente.exportar', null, ['filtros' => $filtros]);

            return response()->streamDownload(function () use ($user, $filtros): void {
                $out = fopen('php://output', 'w');
                if ($out === false) {
                    return;
                }
                fputcsv($out, ['folio', 'alumno', 'matricula', 'curp', 'programa', 'avance', 'estatus', 'actualizado']);
                $this->queryListado($user, $filtros)->chunk(150, function ($alumnos) use ($out): void {
                    foreach ($alumnos as $alumno) {
                        $f = $this->filaListado($alumno);
                        fputcsv($out, [
                            $f['folio'],
                            $f['alumno'],
                            $f['matricula'],
                            $f['curp'],
                            $f['programa'],
                            $f['avance']['completados'].'/'.$f['avance']['total'].' ('.$f['avance']['porcentaje'].'%)',
                            $f['estatus']['label'],
                            $f['actualizado_en'],
                        ]);
                    }
                });
                fclose($out);
            }, 'expedientes_'.now()->format('Y-m-d_His').'.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
        });

        return $response;
    }

    /**
     * @param  array<string, mixed>  $filtros
     * @return Builder<Alumno>
     */
    protected function queryListado(User $user, array $filtros): Builder
    {
        $query = $this->dashboard->queryAlumnosEnAlcance($user)
            ->with($this->eagerListado());

        $sort = (string) ($filtros['sort'] ?? $filtros['sort_by'] ?? 'updated_at');
        $dir = strtolower((string) ($filtros['direction'] ?? $filtros['sort_dir'] ?? 'desc')) === 'asc' ? 'asc' : 'desc';
        $query->orderBy(match ($sort) {
            'folio', 'alumno_id' => 'id',
            'nombre' => 'nombre',
            'curp' => 'curp',
            default => 'updated_at',
        }, $dir)->orderByDesc('id');

        $term = trim((string) ($filtros['search'] ?? ''));
        if ($term !== '') {
            $like = '%'.$term.'%';
            $folioId = $this->resolverAlumnoIdDesdeFolio($term);
            $query->where(function (Builder $q) use ($like, $folioId): void {
                $q->where('curp', 'like', $like)
                    ->orWhere('nombre', 'like', $like)
                    ->orWhere('primer_apellido', 'like', $like)
                    ->orWhere('segundo_apellido', 'like', $like)
                    ->orWhereHas('matriculas', fn (Builder $m) => $m->where('matricula', 'like', $like));
                if ($folioId !== null) {
                    $q->orWhere('id', $folioId);
                }
            });
        }

        $estatus = trim((string) ($filtros['estatus'] ?? ''));
        if ($estatus === 'pendiente') {
            $query->where(fn (Builder $q) => $this->aplicarFiltroPendientes($q));
        } elseif ($estatus === 'completo') {
            $query->where(fn (Builder $q) => $this->aplicarFiltroCompletos($q));
        } elseif ($estatus === 'observado') {
            $query->where(fn (Builder $q) => $this->aplicarFiltroObservaciones($q));
        } elseif ($estatus === 'validado') {
            $query->where('metadata->expediente_operativo->estatus', 'validado');
        } elseif ($estatus === 'documentos_faltantes') {
            $query->whereDoesntHave('documentosAcademicos', fn (Builder $q) => $q->where('estado_workflow', 'aprobado'));
        }

        $programaId = (int) ($filtros['programa_id'] ?? 0);
        if ($programaId > 0) {
            $query->whereHas('matriculaActiva.ofertaAcademica', fn (Builder $o) => $o->where('programa_estudio_id', $programaId));
        }

        $sedeId = (int) ($filtros['sede_id'] ?? 0);
        if ($sedeId > 0) {
            $query->whereHas('matriculaActiva.ofertaAcademica', fn (Builder $o) => $o->where('sede_id', $sedeId));
        }

        $docFaltante = trim((string) ($filtros['documento_faltante'] ?? $filtros['documentos_faltantes'] ?? ''));
        if ($docFaltante !== '') {
            $query->where(fn (Builder $q) => $this->aplicarFiltroDocumentoFaltante($q, $docFaltante));
        }

        if (($filtros['con_observaciones'] ?? '') === '1' || ($filtros['con_observaciones'] ?? '') === 'true') {
            $query->where(fn (Builder $q) => $this->aplicarFiltroObservaciones($q));
        }

        $desde = trim((string) ($filtros['fecha_desde'] ?? ''));
        if ($desde !== '') {
            $query->whereDate('updated_at', '>=', $desde);
        }
        $hasta = trim((string) ($filtros['fecha_hasta'] ?? ''));
        if ($hasta !== '') {
            $query->whereDate('updated_at', '<=', $hasta);
        }

        return $query;
    }

    protected function aplicarFiltroPendientes(Builder $query): void
    {
        $query->where(function (Builder $q): void {
            $q->whereNull('metadata->expediente_operativo->estatus')
                ->orWhere('metadata->expediente_operativo->estatus', 'pendiente');
        })->whereDoesntHave('documentosAcademicos', function (Builder $d): void {
            $d->where('estado_workflow', 'rechazado')->orWhereHas('observacionesPendientes');
        });
    }

    protected function aplicarFiltroCompletos(Builder $query): void
    {
        $query->whereHas('matriculaActiva')
            ->whereHas('matriculaActiva.inscripcionesPeriodo', fn (Builder $q) => $q->whereIn('estatus', self::ESTATUS_INSCRIPCION_ACTIVA))
            ->whereHas('matriculaActiva.inscripcionesPeriodo.cargasAcademicas.materiasCursadas', fn (Builder $m) => $m->whereNotNull('calificacion'))
            ->whereDoesntHave('documentosAcademicos', function (Builder $d): void {
                $d->where('estado_workflow', 'rechazado')->orWhereHas('observacionesPendientes');
            });
    }

    protected function aplicarFiltroObservaciones(Builder $query): void
    {
        $query->where(function (Builder $q): void {
            $q->where('metadata->expediente_operativo->estatus', 'observado')
                ->orWhereHas('documentosAcademicos', function (Builder $d): void {
                    $d->where('estado_workflow', 'rechazado')->orWhereHas('observacionesPendientes');
                });
        });
    }

    protected function aplicarFiltroDocumentoFaltante(Builder $query, string $key): void
    {
        match ($key) {
            'matricula' => $query->whereDoesntHave('matriculaActiva'),
            'inscripcion' => $query->whereHas('matriculaActiva')->whereDoesntHave('matriculaActiva.inscripcionesPeriodo', fn (Builder $q) => $q->whereIn('estatus', self::ESTATUS_INSCRIPCION_ACTIVA)),
            'carga' => $query->whereDoesntHave('matriculaActiva.inscripcionesPeriodo.cargasAcademicas'),
            'calificaciones' => $query->whereDoesntHave('matriculaActiva.inscripcionesPeriodo.cargasAcademicas.materiasCursadas', fn (Builder $m) => $m->whereNotNull('calificacion')),
            'documento' => $query->whereDoesntHave('documentosAcademicos', fn (Builder $d) => $d->where('estado_workflow', 'aprobado')),
            default => null,
        };
    }

    /**
     * @return list<string>
     */
    protected function bloqueosValidacion(Alumno $alumno): array
    {
        $bloqueos = [];
        foreach ($this->evaluarRequisitos($alumno) as $req) {
            if (! $req['cumple']) {
                $bloqueos[] = 'Falta: '.$req['nombre'].'.';
            }
        }
        if ($this->tieneObservacionesDocumentales($alumno)) {
            $bloqueos[] = 'Hay observaciones pendientes por atender.';
        }

        return $bloqueos;
    }

    /**
     * @return list<array{key: string, nombre: string, cumple: bool}>
     */
    protected function evaluarRequisitos(Alumno $alumno): array
    {
        $mat = $alumno->matriculaActiva;
        $ins = $mat?->inscripcionesPeriodo?->first();
        $tieneCarga = $ins?->cargasAcademicas?->isNotEmpty() ?? false;
        $tieneCalif = false;
        if ($tieneCarga) {
            $tieneCalif = $ins->cargasAcademicas->contains(
                fn ($c) => $c->materiasCursadas->contains(fn ($m) => $m->calificacion !== null)
            );
        }
        $docOk = $alumno->documentosAcademicos->contains(
            fn (DocumentoAcademico $d) => $d->estado_workflow === 'aprobado' && $d->observacionesPendientes->isEmpty()
        ) || (
            $alumno->documentosAcademicos->isNotEmpty()
            && ! $this->tieneObservacionesDocumentales($alumno)
        );

        $map = [
            'matricula' => $mat !== null,
            'inscripcion' => $ins !== null && in_array((string) $ins->estatus, self::ESTATUS_INSCRIPCION_ACTIVA, true),
            'carga' => $tieneCarga,
            'calificaciones' => $tieneCalif,
            'documento' => $docOk,
        ];

        $out = [];
        foreach (self::REQUISITOS as $r) {
            $out[] = ['key' => $r['key'], 'nombre' => $r['nombre'], 'cumple' => (bool) ($map[$r['key']] ?? false)];
        }

        return $out;
    }

    /**
     * @return array{metricas: array<string, int|float>, requisitos: list<array<string, mixed>>}
     */
    protected function estadisticasExpediente(User $user): array
    {
        $base = $this->dashboard->queryAlumnosEnAlcance($user);
        $total = max(1, (clone $base)->count());
        $totalReal = (clone $base)->count();

        $conObs = (clone $base)->where(fn (Builder $q) => $this->aplicarFiltroObservaciones($q))->count();
        $completos = (clone $base)->where(fn (Builder $q) => $this->aplicarFiltroCompletos($q))->count();
        $validados = (clone $base)->where('metadata->expediente_operativo->estatus', 'validado')->count();
        $pendientes = max(0, $totalReal - $completos - $conObs);
        $sinDoc = (clone $base)->whereDoesntHave('documentosAcademicos', fn (Builder $q) => $q->where('estado_workflow', 'aprobado'))->count();

        $conteos = ['matricula' => 0, 'inscripcion' => 0, 'carga' => 0, 'calificaciones' => 0, 'documento' => 0];
        (clone $base)->with($this->eagerListado())->chunk(100, function ($chunk) use (&$conteos): void {
            foreach ($chunk as $alumno) {
                foreach ($this->evaluarRequisitos($alumno) as $r) {
                    if ($r['cumple']) {
                        $conteos[$r['key']]++;
                    }
                }
            }
        });

        $requisitos = [];
        $sumPct = 0;
        foreach (self::REQUISITOS as $r) {
            $cumplen = (int) ($conteos[$r['key']] ?? 0);
            $pct = (int) round(($cumplen / $total) * 100);
            $sumPct += $pct;
            $requisitos[] = [
                'codigo' => $r['codigo'],
                'nombre' => $r['nombre'],
                'obligatorio' => true,
                'total_requerido' => $totalReal,
                'total_completado' => $cumplen,
                'porcentaje' => $pct,
                'estado' => $pct >= 85 ? 'ok' : ($pct >= 60 ? 'warning' : 'danger'),
                'req' => 'Obligatorio',
                'comp' => $cumplen.' / '.$totalReal,
                'ok' => $pct >= 85,
                'pct' => $pct,
            ];
        }

        return [
            'metricas' => [
                'expedientes_pendientes' => $pendientes,
                'pendientes' => $pendientes,
                'completos' => $completos,
                'con_observaciones' => $conObs,
                'documentos_faltantes' => $sinDoc,
                'validados' => $validados,
                'total_en_alcance' => $totalReal,
                'total_alcance' => $totalReal,
                'promedio_requisitos_pct' => (int) round($sumPct / count(self::REQUISITOS)),
            ],
            'requisitos' => $requisitos,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    protected function filaListado(Alumno $alumno): array
    {
        $mat = $alumno->matriculaActiva;
        $prog = $mat?->ofertaAcademica?->programaEstudio ?? $mat?->ofertaAcademica?->planEstudio?->programaEstudio;
        $reqs = $this->evaluarRequisitos($alumno);
        $completados = count(array_filter($reqs, fn ($r) => $r['cumple']));
        $total = count($reqs);
        $pct = $total > 0 ? (int) round(($completados / $total) * 100) : 0;
        $estatus = $this->estatusExpediente($alumno);
        $bloqueos = $this->bloqueosValidacion($alumno);

        return [
            'alumno_id' => $alumno->id,
            'folio' => $this->folioExpediente($alumno->id),
            'alumno' => $this->nombreInstitucional($alumno),
            'email' => (string) ($alumno->metadata['email'] ?? ''),
            'matricula' => $mat?->matricula ?? '—',
            'curp' => (string) ($alumno->curp ?? '—'),
            'programa' => $prog?->nombre ?? '—',
            'avance' => [
                'completados' => $completados,
                'total' => $total,
                'porcentaje' => $pct,
                'severidad' => $pct >= 90 ? 'success' : ($pct >= 60 ? 'warning' : 'danger'),
            ],
            'actualizado_en' => $alumno->updated_at?->toIso8601String(),
            'estatus' => $estatus,
            'puede_validar' => $bloqueos === [] && $estatus['codigo'] !== 'validado',
            'bloqueos_validacion' => $bloqueos,
            'urls' => [
                'ver' => '/app/alumnos/'.$alumno->id.'/expediente',
                'editar' => '/app/alumnos/'.$alumno->id.'/captura-guiado',
                'cargar_documento' => '/app/certificacion/solicitud?alumno_id='.$alumno->id,
                'descargar' => '/app/documentos?alumno_id='.$alumno->id,
            ],
        ];
    }

    /**
     * @return array{codigo: string, label: string}
     */
    protected function estatusExpediente(Alumno $alumno): array
    {
        $codigo = (string) (($alumno->metadata['expediente_operativo']['estatus'] ?? '') ?: '');

        if ($codigo === 'validado') {
            return ['codigo' => 'validado', 'label' => 'Validado'];
        }
        if ($codigo === 'observado' || $this->tieneObservacionesDocumentales($alumno)) {
            return ['codigo' => 'observado', 'label' => 'Observado'];
        }
        if ($codigo === 'en_revision') {
            return ['codigo' => 'en_revision', 'label' => 'En revisión'];
        }
        if ($this->expedienteOperativoCompleto($alumno)) {
            return ['codigo' => 'completo', 'label' => 'Completo'];
        }

        return ['codigo' => 'pendiente', 'label' => 'Pendiente'];
    }

    protected function expedienteOperativoCompleto(Alumno $alumno): bool
    {
        $reqs = $this->evaluarRequisitos($alumno);

        return $reqs !== [] && collect($reqs)->every(fn (array $r) => $r['cumple']);
    }

    protected function tieneObservacionesDocumentales(Alumno $alumno): bool
    {
        return $alumno->documentosAcademicos->contains(function (DocumentoAcademico $doc): bool {
            if ($doc->estado_workflow === 'rechazado') {
                return true;
            }

            return $doc->relationLoaded('observacionesPendientes')
                ? $doc->observacionesPendientes->isNotEmpty()
                : $doc->observacionesPendientes()->exists();
        });
    }

    /**
     * @return list<array<string, mixed>>
     */
    protected function actividadRecienteInterno(User $user, int $limit): array
    {
        $eventos = AuditoriaEvento::query()
            ->whereIn('evento', [
                'expediente.crear',
                'expediente.documento_cargar',
                'expediente.validar',
                'expediente.observar',
                'expediente.validar_masivo',
                'expediente.observar_masivo',
                'expediente.exportar',
            ])
            ->latest('id')
            ->limit($limit)
            ->get();

        if ($eventos->isEmpty()) {
            return $this->actividadFallback($user, $limit);
        }

        return $eventos->map(function (AuditoriaEvento $ev): array {
            $folio = isset($ev->payload['folio']) ? (string) $ev->payload['folio'] : ($ev->entidad_id ? $this->folioExpediente((int) $ev->entidad_id) : '—');

            return [
                'id' => $ev->id,
                'tipo' => $ev->evento,
                'titulo' => $this->tituloActividad((string) $ev->evento),
                'descripcion' => $folio,
                'expediente_folio' => $folio,
                'usuario' => $ev->user_id ? 'Usuario #'.$ev->user_id : 'Sistema',
                'fecha' => $ev->created_at?->toIso8601String(),
                'tiempo_relativo' => $this->horaRelativa($ev->created_at),
                'severidad' => str_contains((string) $ev->evento, 'observ') ? 'warning' : (str_contains((string) $ev->evento, 'valid') ? 'success' : 'info'),
            ];
        })->all();
    }

    /**
     * @return list<array<string, mixed>>
     */
    protected function actividadFallback(User $user, int $limit): array
    {
        $items = [];
        $docs = DocumentoAcademico::query();
        $this->alcance->aplicarAlcanceDocumentosAcademicos($docs, $user);
        foreach ($docs->latest('updated_at')->limit($limit)->with('alumno')->get() as $doc) {
            $items[] = [
                'id' => 'doc-'.$doc->id,
                'tipo' => 'documento_cargado',
                'titulo' => 'Documento actualizado',
                'descripcion' => $this->folioExpediente((int) $doc->alumno_id),
                'expediente_folio' => $this->folioExpediente((int) $doc->alumno_id),
                'fecha' => $doc->updated_at?->toIso8601String(),
                'tiempo_relativo' => $this->horaRelativa($doc->updated_at),
                'severidad' => 'info',
            ];
        }

        return $items;
    }

    protected function tituloActividad(string $evento): string
    {
        return match ($evento) {
            'expediente.crear' => 'Expediente creado',
            'expediente.documento_cargar' => 'Documento cargado',
            'expediente.validar', 'expediente.validar_masivo' => 'Expediente validado',
            'expediente.observar', 'expediente.observar_masivo' => 'Expediente observado',
            'expediente.exportar' => 'Exportación de expedientes',
            default => 'Actividad de expediente',
        };
    }

    protected function alumnoEnAlcance(User $user, int $alumnoId): Alumno
    {
        $alumno = $this->dashboard->queryAlumnosEnAlcance($user)
            ->with($this->eagerListado())
            ->where('id', $alumnoId)
            ->first();

        if ($alumno === null) {
            throw ValidationException::withMessages(['alumno_id' => ['Expediente fuera de su alcance.']]);
        }

        return $alumno;
    }

    protected function assertNoValidado(Alumno $alumno): void
    {
        if (($alumno->metadata['expediente_operativo']['estatus'] ?? '') === 'validado') {
            throw ValidationException::withMessages([
                'expediente' => ['El expediente ya está validado.'],
            ]);
        }
    }

    protected function touchExpediente(Alumno $alumno, string $estatus): void
    {
        $meta = $alumno->metadata ?? [];
        $meta['expediente_operativo'] = array_merge($meta['expediente_operativo'] ?? [], [
            'estatus' => $estatus,
            'actualizado_at' => now()->toIso8601String(),
        ]);
        $alumno->update(['metadata' => $meta]);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    protected function registrarAuditoria(User $user, string $evento, ?int $alumnoId, array $payload = []): void
    {
        $this->auditoria->registrar(
            $evento,
            'alumno',
            $alumnoId,
            $payload,
            $user->id,
            request()->ip(),
            (string) request()->userAgent(),
            ['modulo' => 'control_escolar_expedientes'],
        );
    }

    /**
     * @return list<string>
     */
    protected function eagerListado(): array
    {
        return [
            'matriculaActiva.ofertaAcademica.programaEstudio',
            'matriculaActiva.ofertaAcademica.planEstudio',
            'matriculaActiva.ofertaAcademica.sede',
            'matriculaActiva.inscripcionesPeriodo' => fn ($q) => $q
                ->whereIn('estatus', self::ESTATUS_INSCRIPCION_ACTIVA)
                ->orderByDesc('id')
                ->limit(1)
                ->with(['cargasAcademicas.materiasCursadas']),
            'documentosAcademicos.observacionesPendientes',
        ];
    }

    /**
     * @return array{programas: list<array{id: int, nombre: string}>, sedes: list<array{id: int, nombre: string}>, estatus: list<array{value: string, label: string}>}
     */
    protected function catalogosFiltro(User $user): array
    {
        $ofertaIds = Matricula::query()
            ->whereIn('alumno_id', $this->dashboard->queryAlumnosEnAlcance($user)->select('alumnos.id'))
            ->distinct()
            ->pluck('oferta_academica_id');
        $ofertas = OfertaAcademica::query()->whereIn('id', $ofertaIds)->get(['programa_estudio_id', 'sede_id']);

        return [
            'programas' => ProgramaEstudio::query()->whereIn('id', $ofertas->pluck('programa_estudio_id')->filter())->orderBy('nombre')->get(['id', 'nombre'])
                ->map(fn ($p) => ['id' => $p->id, 'nombre' => $p->nombre])->values()->all(),
            'sedes' => Sede::query()->whereIn('id', $ofertas->pluck('sede_id')->filter())->orderBy('nombre')->get(['id', 'nombre'])
                ->map(fn ($s) => ['id' => $s->id, 'nombre' => $s->nombre])->values()->all(),
            'estatus' => [
                ['value' => '', 'label' => 'Todos'],
                ['value' => 'pendiente', 'label' => 'Pendiente'],
                ['value' => 'en_revision', 'label' => 'En revisión'],
                ['value' => 'observado', 'label' => 'Observado'],
                ['value' => 'completo', 'label' => 'Completo'],
                ['value' => 'validado', 'label' => 'Validado'],
                ['value' => 'documentos_faltantes', 'label' => 'Documentos faltantes'],
            ],
            'documentos_faltantes' => collect(self::REQUISITOS)->map(fn ($r) => ['value' => $r['key'], 'label' => $r['nombre']])->all(),
        ];
    }

    /**
     * @return array<string, bool>
     */
    protected function permisosUi(User $user): array
    {
        return [
            'ver' => $user->can('expedientes.ver') || $user->can('ver_alumnos'),
            'crear' => $user->can('expedientes.crear'),
            'editar' => $user->can('expedientes.editar'),
            'validar' => $user->can('expedientes.validar') || $user->can('expedientes.revisar'),
            'observar' => $user->can('expedientes.observar') || $user->can('observaciones.crear'),
            'exportar' => $user->can('expedientes.exportar') || $user->can('reportes.ver'),
            'cargar_documento' => $user->can('expedientes.documentos.cargar') || $user->can('documentos.crear_borrador'),
            'descargar' => $user->can('expedientes.documentos.descargar') || $user->can('documentos.ver'),
            'validacion_masiva' => $user->can('expedientes.validacion.masiva') || $user->can('expedientes.validar'),
            'observacion_masiva' => $user->can('expedientes.observacion.masiva') || $user->can('expedientes.observar'),
        ];
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

    protected function nombreInstitucional(?Alumno $alumno): string
    {
        if ($alumno === null) {
            return 'Alumno no disponible';
        }
        $nombre = trim(implode(' ', array_filter([$alumno->nombre, $alumno->primer_apellido, $alumno->segundo_apellido])));
        if (stripos($nombre, 'demosynthetic') !== false) {
            return 'Alumno de prueba institucional';
        }

        return $nombre !== '' ? $nombre : 'Alumno sin nombre';
    }

    protected function horaRelativa(?Carbon $fecha): string
    {
        return $fecha?->locale('es')->diffForHumans(short: true) ?? '—';
    }
}
