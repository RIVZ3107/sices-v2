<?php

declare(strict_types=1);

namespace App\Services\ControlEscolar;

use App\Models\Alumno;
use App\Models\InscripcionPeriodo;
use App\Models\OfertaAcademica;
use App\Models\Matricula;
use App\Models\PlanEstudio;
use App\Models\ProgramaEstudio;
use App\Models\Sede;
use App\Models\User;
use App\Services\Certificacion\ValidacionSimultaneidadAcademicaService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ControlEscolarAlumnosService
{
    private const ESTATUS_INSCRIPCION_ACTIVA = ['activa', 'inscrita', 'cursando'];

    public function __construct(
        protected ControlEscolarDashboardService $dashboard,
        protected ValidacionSimultaneidadAcademicaService $simultaneidad,
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
            $metricas = $this->dashboard->metricasGestionAlumnos($user);
            $query = $this->queryListado($user, $filtros);
            $paginator = $query->paginate($perPage, ['*'], 'page', $page);

            return [
                'actualizado_en' => now()->toIso8601String(),
                'metricas' => $metricas,
                'catalogos' => $this->catalogosFiltro($user),
                'recientes' => $this->recientes($user, 5),
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
            ];
        });
    }

    /**
     * @return array<string, int>
     */
    public function resumen(User $user): array
    {
        return $this->dashboard->conAlcanceUsuario($user, fn (): array => $this->dashboard->metricasGestionAlumnos($user));
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function recientes(User $user, int $limit = 5): array
    {
        return $this->dashboard->conAlcanceUsuario($user, function () use ($user, $limit): array {
            return $this->queryListado($user, [])
                ->orderByDesc('created_at')
                ->limit($limit)
                ->get()
                ->map(fn (Alumno $a) => $this->filaReciente($a))
                ->values()
                ->all();
        });
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    public function crear(User $user, array $data): array
    {
        return $this->dashboard->conAlcanceUsuario($user, function () use ($data): array {
            $alumno = Alumno::query()->create([
                'curp' => strtoupper(trim((string) ($data['curp'] ?? ''))),
                'nombre' => trim((string) ($data['nombre'] ?? '')),
                'primer_apellido' => trim((string) ($data['primer_apellido'] ?? '')),
                'segundo_apellido' => trim((string) ($data['segundo_apellido'] ?? '')) ?: null,
                'fecha_nacimiento' => $data['fecha_nacimiento'] ?? null,
                'genero' => $data['genero'] ?? null,
                'nacionalidad' => $data['nacionalidad'] ?? 'Mexicana',
                'estatus' => $data['estatus'] ?? 'activo',
            ]);

            return $this->filaListado($alumno->fresh([
                'matriculaActiva.ofertaAcademica.programaEstudio',
                'matriculaActiva.ofertaAcademica.planEstudio',
                'matriculaActiva.ofertaAcademica.sede',
                'matriculaActiva.inscripcionesPeriodo',
            ]));
        });
    }

    /**
     * @return array{insertados: int, omitidos: int, errores: list<array{fila: int, mensaje: string}>}
     */
    public function importarCsv(User $user, UploadedFile $archivo): array
    {
        return $this->dashboard->conAlcanceUsuario($user, function () use ($archivo): array {
            $insertados = 0;
            $omitidos = 0;
            $errores = [];
            $handle = fopen($archivo->getRealPath() ?: '', 'r');

            if ($handle === false) {
                return ['insertados' => 0, 'omitidos' => 0, 'errores' => [['fila' => 0, 'mensaje' => 'No se pudo leer el archivo.']]];
            }

            $fila = 0;
            $headers = null;

            while (($row = fgetcsv($handle)) !== false) {
                $fila++;
                if ($headers === null) {
                    $headers = array_map(static fn ($h) => strtolower(trim((string) $h)), $row);
                    if (! in_array('curp', $headers, true)) {
                        fclose($handle);

                        return ['insertados' => 0, 'omitidos' => 0, 'errores' => [['fila' => 1, 'mensaje' => 'El CSV debe incluir columna curp.']]];
                    }
                    continue;
                }

                $data = [];
                foreach ($headers as $i => $key) {
                    $data[$key] = trim((string) ($row[$i] ?? ''));
                }

                $curp = strtoupper((string) ($data['curp'] ?? ''));
                if ($curp === '') {
                    $errores[] = ['fila' => $fila, 'mensaje' => 'CURP vacía.'];
                    $omitidos++;

                    continue;
                }

                if (Alumno::query()->where('curp', $curp)->exists()) {
                    $omitidos++;

                    continue;
                }

                try {
                    Alumno::query()->create([
                        'curp' => $curp,
                        'nombre' => (string) ($data['nombre'] ?? 'Sin nombre'),
                        'primer_apellido' => (string) ($data['primer_apellido'] ?? '—'),
                        'segundo_apellido' => ($data['segundo_apellido'] ?? '') !== '' ? (string) $data['segundo_apellido'] : null,
                        'estatus' => (string) ($data['estatus'] ?? 'activo'),
                    ]);
                    $insertados++;
                } catch (\Throwable $e) {
                    $errores[] = ['fila' => $fila, 'mensaje' => 'No se pudo registrar: '.$curp];
                    $omitidos++;
                }
            }

            fclose($handle);

            return compact('insertados', 'omitidos', 'errores');
        });
    }

    /**
     * @param  array<string, mixed>  $filtros
     */
    public function exportarCsv(User $user, array $filtros): StreamedResponse
    {
        /** @var StreamedResponse $response */
        $response = $this->dashboard->conAlcanceUsuario($user, function () use ($user, $filtros): StreamedResponse {
            $filename = 'alumnos_'.now()->format('Y-m-d_His').'.csv';

            return response()->streamDownload(function () use ($user, $filtros): void {
                $out = fopen('php://output', 'w');
                if ($out === false) {
                    return;
                }
                fputcsv($out, ['matricula', 'nombre', 'curp', 'programa', 'plan', 'periodo', 'estatus', 'expediente', 'actualizado']);
                $this->queryListado($user, $filtros)
                    ->chunk(200, function ($alumnos) use ($out): void {
                        foreach ($alumnos as $alumno) {
                            $f = $this->filaListado($alumno);
                            fputcsv($out, [
                                $f['matricula'],
                                $f['nombre'],
                                $f['curp'],
                                $f['programa'],
                                $f['plan'],
                                $f['periodo'],
                                $f['estatus'],
                                $f['expediente_estado'],
                                $f['actualizado_en'],
                            ]);
                        }
                    });
                fclose($out);
            }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);
        });

        return $response;
    }

    /**
     * @param  array<string, mixed>  $filtros
     * @return Builder<Alumno>
     */
    protected function queryListado(User $user, array $filtros): Builder
    {
        $query = $this->alumnosBase($user)
            ->with($this->eagerListado())
            ->orderBy(
                $this->columnaOrden((string) ($filtros['sort_by'] ?? 'updated_at')),
                strtolower((string) ($filtros['sort_dir'] ?? 'desc')) === 'asc' ? 'asc' : 'desc',
            )
            ->orderByDesc('id');

        $term = trim((string) ($filtros['search'] ?? $filtros['q'] ?? ''));
        if ($term !== '') {
            $like = '%'.$term.'%';
            $query->where(function (Builder $q) use ($like): void {
                $q->where('curp', 'like', $like)
                    ->orWhere('nombre', 'like', $like)
                    ->orWhere('primer_apellido', 'like', $like)
                    ->orWhere('segundo_apellido', 'like', $like)
                    ->orWhereHas('matriculas', fn (Builder $m) => $m->where('matricula', 'like', $like))
                    ->orWhereHas('matriculaActiva.ofertaAcademica.programaEstudio', fn (Builder $p) => $p->where('nombre', 'like', $like))
                    ->orWhereHas('matriculaActiva.ofertaAcademica.planEstudio', fn (Builder $p) => $p->where('nombre', 'like', $like));
            });
        }

        $estatus = trim((string) ($filtros['estatus'] ?? ''));
        if ($estatus !== '' && $estatus !== 'todos') {
            $query->where('estatus', $estatus);
        }

        $programaId = (int) ($filtros['programa_id'] ?? 0);
        if ($programaId > 0) {
            $query->whereHas('matriculaActiva.ofertaAcademica', fn (Builder $o) => $o->where('programa_estudio_id', $programaId));
        }

        $planId = (int) ($filtros['plan_id'] ?? 0);
        if ($planId > 0) {
            $query->whereHas('matriculaActiva.ofertaAcademica', fn (Builder $o) => $o->where('plan_estudio_id', $planId));
        }

        $sedeId = (int) ($filtros['sede_id'] ?? 0);
        if ($sedeId > 0) {
            $query->whereHas('matriculaActiva.ofertaAcademica', fn (Builder $o) => $o->where('sede_id', $sedeId));
        }

        $periodo = trim((string) ($filtros['periodo'] ?? ''));
        if ($periodo !== '') {
            $query->whereHas('matriculaActiva.inscripcionesPeriodo', function (Builder $q) use ($periodo): void {
                $q->whereIn('estatus', self::ESTATUS_INSCRIPCION_ACTIVA)
                    ->where(function (Builder $nested) use ($periodo): void {
                        $nested->where('etiqueta_periodo_curricular', $periodo)
                            ->orWhere('numero_periodo_curricular', $periodo);
                    });
            });
        }

        $expediente = trim((string) ($filtros['expediente'] ?? ''));
        if ($expediente === 'completo') {
            $query->whereHas('matriculas', fn (Builder $m) => $m->whereIn('estado', $this->simultaneidad->estadosMatriculaActivos()));
        } elseif ($expediente === 'incompleto') {
            $query->whereDoesntHave('matriculas', fn (Builder $m) => $m->whereIn('estado', $this->simultaneidad->estadosMatriculaActivos()));
        }

        return $query;
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
                ->limit(1),
        ];
    }

    /**
     * @return Builder<Alumno>
     */
    protected function alumnosBase(User $user): Builder
    {
        return $this->dashboard->queryAlumnosEnAlcance($user);
    }

    /**
     * @return array<string, mixed>
     */
    protected function filaListado(Alumno $alumno): array
    {
        $mat = $alumno->matriculaActiva;
        $oferta = $mat?->ofertaAcademica;
        $prog = $oferta?->programaEstudio ?? $oferta?->planEstudio?->programaEstudio;
        $plan = $oferta?->planEstudio;
        $incompleto = $this->expedienteIncompleto($alumno);

        return [
            'alumno_id' => $alumno->id,
            'matricula' => $mat?->matricula ?? '—',
            'matricula_id' => $mat?->id,
            'nombre' => $this->nombreInstitucional($alumno),
            'curp' => (string) ($alumno->curp ?? '—'),
            'programa' => $prog?->nombre ?? '—',
            'plan' => $plan?->nombre ?? '—',
            'periodo' => $this->periodoCurricular($mat?->inscripcionesPeriodo),
            'sede' => $oferta?->sede?->nombre ?? '—',
            'estatus' => $this->estatusLegible((string) ($alumno->estatus ?? '')),
            'estatus_codigo' => (string) ($alumno->estatus ?? ''),
            'expediente_estado' => $incompleto ? 'Incompleto' : 'Completo',
            'expediente_completo' => ! $incompleto,
            'actualizado_en' => $alumno->updated_at?->toIso8601String(),
            'urls' => [
                'expediente' => '/app/alumnos/'.$alumno->id.'/expediente',
                'editar' => '/app/alumnos/'.$alumno->id.'/captura-guiado',
                'matricula' => $mat ? '/app/alumnos/'.$alumno->id.'/expediente?tab=matricula' : null,
                'kardex' => '/app/control-escolar/trayectoria?alumno_id='.$alumno->id,
                'constancia' => '/app/certificacion/solicitud?alumno_id='.$alumno->id,
                'reinscripcion' => '/app/control-escolar/reinscripciones?search='.urlencode((string) $alumno->curp),
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    protected function filaReciente(Alumno $alumno): array
    {
        $base = $this->filaListado($alumno);

        return [
            'alumno_id' => $base['alumno_id'],
            'matricula' => $base['matricula'],
            'nombre' => $base['nombre'],
            'programa' => $base['programa'],
            'estatus' => $base['estatus'],
            'expediente_url' => $base['urls']['expediente'],
        ];
    }

    protected function expedienteIncompleto(Alumno $alumno): bool
    {
        return ! $alumno->matriculas()
            ->whereIn('estado', $this->simultaneidad->estadosMatriculaActivos())
            ->exists();
    }

    protected function nombreInstitucional(Alumno $alumno): string
    {
        $nombre = trim(implode(' ', array_filter([
            $alumno->nombre,
            $alumno->primer_apellido,
            $alumno->segundo_apellido,
        ])));

        if (stripos($nombre, 'demosynthetic') !== false) {
            return 'Alumno de prueba institucional';
        }

        return $nombre !== '' ? $nombre : 'Alumno sin nombre';
    }

    /**
     * @param  Collection<int, InscripcionPeriodo>|null  $inscripciones
     */
    protected function periodoCurricular(?Collection $inscripciones): string
    {
        $ins = $inscripciones?->first();
        if ($ins === null) {
            return '—';
        }

        if ($ins->etiqueta_periodo_curricular) {
            return (string) $ins->etiqueta_periodo_curricular;
        }

        if ($ins->numero_periodo_curricular !== null) {
            return (string) $ins->numero_periodo_curricular.'°';
        }

        return '—';
    }

    protected function estatusLegible(string $estatus): string
    {
        return match (strtolower($estatus)) {
            'activo', 'activa' => 'Activo',
            'baja_temporal' => 'Baja temporal',
            'baja_definitiva' => 'Baja definitiva',
            'egresado' => 'Egresado',
            'aspirante' => 'Aspirante',
            'inactivo' => 'Inactivo',
            default => $estatus !== '' ? ucfirst(str_replace('_', ' ', $estatus)) : 'Activo',
        };
    }

    protected function columnaOrden(string $sortBy): string
    {
        return match ($sortBy) {
            'matricula' => 'id',
            'nombre' => 'nombre',
            'curp' => 'curp',
            'estatus' => 'estatus',
            default => 'updated_at',
        };
    }

    /**
     * @return array{programas: list<array{id: int, nombre: string}>, planes: list<array{id: int, nombre: string}>, sedes: list<array{id: int, nombre: string}>, estatus: list<array{value: string, label: string}>}
     */
    protected function catalogosFiltro(User $user): array
    {
        $ofertaIds = Matricula::query()
            ->whereIn('alumno_id', $this->alumnosBase($user)->select('alumnos.id'))
            ->distinct()
            ->pluck('oferta_academica_id');

        $ofertas = OfertaAcademica::query()
            ->whereIn('id', $ofertaIds)
            ->get(['programa_estudio_id', 'plan_estudio_id', 'sede_id']);

        $programaIds = $ofertas->pluck('programa_estudio_id')->filter()->unique();
        $planIds = $ofertas->pluck('plan_estudio_id')->filter()->unique();
        $sedeIds = $ofertas->pluck('sede_id')->filter()->unique();

        return [
            'programas' => ProgramaEstudio::query()
                ->whereIn('id', $programaIds)
                ->orderBy('nombre')
                ->get(['id', 'nombre'])
                ->map(fn ($p) => ['id' => $p->id, 'nombre' => $p->nombre])
                ->values()
                ->all(),
            'planes' => PlanEstudio::query()
                ->whereIn('id', $planIds)
                ->orderBy('nombre')
                ->get(['id', 'nombre'])
                ->map(fn ($p) => ['id' => $p->id, 'nombre' => $p->nombre])
                ->values()
                ->all(),
            'sedes' => Sede::query()
                ->whereIn('id', $sedeIds)
                ->orderBy('nombre')
                ->get(['id', 'nombre'])
                ->map(fn ($s) => ['id' => $s->id, 'nombre' => $s->nombre])
                ->values()
                ->all(),
            'estatus' => [
                ['value' => 'activo', 'label' => 'Activo'],
                ['value' => 'baja_temporal', 'label' => 'Baja temporal'],
                ['value' => 'egresado', 'label' => 'Egresado'],
                ['value' => 'inactivo', 'label' => 'Inactivo'],
                ['value' => 'aspirante', 'label' => 'Aspirante'],
            ],
        ];
    }

    /**
     * @return array<string, bool>
     */
    protected function permisosUi(User $user): array
    {
        return [
            'ver' => $user->can('ver_alumnos') || $user->can('alumnos.ver'),
            'crear' => $user->can('gestionar_alumnos') || $user->can('alumnos.crear'),
            'editar' => $user->can('gestionar_alumnos') || $user->can('alumnos.editar'),
            'importar' => $user->can('alumnos.importar') || $user->can('importaciones_academicas.importar') || $user->can('control_escolar.importar'),
            'exportar' => $user->can('alumnos.exportar') || $user->can('reportes.ver') || $user->can('exportar_reportes'),
            'kardex' => $user->can('kardex.ver') || $user->can('trayectoria.ver'),
            'constancia' => $user->can('constancias.generar') || $user->can('documentos.crear_borrador'),
            'reinscripcion' => $user->can('reinscripciones.crear') || $user->can('reinscripciones.ver'),
            'cambiar_estatus' => $user->can('alumnos.editar') || $user->can('expedientes.editar'),
        ];
    }
}
