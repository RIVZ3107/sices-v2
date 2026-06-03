<?php

declare(strict_types=1);

namespace App\Services\ControlEscolar;

use App\Models\Alumno;
use App\Models\AuditoriaEvento;
use App\Models\CargaAcademica;
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
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ControlEscolarInscripcionesService
{
    private const ESTATUS_INSCRIPCION_ACTIVA = ['activa', 'inscrita', 'cursando'];

    private const ESTADOS_MATRICULA_ACTIVA = ['activa', 'vigente'];

    private const WORKFLOW_KEY = 'inscripcion_workflow';

    /** @var list<array{key: string, nombre: string}> */
    private const REQUISITOS_DOCUMENTALES = [
        ['key' => 'matricula', 'nombre' => 'Matrícula activa'],
        ['key' => 'documento', 'nombre' => 'Documento académico cargado'],
        ['key' => 'sin_observaciones', 'nombre' => 'Sin observaciones pendientes'],
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
            $query = $this->queryListado($user, $filtros);
            $paginator = $query->paginate($perPage, ['*'], 'page', $page);

            return [
                'actualizado_en' => now()->toIso8601String(),
                'metricas' => $this->metricas($user),
                'regla_matricula' => 'La inscripción de periodo requiere matrícula activa del alumno en tu alcance territorial.',
                'catalogos' => $this->catalogosFiltro($user),
                'permisos' => $this->permisosUi($user),
                'listado' => [
                    'data' => collect($paginator->items())
                        ->map(fn (InscripcionPeriodo $ins) => $this->filaListado($ins, $user))
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
                'proceso_pasos' => $this->procesoPasos($user),
                'fechas_importantes' => $this->fechasImportantesInterno($user),
                'actividad_reciente' => $this->actividadRecienteInterno($user, 8),
            ];
        });
    }

    /**
     * @return array<string, mixed>
     */
    public function resumen(User $user): array
    {
        return $this->dashboard->conAlcanceUsuario($user, function () use ($user): array {
            return array_merge($this->metricas($user), [
                'ultima_actualizacion' => now()->toIso8601String(),
            ]);
        });
    }

    /**
     * @return array{pasos: list<array<string, mixed>>}
     */
    public function proceso(User $user): array
    {
        return $this->dashboard->conAlcanceUsuario($user, fn (): array => [
            'pasos' => $this->procesoPasos($user),
        ]);
    }

    /**
     * @return list<array{fecha: string, mes: string, titulo: string, sub: string, badge: string}>
     */
    public function fechasImportantes(User $user): array
    {
        return $this->dashboard->conAlcanceUsuario($user, fn (): array => $this->fechasImportantesInterno($user));
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
            $mat = $alumno->matriculaActiva;

            if ($mat === null) {
                throw ValidationException::withMessages([
                    'alumno_id' => ['El alumno no tiene matrícula activa.'],
                ]);
            }

            $cicloId = (int) ($data['ciclo_escolar_id'] ?? 0);
            if ($cicloId <= 0) {
                $cicloId = (int) (CicloEscolar::query()
                    ->where(fn (Builder $q) => $q->where('es_actual', true)->orWhere('activo', true))
                    ->orderByDesc('es_actual')
                    ->orderByDesc('id')
                    ->value('id') ?? 0);
            }

            if ($cicloId <= 0) {
                throw ValidationException::withMessages([
                    'ciclo_escolar_id' => ['No hay ciclo escolar vigente configurado.'],
                ]);
            }

            $semestre = (int) ($data['semestre'] ?? 1);
            $semestre = max(1, min(20, $semestre));

            $existe = InscripcionPeriodo::query()
                ->where('matricula_id', $mat->id)
                ->where('ciclo_escolar_id', $cicloId)
                ->where('semestre', $semestre)
                ->whereNotIn('estatus', ['cancelada', 'baja'])
                ->exists();

            if ($existe) {
                throw ValidationException::withMessages([
                    'alumno_id' => ['Ya existe una inscripción activa para este ciclo y semestre.'],
                ]);
            }

            $tipoInscripcion = trim((string) ($data['tipo_inscripcion'] ?? 'ordinaria'));
            $workflow = [
                'creada_at' => now()->toIso8601String(),
                'creada_por' => $user->id,
                'tipo_inscripcion' => $tipoInscripcion !== '' ? $tipoInscripcion : 'ordinaria',
            ];

            $ins = InscripcionPeriodo::query()->create([
                'matricula_id' => $mat->id,
                'ciclo_escolar_id' => $cicloId,
                'semestre' => $semestre,
                'tipo_periodo_curricular' => 'semestre',
                'numero_periodo_curricular' => $semestre,
                'etiqueta_periodo_curricular' => $semestre.'.º periodo',
                'estatus' => 'pendiente',
                'fecha_inscripcion' => now()->toDateString(),
                'metadata' => [
                    self::WORKFLOW_KEY => $workflow,
                    'tipo_inscripcion' => $workflow['tipo_inscripcion'],
                ],
            ]);

            $this->registrarAuditoria($user, 'inscripcion.crear', $ins->id, [
                'folio' => $this->folioInscripcion($ins->id),
                'alumno_id' => $alumno->id,
            ]);

            return $this->filaListado($ins->fresh($this->eagerListado()), $user);
        });
    }

    /**
     * @return array<string, mixed>
     */
    public function validarDocumentos(User $user, int $id, ?string $comentario = null): array
    {
        return $this->dashboard->conAlcanceUsuario($user, function () use ($user, $id, $comentario): array {
            $ins = $this->inscripcionEnAlcance($user, $id);
            $bloqueos = $this->bloqueosValidacionDocumentos($ins);
            if ($bloqueos !== []) {
                throw ValidationException::withMessages(['documentos' => $bloqueos]);
            }

            $meta = $ins->metadata ?? [];
            $workflow = $meta[self::WORKFLOW_KEY] ?? [];
            $workflow['documentos_validados_at'] = now()->toIso8601String();
            $workflow['validado_por'] = $user->id;
            if ($comentario !== null && $comentario !== '') {
                $workflow['comentario_validacion'] = $comentario;
            }
            unset($workflow['observada_at'], $workflow['motivo']);
            $meta[self::WORKFLOW_KEY] = $workflow;
            $ins->update(['metadata' => $meta]);

            $this->registrarAuditoria($user, 'inscripcion.validar_documentos', $ins->id, [
                'folio' => $this->folioInscripcion($ins->id),
                'comentario' => $comentario,
            ]);

            return $this->filaListado($ins->fresh($this->eagerListado()), $user);
        });
    }

    /**
     * @return array<string, mixed>
     */
    public function confirmar(User $user, int $id, ?string $comentario = null): array
    {
        return $this->dashboard->conAlcanceUsuario($user, function () use ($user, $id, $comentario): array {
            $ins = $this->inscripcionEnAlcance($user, $id);
            $bloqueos = $this->bloqueosConfirmacion($ins);
            if ($bloqueos !== []) {
                throw ValidationException::withMessages(['inscripcion' => $bloqueos]);
            }

            $meta = $ins->metadata ?? [];
            $workflow = $meta[self::WORKFLOW_KEY] ?? [];
            $workflow['confirmada_at'] = now()->toIso8601String();
            $workflow['confirmado_por'] = $user->id;
            if ($comentario !== null && $comentario !== '') {
                $workflow['comentario_confirmacion'] = $comentario;
            }
            $meta[self::WORKFLOW_KEY] = $workflow;

            $ins->update([
                'estatus' => 'inscrita',
                'metadata' => $meta,
            ]);

            if ($ins->cargasAcademicas()->where('estatus', 'activa')->doesntExist()) {
                CargaAcademica::query()->create([
                    'inscripcion_periodo_id' => $ins->id,
                    'estatus' => 'activa',
                    'metadata' => [
                        'origen' => 'control_escolar_inscripciones',
                        'confirmada_por' => $user->id,
                    ],
                ]);
            }

            $this->registrarAuditoria($user, 'inscripcion.confirmar', $ins->id, [
                'folio' => $this->folioInscripcion($ins->id),
                'comentario' => $comentario,
            ]);

            return $this->filaListado($ins->fresh($this->eagerListado()), $user);
        });
    }

    /**
     * @return array<string, mixed>
     */
    public function observar(User $user, int $id, string $motivo, ?string $descripcion = null): array
    {
        return $this->dashboard->conAlcanceUsuario($user, function () use ($user, $id, $motivo, $descripcion): array {
            $ins = $this->inscripcionEnAlcance($user, $id);
            $alumno = $ins->matricula?->alumno;
            $doc = $alumno?->documentosAcademicos()->latest('id')->first();

            if ($doc !== null) {
                DocumentoObservacion::query()->create([
                    'documento_academico_id' => $doc->id,
                    'tipo' => 'inscripcion_periodo',
                    'observacion' => $motivo.($descripcion ? ': '.$descripcion : ''),
                    'estado' => 'pendiente',
                    'prioridad' => 'alta',
                    'creada_por' => $user->id,
                ]);
                $doc->update(['estado_workflow' => 'rechazado']);
            }

            $meta = $ins->metadata ?? [];
            $workflow = $meta[self::WORKFLOW_KEY] ?? [];
            $workflow['observada_at'] = now()->toIso8601String();
            $workflow['motivo'] = $motivo;
            $workflow['observado_por'] = $user->id;
            if ($descripcion !== null && $descripcion !== '') {
                $workflow['descripcion'] = $descripcion;
            }
            $meta[self::WORKFLOW_KEY] = $workflow;
            $ins->update(['metadata' => $meta, 'estatus' => 'observada']);

            $this->registrarAuditoria($user, 'inscripcion.observar', $ins->id, [
                'folio' => $this->folioInscripcion($ins->id),
                'motivo' => $motivo,
            ]);

            return $this->filaListado($ins->fresh($this->eagerListado()), $user);
        });
    }

    /**
     * @return array<string, mixed>
     */
    public function cancelar(User $user, int $id, string $motivo): array
    {
        return $this->dashboard->conAlcanceUsuario($user, function () use ($user, $id, $motivo): array {
            $ins = $this->inscripcionEnAlcance($user, $id);

            $meta = $ins->metadata ?? [];
            $workflow = $meta[self::WORKFLOW_KEY] ?? [];
            $workflow['cancelada_at'] = now()->toIso8601String();
            $workflow['motivo_cancelacion'] = $motivo;
            $workflow['cancelado_por'] = $user->id;
            $meta[self::WORKFLOW_KEY] = $workflow;

            $ins->update([
                'estatus' => 'cancelada',
                'metadata' => $meta,
            ]);

            $this->registrarAuditoria($user, 'inscripcion.cancelar', $ins->id, [
                'folio' => $this->folioInscripcion($ins->id),
                'motivo' => $motivo,
            ]);

            return $this->filaListado($ins->fresh($this->eagerListado()), $user);
        });
    }

    /**
     * @param  list<int>  $ids
     * @return array{procesados: int, bloqueados: list<array{id: int, folio: string, errores: list<string>}>, errores: list<string>}
     */
    public function validarDocumentosMasivo(User $user, array $ids): array
    {
        return $this->dashboard->conAlcanceUsuario($user, function () use ($user, $ids): array {
            $procesados = 0;
            $bloqueados = [];

            foreach ($ids as $id) {
                try {
                    $this->validarDocumentos($user, (int) $id);
                    $procesados++;
                } catch (ValidationException $e) {
                    $bloqueados[] = [
                        'id' => (int) $id,
                        'folio' => $this->folioInscripcion((int) $id),
                        'errores' => array_values($e->errors()['documentos'] ?? ['No cumple requisitos documentales.']),
                    ];
                }
            }

            $this->registrarAuditoria($user, 'inscripcion.validar_documentos_masivo', null, [
                'ids' => $ids,
                'procesados' => $procesados,
            ]);

            return ['procesados' => $procesados, 'bloqueados' => $bloqueados, 'errores' => []];
        });
    }

    /**
     * @param  list<int>  $ids
     * @return array{procesados: int, bloqueados: list<array{id: int, folio: string, errores: list<string>}>, errores: list<string>}
     */
    public function confirmarMasivo(User $user, array $ids): array
    {
        return $this->dashboard->conAlcanceUsuario($user, function () use ($user, $ids): array {
            $procesados = 0;
            $bloqueados = [];

            foreach ($ids as $id) {
                try {
                    $this->confirmar($user, (int) $id);
                    $procesados++;
                } catch (ValidationException $e) {
                    $bloqueados[] = [
                        'id' => (int) $id,
                        'folio' => $this->folioInscripcion((int) $id),
                        'errores' => array_values($e->errors()['inscripcion'] ?? ['No cumple requisitos para confirmar.']),
                    ];
                }
            }

            $this->registrarAuditoria($user, 'inscripcion.confirmar_masivo', null, [
                'ids' => $ids,
                'procesados' => $procesados,
            ]);

            return ['procesados' => $procesados, 'bloqueados' => $bloqueados, 'errores' => []];
        });
    }

    /**
     * @param  array<string, mixed>  $filtros
     */
    public function exportarCsv(User $user, array $filtros): StreamedResponse
    {
        /** @var StreamedResponse $response */
        $response = $this->dashboard->conAlcanceUsuario($user, function () use ($user, $filtros): StreamedResponse {
            $this->registrarAuditoria($user, 'inscripcion.exportar', null, ['filtros' => $filtros]);

            return response()->streamDownload(function () use ($user, $filtros): void {
                $out = fopen('php://output', 'w');
                if ($out === false) {
                    return;
                }
                fputcsv($out, ['folio', 'alumno', 'matricula', 'curp', 'programa', 'tipo_inscripcion', 'avance', 'estatus', 'fecha']);
                $this->queryListado($user, $filtros)->chunk(150, function ($inscripciones) use ($out, $user): void {
                    foreach ($inscripciones as $ins) {
                        $f = $this->filaListado($ins, $user);
                        fputcsv($out, [
                            $f['folio'],
                            $f['alumno'],
                            $f['matricula'],
                            $f['curp'],
                            $f['programa'],
                            $f['tipo_inscripcion'],
                            $f['avance']['completados'].'/'.$f['avance']['total'].' ('.$f['avance']['porcentaje'].'%)',
                            $f['estatus']['label'],
                            $f['fecha'],
                        ]);
                    }
                });
                fclose($out);
            }, 'inscripciones_'.now()->format('Y-m-d_His').'.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
        });

        return $response;
    }

    public function comprobante(User $user, int $id): Response
    {
        return $this->dashboard->conAlcanceUsuario($user, function () use ($user, $id): Response {
            $ins = $this->inscripcionEnAlcance($user, $id);
            $ins->loadMissing($this->eagerListado());
            $alumno = $ins->matricula?->alumno;
            $prog = $ins->matricula?->ofertaAcademica?->planEstudio?->programaEstudio;
            $folio = $this->folioInscripcion($ins->id);
            $nombre = $this->nombreInstitucional($alumno);
            $matricula = (string) ($ins->matricula?->matricula ?? '—');
            $programa = (string) ($prog?->nombre ?? '—');
            $ciclo = (string) ($ins->cicloEscolar?->nombre ?? '—');
            $fecha = ($ins->fecha_inscripcion ?? $ins->updated_at)?->format('d/m/Y') ?? now()->format('d/m/Y');
            $estatus = $this->etiquetaEstatus($this->codigoEstatus($ins));
            $generado = $this->escHtml(now()->format('d/m/Y H:i'));

            $html = <<<HTML
<!DOCTYPE html>
<html lang="es">
<head><meta charset="utf-8"><title>Comprobante {$folio}</title>
<style>body{font-family:DejaVu Sans,sans-serif;font-size:12px;color:#0f172a;margin:32px}h1{font-size:18px;margin:0 0 8px}table{width:100%;border-collapse:collapse;margin-top:16px}td,th{border:1px solid #e2e8f0;padding:8px;text-align:left}th{background:#f8fafc;width:35%}.pie{margin-top:24px;font-size:10px;color:#64748b}</style>
</head>
<body>
<h1>Comprobante de inscripción</h1>
<p><strong>Folio:</strong> {$folio}</p>
<table>
<tr><th>Alumno</th><td>{$nombre}</td></tr>
<tr><th>Matrícula</th><td>{$matricula}</td></tr>
<tr><th>Programa</th><td>{$programa}</td></tr>
<tr><th>Ciclo escolar</th><td>{$ciclo}</td></tr>
<tr><th>Fecha de inscripción</th><td>{$fecha}</td></tr>
<tr><th>Estatus</th><td>{$estatus}</td></tr>
</table>
<p class="pie">Documento generado el {$generado} · Control escolar institucional</p>
</body>
</html>
HTML;

            $this->registrarAuditoria($user, 'inscripcion.comprobante', $ins->id, ['folio' => $folio]);

            return Pdf::loadHTML($html)->download('comprobante_'.$folio.'.pdf');
        });
    }

    /**
     * @return array{nuevas: int, por_validar: int, confirmadas: int, observadas: int, total_alcance: int}
     */
    protected function metricas(User $user): array
    {
        $base = $this->queryListado($user, []);
        $items = (clone $base)->with($this->eagerListado())->get();

        $conteos = [
            'nuevas' => 0,
            'por_validar' => 0,
            'confirmadas' => 0,
            'observadas' => 0,
        ];

        foreach ($items as $ins) {
            $codigo = $this->codigoEstatus($ins);
            match ($codigo) {
                'nueva' => $conteos['nuevas']++,
                'confirmada' => $conteos['confirmadas']++,
                'observada', 'rechazada' => $conteos['observadas']++,
                default => $conteos['por_validar']++,
            };
        }

        return $conteos + ['total_alcance' => $items->count()];
    }

    /**
     * @param  array<string, mixed>  $filtros
     * @return Builder<InscripcionPeriodo>
     */
    protected function queryListado(User $user, array $filtros): Builder
    {
        $query = InscripcionPeriodo::query()
            ->with($this->eagerListado())
            ->whereHas('matricula', function (Builder $mat) use ($user): void {
                $mat->whereHas('alumno', function (Builder $alumno) use ($user): void {
                    $alumno->whereIn('id', $this->dashboard->queryAlumnosEnAlcance($user)->select('id'));
                });
            });

        $sort = (string) ($filtros['sort'] ?? 'updated_at');
        $dir = strtolower((string) ($filtros['direction'] ?? 'desc')) === 'asc' ? 'asc' : 'desc';
        $query->orderBy(match ($sort) {
            'folio', 'inscripcion_id' => 'id',
            'fecha', 'fecha_inscripcion' => 'fecha_inscripcion',
            'estatus' => 'estatus',
            default => 'updated_at',
        }, $dir)->orderByDesc('id');

        $term = trim((string) ($filtros['search'] ?? ''));
        if ($term !== '') {
            $like = '%'.$term.'%';
            $folioId = $this->resolverInscripcionIdDesdeFolio($term);
            $query->where(function (Builder $q) use ($like, $folioId): void {
                $q->whereHas('matricula', fn (Builder $m) => $m->where('matricula', 'like', $like))
                    ->orWhereHas('matricula.alumno', function (Builder $a) use ($like): void {
                        $a->where('curp', 'like', $like)
                            ->orWhere('nombre', 'like', $like)
                            ->orWhere('primer_apellido', 'like', $like)
                            ->orWhere('segundo_apellido', 'like', $like);
                    })
                    ->orWhereHas('matricula.ofertaAcademica.planEstudio.programaEstudio', function (Builder $p) use ($like): void {
                        $p->where('nombre', 'like', $like)->orWhere('clave', 'like', $like);
                    });
                if ($folioId !== null) {
                    $q->orWhere('id', $folioId);
                }
            });
        }

        $programaId = (int) ($filtros['programa_id'] ?? 0);
        if ($programaId > 0) {
            $query->whereHas('matricula.ofertaAcademica', fn (Builder $o) => $o->where('programa_estudio_id', $programaId));
        }

        $sedeId = (int) ($filtros['sede_id'] ?? 0);
        if ($sedeId > 0) {
            $query->whereHas('matricula.ofertaAcademica', fn (Builder $o) => $o->where('sede_id', $sedeId));
        }

        $tipo = trim((string) ($filtros['tipo_inscripcion'] ?? ''));
        if ($tipo !== '') {
            $query->where(function (Builder $q) use ($tipo): void {
                $q->where('metadata->tipo_inscripcion', $tipo)
                    ->orWhere('metadata->'.self::WORKFLOW_KEY.'->tipo_inscripcion', $tipo);
            });
        }

        $estatus = trim((string) ($filtros['estatus'] ?? ''));
        if ($estatus !== '') {
            $this->aplicarFiltroEstatus($query, $estatus);
        }

        if (($filtros['documentos_pendientes'] ?? '') === '1' || ($filtros['documentos_pendientes'] ?? '') === 'true') {
            $query->whereDoesntHave('matricula.alumno.documentosAcademicos');
        }

        if (($filtros['con_observaciones'] ?? '') === '1' || ($filtros['con_observaciones'] ?? '') === 'true') {
            $query->where(fn (Builder $q) => $this->aplicarFiltroConObservaciones($q));
        }

        $desde = trim((string) ($filtros['fecha_desde'] ?? ''));
        if ($desde !== '') {
            $query->whereDate('fecha_inscripcion', '>=', $desde);
        }
        $hasta = trim((string) ($filtros['fecha_hasta'] ?? ''));
        if ($hasta !== '') {
            $query->whereDate('fecha_inscripcion', '<=', $hasta);
        }

        return $query;
    }

    protected function aplicarFiltroEstatus(Builder $query, string $estatus): void
    {
        match ($estatus) {
            'cancelada' => $query->where('estatus', 'cancelada'),
            'rechazada' => $query->where(function (Builder $q): void {
                $q->where('estatus', 'rechazada')
                    ->orWhereHas('matricula.alumno.documentosAcademicos', fn (Builder $d) => $d->where('estado_workflow', 'rechazado'));
            }),
            'observada' => $query->where(fn (Builder $q) => $this->aplicarFiltroConObservaciones($q)),
            'confirmada' => $query->whereIn('estatus', self::ESTATUS_INSCRIPCION_ACTIVA)
                ->where('metadata->'.self::WORKFLOW_KEY.'->confirmada_at', '!=', null),
            'validada' => $query->where('metadata->'.self::WORKFLOW_KEY.'->documentos_validados_at', '!=', null)
                ->whereNull('metadata->'.self::WORKFLOW_KEY.'->confirmada_at')
                ->whereNotIn('estatus', ['cancelada', 'observada']),
            'documentos_pendientes' => $query->whereDoesntHave('matricula.alumno.documentosAcademicos')
                ->whereNotIn('estatus', ['cancelada']),
            'por_validar' => $query->whereHas('matricula.alumno.documentosAcademicos')
                ->whereNull('metadata->'.self::WORKFLOW_KEY.'->documentos_validados_at')
                ->where(fn (Builder $q) => $q->whereNull('metadata->'.self::WORKFLOW_KEY.'->observada_at'))
                ->whereNotIn('estatus', ['cancelada', 'confirmada']),
            'nueva' => $query->whereNull('metadata->'.self::WORKFLOW_KEY.'->documentos_validados_at')
                ->whereNull('metadata->'.self::WORKFLOW_KEY.'->confirmada_at')
                ->whereNotIn('estatus', ['cancelada', 'observada', 'rechazada'])
                ->where(fn (Builder $q) => $q->where('estatus', 'pendiente')->orWhere('estatus', 'nueva')),
            default => null,
        };
    }

    protected function aplicarFiltroConObservaciones(Builder $query): void
    {
        $query->where(function (Builder $q): void {
            $q->where('estatus', 'observada')
                ->orWhereNotNull('metadata->'.self::WORKFLOW_KEY.'->observada_at')
                ->orWhereHas('matricula.alumno.documentosAcademicos', function (Builder $d): void {
                    $d->where('estado_workflow', 'rechazado')
                        ->orWhereHas('observacionesPendientes');
                });
        });
    }

    /**
     * @return array<string, mixed>
     */
    protected function filaListado(InscripcionPeriodo $ins, User $user): array
    {
        $alumno = $ins->matricula?->alumno;
        $prog = $ins->matricula?->ofertaAcademica?->planEstudio?->programaEstudio;
        $fecha = $ins->fecha_inscripcion ?? $ins->updated_at;
        $codigo = $this->codigoEstatus($ins);
        $avance = $this->calcularAvance($ins);
        $bloqueosVal = $this->bloqueosValidacionDocumentos($ins);
        $bloqueosConf = $this->bloqueosConfirmacion($ins);
        $alumnoId = (int) ($alumno?->id ?? 0);

        return [
            'inscripcion_id' => $ins->id,
            'alumno_id' => $alumno?->id,
            'folio' => $this->folioInscripcion($ins->id),
            'alumno' => $this->nombreInstitucional($alumno),
            'matricula' => $ins->matricula?->matricula ?? '—',
            'curp' => $alumno?->curp ?? '—',
            'programa' => $prog?->nombre ?? '—',
            'tipo_inscripcion' => $this->tipoInscripcion($ins),
            'fecha' => $fecha?->toIso8601String() ?? '',
            'avance' => $avance,
            'estatus' => [
                'codigo' => $codigo,
                'label' => $this->etiquetaEstatus($codigo),
            ],
            'puede_validar_documentos' => $bloqueosVal === [] && $user->can('inscripciones.validar_documentos'),
            'puede_confirmar' => $bloqueosConf === [] && (
                $user->can('inscripciones.confirmar') || $user->can('inscripciones.editar')
            ),
            'puede_imprimir_comprobante' => $codigo === 'confirmada' && (
                $user->can('inscripciones.comprobante.imprimir')
                || $user->can('inscripciones.confirmar')
                || $user->can('inscripciones.ver')
            ),
            'bloqueos_validacion' => $bloqueosVal,
            'bloqueos_confirmacion' => $bloqueosConf,
            'urls' => [
                'ver' => '/app/control-escolar/inscripciones?inscripcion='.$ins->id,
                'editar' => '/app/control-escolar/inscripciones?inscripcion='.$ins->id.'&editar=1',
                'expediente' => $alumnoId > 0 ? '/app/alumnos/'.$alumnoId.'/expediente' : '/app/expedientes',
                'comprobante' => '/api/v1/control-escolar/inscripciones/'.$ins->id.'/comprobante',
            ],
            'expediente_url' => $alumnoId > 0 ? '/app/alumnos/'.$alumnoId.'/expediente' : '/app/expedientes',
            'id' => $ins->matricula?->matricula ?? $this->curpAbreviada($alumno),
        ];
    }

    protected function codigoEstatus(InscripcionPeriodo $ins): string
    {
        if ($ins->estatus === 'cancelada' || ! empty($this->workflow($ins)['cancelada_at'])) {
            return 'cancelada';
        }

        if ($ins->estatus === 'rechazada' || $this->documentoRechazado($ins)) {
            return 'rechazada';
        }

        if ($ins->estatus === 'observada' || ! empty($this->workflow($ins)['observada_at']) || $this->tieneObservaciones($ins)) {
            return 'observada';
        }

        $workflow = $this->workflow($ins);
        if (! empty($workflow['confirmada_at'])
            && in_array((string) $ins->estatus, self::ESTATUS_INSCRIPCION_ACTIVA, true)) {
            return 'confirmada';
        }

        if (! empty($workflow['documentos_validados_at'])) {
            return 'validada';
        }

        if (! $this->tieneDocumentoAcademico($ins)) {
            return 'documentos_pendientes';
        }

        if ($this->tieneDocumentoAcademico($ins)) {
            return 'por_validar';
        }

        return 'nueva';
    }

    protected function etiquetaEstatus(string $codigo): string
    {
        return match ($codigo) {
            'cancelada' => 'Cancelada',
            'rechazada' => 'Rechazada',
            'observada' => 'Observada',
            'confirmada' => 'Confirmada',
            'validada' => 'Documentos validados',
            'documentos_pendientes' => 'Documentos pendientes',
            'por_validar' => 'Por validar',
            'nueva' => 'Nueva',
            default => ucfirst(str_replace('_', ' ', $codigo)),
        };
    }

    /**
     * @return array{completados: int, total: int, porcentaje: int}
     */
    protected function calcularAvance(InscripcionPeriodo $ins): array
    {
        $reqs = $this->evaluarRequisitosDocumentales($ins);
        $completados = count(array_filter($reqs, fn (array $r) => $r['cumple']));
        $total = count($reqs);
        $pct = $total > 0 ? (int) round(($completados / $total) * 100) : 0;

        return ['completados' => $completados, 'total' => $total, 'porcentaje' => $pct];
    }

    /**
     * @return list<array{key: string, nombre: string, cumple: bool}>
     */
    protected function evaluarRequisitosDocumentales(InscripcionPeriodo $ins): array
    {
        $matriculaActiva = $ins->matricula !== null
            && in_array((string) $ins->matricula->estado, self::ESTADOS_MATRICULA_ACTIVA, true);
        $tieneDoc = $this->tieneDocumentoAcademico($ins);
        $sinObs = ! $this->tieneObservaciones($ins);

        $map = [
            'matricula' => $matriculaActiva,
            'documento' => $tieneDoc,
            'sin_observaciones' => $sinObs,
        ];

        $out = [];
        foreach (self::REQUISITOS_DOCUMENTALES as $r) {
            $out[] = [
                'key' => $r['key'],
                'nombre' => $r['nombre'],
                'cumple' => (bool) ($map[$r['key']] ?? false),
            ];
        }

        return $out;
    }

    /**
     * @return list<string>
     */
    protected function bloqueosValidacionDocumentos(InscripcionPeriodo $ins): array
    {
        if ($this->codigoEstatus($ins) === 'cancelada') {
            return ['La inscripción está cancelada.'];
        }

        if (! empty($this->workflow($ins)['documentos_validados_at'])) {
            return ['Los documentos ya fueron validados.'];
        }

        $bloqueos = [];
        foreach ($this->evaluarRequisitosDocumentales($ins) as $req) {
            if (! $req['cumple']) {
                $bloqueos[] = 'Falta: '.$req['nombre'].'.';
            }
        }

        return $bloqueos;
    }

    /**
     * @return list<string>
     */
    protected function bloqueosConfirmacion(InscripcionPeriodo $ins): array
    {
        if ($this->codigoEstatus($ins) === 'cancelada') {
            return ['La inscripción está cancelada.'];
        }

        if (! empty($this->workflow($ins)['confirmada_at'])) {
            return ['La inscripción ya está confirmada.'];
        }

        $bloqueos = $this->bloqueosValidacionDocumentos($ins);
        if (empty($this->workflow($ins)['documentos_validados_at'])) {
            $bloqueos[] = 'Debe validar los documentos antes de confirmar la inscripción.';
        }

        if ($this->tieneObservaciones($ins)) {
            $bloqueos[] = 'Hay observaciones pendientes por atender.';
        }

        return array_values(array_unique($bloqueos));
    }

    /**
     * @return list<array<string, mixed>>
     */
    protected function procesoPasos(User $user): array
    {
        $base = $this->queryListado($user, []);
        $total = max(0, (clone $base)->count());

        $registradas = (clone $base)->count();
        $docsValidados = (clone $base)->where('metadata->'.self::WORKFLOW_KEY.'->documentos_validados_at', '!=', null)->count();
        $confirmadas = (clone $base)->where('metadata->'.self::WORKFLOW_KEY.'->confirmada_at', '!=', null)->count();
        $conCarga = (clone $base)->whereHas('cargasAcademicas', fn (Builder $q) => $q->where('estatus', 'activa'))->count();

        $pasos = [
            ['orden' => 1, 'clave' => 'registro', 'titulo' => 'Registro de inscripción', 'total' => $registradas],
            ['orden' => 2, 'clave' => 'validacion_documental', 'titulo' => 'Validación documental', 'total' => $docsValidados],
            ['orden' => 3, 'clave' => 'confirmacion', 'titulo' => 'Confirmación de inscripción', 'total' => $confirmadas],
            ['orden' => 4, 'clave' => 'carga_academica', 'titulo' => 'Carga académica activa', 'total' => $conCarga],
        ];

        $resultado = [];
        $anteriorCompleto = true;
        foreach ($pasos as $paso) {
            $relacionado = (int) $paso['total'];
            if ($total === 0) {
                $estado = 'pendiente';
            } elseif ($relacionado >= $total && $total > 0) {
                $estado = 'completado';
            } elseif ($relacionado > 0 && $anteriorCompleto) {
                $estado = 'en_proceso';
            } elseif (! $anteriorCompleto) {
                $estado = 'bloqueado';
            } else {
                $estado = 'pendiente';
            }

            $anteriorCompleto = $estado === 'completado';
            $resultado[] = [
                'orden' => $paso['orden'],
                'clave' => $paso['clave'],
                'titulo' => $paso['titulo'],
                'estado' => $estado,
                'total_relacionado' => $relacionado,
                'total_alcance' => $total,
            ];
        }

        return $resultado;
    }

    /**
     * @return list<array{fecha: string, mes: string, titulo: string, sub: string, badge: string}>
     */
    protected function fechasImportantesInterno(User $user): array
    {
        $ciclo = CicloEscolar::query()
            ->where(fn (Builder $q) => $q->where('es_actual', true)->orWhere('activo', true))
            ->orderByDesc('es_actual')
            ->orderByDesc('id')
            ->first();

        if ($ciclo === null) {
            return [];
        }

        $items = [];
        $fin = $ciclo->fecha_fin;
        $inicio = $ciclo->fecha_inicio;

        if ($fin instanceof Carbon) {
            $cierre = $fin->copy()->subDays(8);
            $items[] = $this->fechaItem($cierre, 'Cierre de validación documental', 'Antes del fin de ciclo · '.$this->nombreCiclo($ciclo), $this->badgeFecha($cierre));
            $items[] = $this->fechaItem($fin->copy()->subDays(4), 'Límite para confirmar inscripciones', $fin->format('d/m/Y'), $this->badgeFecha($fin->copy()->subDays(4)));
        }

        if ($inicio instanceof Carbon) {
            $items[] = $this->fechaItem($inicio, 'Inicio de clases', $inicio->format('d/m/Y'), $this->badgeFecha($inicio));
        }

        return array_slice($items, 0, 3);
    }

    /**
     * @return list<array<string, mixed>>
     */
    protected function actividadRecienteInterno(User $user, int $limit): array
    {
        $eventos = AuditoriaEvento::query()
            ->where('evento', 'like', 'inscripcion.%')
            ->latest('id')
            ->limit($limit)
            ->get();

        if ($eventos->isEmpty()) {
            return [];
        }

        return $eventos->map(function (AuditoriaEvento $ev): array {
            $folio = isset($ev->payload['folio'])
                ? (string) $ev->payload['folio']
                : ($ev->entidad_id ? $this->folioInscripcion((int) $ev->entidad_id) : '—');

            return [
                'id' => $ev->id,
                'tipo' => $ev->evento,
                'titulo' => $this->tituloActividad((string) $ev->evento),
                'descripcion' => $folio,
                'inscripcion_folio' => $folio,
                'usuario' => $ev->user_id ? 'Usuario #'.$ev->user_id : 'Sistema',
                'fecha' => $ev->created_at?->toIso8601String(),
                'tiempo_relativo' => $this->horaRelativa($ev->created_at),
                'severidad' => str_contains((string) $ev->evento, 'observ') || str_contains((string) $ev->evento, 'cancel')
                    ? 'warning'
                    : (str_contains((string) $ev->evento, 'confirm') || str_contains((string) $ev->evento, 'validar')
                        ? 'success'
                        : 'info'),
            ];
        })->all();
    }

    protected function inscripcionEnAlcance(User $user, int $id): InscripcionPeriodo
    {
        $ins = $this->queryListado($user, [])->where('id', $id)->first();
        if ($ins === null) {
            throw ValidationException::withMessages([
                'inscripcion' => ['Inscripción fuera de su alcance o no encontrada.'],
            ]);
        }

        return $ins;
    }

    protected function alumnoEnAlcance(User $user, int $alumnoId): Alumno
    {
        $alumno = $this->dashboard->queryAlumnosEnAlcance($user)
            ->with(['matriculaActiva'])
            ->where('id', $alumnoId)
            ->first();

        if ($alumno === null) {
            throw ValidationException::withMessages(['alumno_id' => ['Alumno fuera de su alcance.']]);
        }

        return $alumno;
    }

    /**
     * @return array<string, mixed>
     */
    protected function workflow(InscripcionPeriodo $ins): array
    {
        $meta = $ins->metadata ?? [];

        return is_array($meta[self::WORKFLOW_KEY] ?? null) ? $meta[self::WORKFLOW_KEY] : [];
    }

    protected function tieneDocumentoAcademico(InscripcionPeriodo $ins): bool
    {
        $alumno = $ins->matricula?->alumno;
        if ($alumno === null) {
            return false;
        }

        if ($alumno->relationLoaded('documentosAcademicos')) {
            return $alumno->documentosAcademicos->isNotEmpty();
        }

        return $alumno->documentosAcademicos()->exists();
    }

    protected function documentoRechazado(InscripcionPeriodo $ins): bool
    {
        $alumno = $ins->matricula?->alumno;
        if ($alumno === null) {
            return false;
        }

        return $alumno->documentosAcademicos->contains(
            fn (DocumentoAcademico $doc) => $doc->estado_workflow === 'rechazado'
        );
    }

    protected function tieneObservaciones(InscripcionPeriodo $ins): bool
    {
        $alumno = $ins->matricula?->alumno;
        if ($alumno === null) {
            return false;
        }

        return $alumno->documentosAcademicos->contains(function (DocumentoAcademico $doc): bool {
            if ($doc->estado_workflow === 'rechazado') {
                return true;
            }

            return $doc->relationLoaded('observacionesPendientes')
                ? $doc->observacionesPendientes->isNotEmpty()
                : $doc->observacionesPendientes()->exists();
        });
    }

    protected function tipoInscripcion(InscripcionPeriodo $ins): string
    {
        $meta = $ins->metadata ?? [];
        $tipo = (string) ($meta['tipo_inscripcion'] ?? $this->workflow($ins)['tipo_inscripcion'] ?? 'ordinaria');

        return $tipo !== '' ? $tipo : 'ordinaria';
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
            'programas' => ProgramaEstudio::query()
                ->whereIn('id', $ofertas->pluck('programa_estudio_id')->filter())
                ->orderBy('nombre')
                ->get(['id', 'nombre'])
                ->map(fn ($p) => ['id' => $p->id, 'nombre' => $p->nombre])
                ->values()
                ->all(),
            'sedes' => Sede::query()
                ->whereIn('id', $ofertas->pluck('sede_id')->filter())
                ->orderBy('nombre')
                ->get(['id', 'nombre'])
                ->map(fn ($s) => ['id' => $s->id, 'nombre' => $s->nombre])
                ->values()
                ->all(),
            'estatus' => [
                ['value' => '', 'label' => 'Todos'],
                ['value' => 'nueva', 'label' => 'Nueva'],
                ['value' => 'documentos_pendientes', 'label' => 'Documentos pendientes'],
                ['value' => 'por_validar', 'label' => 'Por validar'],
                ['value' => 'validada', 'label' => 'Documentos validados'],
                ['value' => 'confirmada', 'label' => 'Confirmada'],
                ['value' => 'observada', 'label' => 'Observada'],
                ['value' => 'rechazada', 'label' => 'Rechazada'],
                ['value' => 'cancelada', 'label' => 'Cancelada'],
            ],
            'tipos_inscripcion' => [
                ['value' => 'ordinaria', 'label' => 'Ordinaria'],
                ['value' => 'especial', 'label' => 'Especial'],
                ['value' => 'reingreso', 'label' => 'Reingreso'],
            ],
        ];
    }

    /**
     * @return array<string, bool>
     */
    protected function permisosUi(User $user): array
    {
        return [
            'ver' => $user->can('inscripciones.ver') || $user->can('gestionar_inscripciones_periodo'),
            'crear' => $user->can('inscripciones.crear') || $user->can('gestionar_inscripciones_periodo'),
            'editar' => $user->can('inscripciones.editar') || $user->can('gestionar_inscripciones_periodo'),
            'validar_documentos' => $user->can('inscripciones.validar_documentos') || $user->can('inscripciones.revisar'),
            'confirmar' => $user->can('inscripciones.confirmar') || $user->can('inscripciones.editar'),
            'observar' => $user->can('inscripciones.observar') || $user->can('observaciones.crear'),
            'cancelar' => $user->can('inscripciones.cancelar') || $user->can('inscripciones.editar'),
            'exportar' => $user->can('inscripciones.exportar') || $user->can('reportes.ver') || $user->can('exportar_reportes'),
            'comprobante' => $user->can('inscripciones.comprobante.imprimir') || $user->can('inscripciones.confirmar'),
            'validacion_masiva' => $user->can('inscripciones.validacion.masiva') || $user->can('inscripciones.validar_documentos'),
            'confirmacion_masiva' => $user->can('inscripciones.confirmacion.masiva') || $user->can('inscripciones.confirmar'),
        ];
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    protected function registrarAuditoria(User $user, string $evento, ?int $inscripcionId, array $payload = []): void
    {
        $this->auditoria->registrar(
            $evento,
            'inscripcion_periodo',
            $inscripcionId,
            $payload,
            $user->id,
            request()->ip(),
            (string) request()->userAgent(),
            ['modulo' => 'control_escolar_inscripciones'],
        );
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
            'cicloEscolar:id,nombre,clave',
            'cargasAcademicas:id,inscripcion_periodo_id,estatus',
            'matricula.alumno.documentosAcademicos' => fn ($q) => $q->latest('id')->limit(5)->with('observacionesPendientes'),
        ];
    }

    protected function folioInscripcion(int $id): string
    {
        return 'INS-'.str_pad((string) $id, 6, '0', STR_PAD_LEFT);
    }

    protected function resolverInscripcionIdDesdeFolio(string $term): ?int
    {
        if (preg_match('/^INS-0*(\d+)$/i', trim($term), $m) === 1) {
            return (int) $m[1];
        }

        return null;
    }

    protected function nombreInstitucional(?Alumno $alumno): string
    {
        if ($alumno === null) {
            return 'Alumno no disponible';
        }

        $nombre = trim(implode(' ', array_filter([
            $alumno->nombre,
            $alumno->primer_apellido,
            $alumno->segundo_apellido,
        ])));

        if (stripos($nombre, 'demosynthetic') !== false || stripos($nombre, 'demo synthetic') !== false) {
            return 'Alumno institucional';
        }

        return $nombre !== '' ? $nombre : 'Alumno sin nombre';
    }

    protected function curpAbreviada(?Alumno $alumno): string
    {
        $curp = (string) ($alumno?->curp ?? '');
        if (strlen($curp) < 8) {
            return $curp !== '' ? $curp : '—';
        }

        return 'CURP …'.substr($curp, -4);
    }

    /**
     * @return array{fecha: string, mes: string, titulo: string, sub: string, badge: string}
     */
    protected function fechaItem(Carbon $fecha, string $titulo, string $sub, string $badge): array
    {
        return [
            'fecha' => $fecha->format('d'),
            'mes' => strtoupper($fecha->locale('es')->translatedFormat('M')),
            'titulo' => $titulo,
            'sub' => $sub,
            'badge' => $badge,
        ];
    }

    protected function badgeFecha(Carbon $fecha): string
    {
        if ($fecha->isPast()) {
            return 'Vencido';
        }
        if ($fecha->diffInDays(now()) <= 7) {
            return 'Próximo';
        }

        return 'Programado';
    }

    protected function nombreCiclo(CicloEscolar $ciclo): string
    {
        $nombre = trim((string) ($ciclo->nombre ?? $ciclo->clave ?? ''));
        if ($nombre === '' || stripos($nombre, 'demo') !== false) {
            return 'Ciclo escolar vigente';
        }

        return $nombre;
    }

    protected function tituloActividad(string $evento): string
    {
        return match ($evento) {
            'inscripcion.crear' => 'Inscripción creada',
            'inscripcion.validar_documentos', 'inscripcion.validar_documentos_masivo' => 'Documentos validados',
            'inscripcion.confirmar', 'inscripcion.confirmar_masivo' => 'Inscripción confirmada',
            'inscripcion.observar' => 'Inscripción observada',
            'inscripcion.cancelar' => 'Inscripción cancelada',
            'inscripcion.comprobante' => 'Comprobante generado',
            'inscripcion.exportar' => 'Exportación de inscripciones',
            default => 'Actividad de inscripción',
        };
    }

    protected function horaRelativa(?Carbon $fecha): string
    {
        return $fecha?->locale('es')->diffForHumans(short: true) ?? '—';
    }

    protected function escHtml(string $value): string
    {
        return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    }
}
