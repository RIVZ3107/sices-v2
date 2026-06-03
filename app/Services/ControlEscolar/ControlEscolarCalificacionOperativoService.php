<?php

declare(strict_types=1);

namespace App\Services\ControlEscolar;

use App\Models\CalificacionCorreccion;
use App\Models\CalificacionHistorial;
use App\Models\CicloEscolar;
use App\Models\InscripcionPeriodo;
use App\Models\MateriaCursada;
use App\Models\User;
use App\Models\VentanaOperacion;
use App\Services\Certificacion\AuditoriaService;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ControlEscolarCalificacionOperativoService
{
    private const ESTADOS_MATRICULA_ACTIVA = ['activa', 'vigente'];

    private const ESTATUS_INSCRIPCION_ACTIVA = ['activa', 'inscrita', 'cursando'];

    private const PROCESO_VENTANA = 'captura_calificaciones';

    public function __construct(
        protected ControlEscolarDashboardService $dashboard,
        protected AuditoriaService $auditoria,
    ) {}

    public static function encodeGrupoMateriaKey(int $inscripcionPeriodoId, string $clave): string
    {
        return $inscripcionPeriodoId.'__'.rawurlencode(trim($clave) !== '' ? trim($clave) : '_');
    }

    /**
     * @return array{inscripcion_periodo_id: int, clave: string}
     */
    public static function decodeGrupoMateriaKey(string $key): array
    {
        $parts = explode('__', $key, 2);
        if (count($parts) !== 2) {
            throw ValidationException::withMessages(['grupo_materia' => ['Identificador de grupo/materia inválido.']]);
        }

        return [
            'inscripcion_periodo_id' => (int) $parts[0],
            'clave' => rawurldecode($parts[1]) === '_' ? '' : rawurldecode($parts[1]),
        ];
    }

    /**
     * @param  array<string, mixed>  $filtros
     * @return array<string, mixed>
     */
    public function index(User $user, array $filtros): array
    {
        return $this->dashboard->conAlcanceUsuario($user, function () use ($user, $filtros): array {
            $perPage = max(1, min(50, (int) ($filtros['per_page'] ?? 10)));
            $page = max(1, (int) ($filtros['page'] ?? 1));
            $rows = $this->filasGruposMateria($user, $filtros);
            $total = count($rows);
            $slice = array_slice($rows, ($page - 1) * $perPage, $perPage);

            return [
                'actualizado_en' => now()->toIso8601String(),
                'ventana' => $this->ventanaCaptura($user),
                'aviso_institucional' => 'Captura e importación operativa. La autorización final de correcciones y el cierre global no corresponden a Control Escolar.',
                'data' => $slice,
                'meta' => [
                    'current_page' => $page,
                    'last_page' => max(1, (int) ceil($total / $perPage)),
                    'per_page' => $perPage,
                    'total' => $total,
                    'from' => $total > 0 ? (($page - 1) * $perPage) + 1 : null,
                    'to' => $total > 0 ? min($page * $perPage, $total) : null,
                ],
            ];
        });
    }

    /**
     * @return array<string, mixed>
     */
    public function gestionLegacy(User $user, ?string $search, int $page, int $perPage): array
    {
        $filtros = ['search' => $search, 'page' => $page, 'per_page' => $perPage];
        $index = $this->index($user, $filtros);
        $resumen = $this->resumen($user, $filtros);

        return [
            'actualizado_en' => $index['actualizado_en'],
            'metricas' => [
                'grupos_en_captura' => $resumen['grupos_en_captura'],
                'avance_global_pct' => $resumen['avance_global'],
                'pendientes_captura' => $resumen['pendientes_captura'],
                'correcciones_solicitadas' => $resumen['correcciones_solicitadas'],
                'ciclo_label' => $resumen['ciclo_label'],
            ],
            'avance_global' => [
                'porcentaje' => $resumen['avance_global'],
                'descripcion' => $resumen['avance_global'] > 0
                    ? "{$resumen['avance_global']}% de las calificaciones han sido capturadas en el alcance operativo."
                    : 'Sin registros de captura en tu alcance.',
            ],
            'grupos' => $this->avance($user)['avance_por_programa'] ?? [],
            'listado' => [
                'data' => $index['data'],
                'meta' => $index['meta'],
            ],
        ];
    }

    /**
     * @param  array<string, mixed>  $filtros
     * @return array<string, mixed>
     */
    public function resumen(User $user, array $filtros = []): array
    {
        return $this->dashboard->conAlcanceUsuario($user, function () use ($user, $filtros): array {
            $rows = $this->filasGruposMateria($user, $filtros);
            $totalAlumnos = array_sum(array_column($rows, 'alumnos_esperados'));
            $capturadas = array_sum(array_column($rows, 'calificaciones_capturadas'));
            $correcciones = CalificacionCorreccion::query()
                ->where('estatus', 'solicitada')
                ->whereHas('materiaCursada', fn (Builder $q) => $this->scopeMateria($q, $user))
                ->count();

            $enCaptura = count(array_filter($rows, fn (array $r) => in_array($r['estatus'], ['en_captura', 'pendiente'], true)));
            $pct = $totalAlumnos > 0 ? (int) round(($capturadas / $totalAlumnos) * 100) : 0;

            return [
                'grupos_en_captura' => $enCaptura,
                'avance_global' => $pct,
                'pendientes_captura' => max(0, $totalAlumnos - $capturadas),
                'correcciones_solicitadas' => $correcciones,
                'total_grupos' => count($rows),
                'total_materias' => count($rows),
                'total_alumnos' => $totalAlumnos,
                'ultima_actualizacion' => now()->toIso8601String(),
                'ciclo_label' => $this->etiquetaCicloActivo(),
            ];
        });
    }

    /**
     * @return array<string, mixed>
     */
    public function avance(User $user): array
    {
        return $this->dashboard->conAlcanceUsuario($user, function () use ($user): array {
            $rows = $this->filasGruposMateria($user, []);
            $totalAlumnos = max(1, array_sum(array_column($rows, 'alumnos_esperados')));
            $capturadas = array_sum(array_column($rows, 'calificaciones_capturadas'));
            $pct = (int) round(($capturadas / $totalAlumnos) * 100);

            $porPrograma = [];
            foreach ($rows as $r) {
                $prog = $r['programa'] ?? 'Sin programa';
                $porPrograma[$prog]['total'] = ($porPrograma[$prog]['total'] ?? 0) + $r['alumnos_esperados'];
                $porPrograma[$prog]['capturadas'] = ($porPrograma[$prog]['capturadas'] ?? 0) + $r['calificaciones_capturadas'];
            }
            $avancePrograma = [];
            foreach ($porPrograma as $nombre => $d) {
                $t = max(1, (int) $d['total']);
                $avancePrograma[] = [
                    'programa' => $this->sanitizeLabel($nombre),
                    'porcentaje' => (int) round(((int) $d['capturadas'] / $t) * 100),
                ];
            }

            $dist = ['completado' => 0, 'en_captura' => 0, 'pendiente' => 0, 'en_correccion' => 0];
            foreach ($rows as $r) {
                $k = match ($r['estatus']) {
                    'completado', 'cerrado', 'validado' => 'completado',
                    'en_correccion', 'correccion_solicitada' => 'en_correccion',
                    'en_captura' => 'en_captura',
                    default => 'pendiente',
                };
                $dist[$k]++;
            }

            return [
                'progreso_global' => $pct,
                'avance_por_programa' => $avancePrograma,
                'estado_captura' => $dist,
                'distribucion_estatus' => $dist,
                'grupos_criticos' => array_values(array_filter($rows, fn (array $r) => ($r['avance_pct'] ?? 0) < 50)),
            ];
        });
    }

    /**
     * @return array<string, mixed>
     */
    public function pendientesAtencion(User $user): array
    {
        return $this->dashboard->conAlcanceUsuario($user, function () use ($user): array {
            $rows = $this->filasGruposMateria($user, []);

            return [
                'grupos_con_correcciones_pendientes' => count(array_filter($rows, fn (array $r) => ($r['correcciones_abiertas'] ?? 0) > 0)),
                'grupos_pendientes_captura' => count(array_filter($rows, fn (array $r) => in_array($r['estatus'], ['pendiente', 'en_captura'], true))),
                'grupos_por_cerrar_periodo' => count(array_filter($rows, fn (array $r) => ($r['avance_pct'] ?? 0) >= 100 && $r['estatus'] !== 'cerrado')),
                'importaciones_con_error' => 0,
                'capturas_vencidas' => $this->ventanaCaptura($user)['abierta'] ? 0 : count($rows),
            ];
        });
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function fechasImportantes(User $user): array
    {
        $ciclo = CicloEscolar::query()->where('activo', true)->orderByDesc('id')->first();
        $query = VentanaOperacion::query()->where('activo', true)->where('proceso', self::PROCESO_VENTANA);
        if ($ciclo !== null) {
            $query->where('ciclo_escolar_id', $ciclo->id);
        }
        $ventanas = $query->orderBy('fecha_apertura')->get();
        $items = [];
        foreach ($ventanas as $v) {
            $fecha = $v->fecha_cierre ?? $v->fecha_apertura;
            if ($fecha === null) {
                continue;
            }
            $c = Carbon::parse($fecha);
            $estado = $c->isPast() ? 'vencido' : ($c->diffInDays(now()) <= 14 ? 'proximo' : 'programado');
            $items[] = [
                'id' => $v->id,
                'titulo' => $this->tituloVentana($v->proceso, (string) data_get($v->metadata, 'tipo', 'ordinaria')),
                'descripcion' => 'Ventana operativa de captura de calificaciones.',
                'fecha' => $c->toIso8601String(),
                'dia' => $c->format('d'),
                'mes' => $c->locale('es')->translatedFormat('M'),
                'tipo' => (string) data_get($v->metadata, 'tipo', 'captura'),
                'estado' => $estado,
                'severidad' => $estado === 'vencido' ? 'danger' : ($estado === 'proximo' ? 'warning' : 'info'),
            ];
        }

        if ($items === [] && $ciclo !== null) {
            $items[] = [
                'id' => 0,
                'titulo' => 'Ciclo escolar activo',
                'descripcion' => $this->sanitizeLabel($this->etiquetaCicloActivo()),
                'fecha' => now()->toIso8601String(),
                'dia' => now()->format('d'),
                'mes' => now()->locale('es')->translatedFormat('M'),
                'tipo' => 'ciclo',
                'estado' => 'programado',
                'severidad' => 'info',
            ];
        }

        return $items;
    }

    /**
     * @return array<string, mixed>
     */
    public function ventanaCaptura(User $user): array
    {
        $ciclo = CicloEscolar::query()->where('activo', true)->orderByDesc('id')->first();
        $now = now();
        $ventana = VentanaOperacion::query()
            ->where('activo', true)
            ->where('proceso', self::PROCESO_VENTANA)
            ->when($ciclo !== null, fn (Builder $q) => $q->where('ciclo_escolar_id', $ciclo->id))
            ->where('fecha_apertura', '<=', $now)
            ->where(function (Builder $q) use ($now): void {
                $q->whereNull('fecha_cierre')->orWhere('fecha_cierre', '>=', $now);
            })
            ->first();

        if ($ventana !== null) {
            return ['abierta' => true, 'mensaje' => null, 'hasta' => $ventana->fecha_cierre?->toIso8601String()];
        }

        $hayVentanas = VentanaOperacion::query()->where('proceso', self::PROCESO_VENTANA)->exists();
        if (! $hayVentanas) {
            return ['abierta' => true, 'mensaje' => null, 'sin_configuracion' => true];
        }

        return [
            'abierta' => false,
            'mensaje' => 'La ventana de captura se encuentra cerrada. Solo puedes consultar información o solicitar corrección si tienes permisos.',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function detalleGrupoMateria(User $user, string $grupoMateriaKey): array
    {
        return $this->dashboard->conAlcanceUsuario($user, function () use ($user, $grupoMateriaKey): array {
            $decoded = self::decodeGrupoMateriaKey($grupoMateriaKey);
            $materias = $this->materiasGrupo($user, $decoded['inscripcion_periodo_id'], $decoded['clave']);
            if ($materias->isEmpty()) {
                throw ValidationException::withMessages(['grupo_materia' => ['Grupo o materia no encontrado en tu alcance.']]);
            }
            $first = $materias->first();
            $ins = $first->inscripcionPeriodo;

            return [
                'grupo_materia_key' => $grupoMateriaKey,
                'grupo' => $this->etiquetaGrupo($ins),
                'materia' => (string) ($first->nombre ?? $first->clave),
                'clave' => (string) ($first->clave ?? '—'),
                'programa' => $this->sanitizeLabel((string) ($ins?->matricula?->ofertaAcademica?->planEstudio?->programaEstudio?->nombre ?? '—')),
                'periodo' => $this->sanitizeLabel((string) ($first->periodo ?? $first->etiqueta_periodo_curricular ?? '—')),
                'docente' => (string) data_get($ins?->metadata, 'docente_nombre', '—'),
                'reglas_calificacion' => $this->reglasCalificacion(),
                'ventana_captura' => $this->ventanaCaptura($user),
                'acciones_permitidas' => $this->accionesPermitidas($user),
            ];
        });
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function alumnosGrupoMateria(User $user, string $grupoMateriaKey): array
    {
        return $this->dashboard->conAlcanceUsuario($user, function () use ($user, $grupoMateriaKey): array {
            $decoded = self::decodeGrupoMateriaKey($grupoMateriaKey);
            $materias = $this->materiasGrupo($user, $decoded['inscripcion_periodo_id'], $decoded['clave']);

            return $materias->map(fn (MateriaCursada $m) => [
                'materia_cursada_id' => $m->id,
                'alumno_id' => $m->alumno_id,
                'matricula' => (string) ($m->matricula?->matricula ?? '—'),
                'nombre' => $m->alumno !== null ? $this->nombreCompleto($m->alumno) : '—',
                'curp' => $this->enmascararCurp((string) ($m->alumno?->curp ?? '')),
                'calificacion' => $m->calificacion !== null ? (float) $m->calificacion : null,
                'estatus' => $this->estatusCodigo($m),
                'observaciones' => (string) data_get($m->metadata, 'observaciones', ''),
                'ultima_actualizacion' => $m->updated_at?->toIso8601String(),
            ])->values()->all();
        });
    }

    /**
     * @param  list<array{materia_cursada_id?: int, alumno_id?: int, calificacion: mixed, observaciones?: string}>  $calificaciones
     * @return array<string, mixed>
     */
    public function capturar(User $user, string $grupoMateriaKey, array $calificaciones, bool $forzar = false): array
    {
        if (! $forzar && ! $this->ventanaCaptura($user)['abierta']) {
            throw ValidationException::withMessages([
                'ventana' => ['No es posible capturar o importar calificaciones fuera del periodo autorizado.'],
            ]);
        }

        $decoded = self::decodeGrupoMateriaKey($grupoMateriaKey);
        $errores = [];
        $guardadas = 0;

        DB::transaction(function () use ($user, $decoded, $calificaciones, &$errores, &$guardadas): void {
            foreach ($calificaciones as $i => $item) {
                $mc = $this->resolverMateriaCursada($user, $decoded, $item);
                if ($mc === null) {
                    $errores[] = ['fila' => $i + 1, 'campo' => 'alumno', 'mensaje' => 'Alumno no pertenece al grupo/materia.'];

                    continue;
                }
                $nueva = $this->validarCalificacion($item['calificacion'] ?? null);
                if ($nueva === false) {
                    $errores[] = ['fila' => $i + 1, 'matricula' => $mc->matricula?->matricula, 'campo' => 'calificacion', 'mensaje' => 'La calificación está fuera del rango permitido.'];

                    continue;
                }
                $anterior = $this->valorCalificacion($mc);
                $mc->calificacion = $nueva;
                if (! empty($item['observaciones'])) {
                    $meta = $mc->metadata ?? [];
                    $meta['observaciones'] = $item['observaciones'];
                    $mc->metadata = $meta;
                }
                $mc->estatus_acreditacion = $mc->estatus_acreditacion ?: 'capturada';
                $mc->save();
                $this->registrarHistorial($mc, $user, $anterior, $this->valorCalificacion($mc), 'captura_manual');
                $guardadas++;
            }
        });

        $this->auditoria->registrar('calificaciones.capturar', 'grupo_materia', null, [
            'grupo_materia_key' => $grupoMateriaKey,
            'guardadas' => $guardadas,
        ], $user->id, request()->ip(), (string) request()->userAgent(), ['modulo' => 'calificaciones']);

        if ($errores !== [] && $guardadas === 0) {
            throw ValidationException::withMessages(['filas' => $errores]);
        }

        return ['guardadas' => $guardadas, 'errores' => $errores];
    }

    /**
     * @return array<string, mixed>
     */
    public function importar(User $user, UploadedFile $file, bool $preview, bool $confirmar, ?string $grupoMateriaKey = null): array
    {
        if (! $preview && ! $confirmar) {
            $preview = true;
        }
        if (! $confirmar && ! $this->ventanaCaptura($user)['abierta']) {
            throw ValidationException::withMessages([
                'ventana' => ['No es posible capturar o importar calificaciones fuera del periodo autorizado.'],
            ]);
        }

        $handle = fopen($file->getRealPath(), 'r');
        if ($handle === false) {
            throw ValidationException::withMessages(['archivo' => ['No se pudo leer el archivo.']]);
        }
        $header = fgetcsv($handle);
        $validas = [];
        $invalidas = [];
        $fila = 1;
        while (($row = fgetcsv($handle)) !== false) {
            $fila++;
            $data = array_combine($header ?: ['matricula', 'calificacion'], $row) ?: [];
            $matricula = trim((string) ($data['matricula'] ?? ''));
            $calif = $data['calificacion'] ?? null;
            $mc = MateriaCursada::query()
                ->whereHas('matricula', fn (Builder $m) => $m->where('matricula', $matricula))
                ->when($grupoMateriaKey !== null, function (Builder $q) use ($user, $grupoMateriaKey): void {
                    $d = self::decodeGrupoMateriaKey($grupoMateriaKey);
                    $q->where('inscripcion_periodo_id', $d['inscripcion_periodo_id'])
                        ->where('clave', $d['clave']);
                })
                ->whereHas('alumno', fn (Builder $a) => $a->whereIn('id', $this->dashboard->queryAlumnosEnAlcance($user)->select('id')))
                ->first();
            if ($mc === null) {
                $invalidas[] = ['fila' => $fila, 'matricula' => $matricula, 'mensaje' => 'Matrícula no encontrada en el grupo.'];

                continue;
            }
            $valor = $this->validarCalificacion($calif);
            if ($valor === false) {
                $invalidas[] = ['fila' => $fila, 'matricula' => $matricula, 'mensaje' => 'Calificación inválida.'];

                continue;
            }
            $validas[] = ['fila' => $fila, 'materia_cursada_id' => $mc->id, 'matricula' => $matricula, 'calificacion' => $valor];
        }
        fclose($handle);

        if ($preview || ! $confirmar) {
            return [
                'preview' => true,
                'validas' => count($validas),
                'invalidas' => count($invalidas),
                'detalle_validas' => array_slice($validas, 0, 50),
                'detalle_invalidas' => $invalidas,
            ];
        }

        $payload = array_map(fn (array $v) => [
            'materia_cursada_id' => $v['materia_cursada_id'],
            'calificacion' => $v['calificacion'],
        ], $validas);

        $grupoKey = $grupoMateriaKey ?? ($validas[0] ? self::encodeGrupoMateriaKey(
            (int) MateriaCursada::query()->find($validas[0]['materia_cursada_id'])?->inscripcion_periodo_id,
            (string) MateriaCursada::query()->find($validas[0]['materia_cursada_id'])?->clave
        ) : '0__');

        $result = $this->capturar($user, $grupoKey, $payload, true);
        $this->auditoria->registrar('calificaciones.importar', 'importacion', null, [
            'validas' => count($validas),
            'invalidas' => count($invalidas),
        ], $user->id, request()->ip(), (string) request()->userAgent(), ['modulo' => 'calificaciones']);

        return array_merge($result, ['invalidas' => $invalidas]);
    }

    public function plantillaCsv(?string $grupoMateriaKey = null): StreamedResponse
    {
        return response()->streamDownload(function (): void {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['matricula', 'calificacion', 'observaciones']);
            fputcsv($out, ['EJEMPLO-001', '8.5', '']);
            fclose($out);
        }, 'plantilla_calificaciones.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    /**
     * @param  array{motivo: string, descripcion: string}  $data
     */
    public function solicitarCorreccion(User $user, int $materiaCursadaId, array $data): array
    {
        $mc = MateriaCursada::query()
            ->where('id', $materiaCursadaId)
            ->whereHas('alumno', fn (Builder $a) => $a->whereIn('id', $this->dashboard->queryAlumnosEnAlcance($user)->select('id')))
            ->first();
        if ($mc === null) {
            throw ValidationException::withMessages(['calificacion' => ['Calificación no encontrada en tu alcance.']]);
        }
        $abierta = CalificacionCorreccion::query()
            ->where('materia_cursada_id', $mc->id)
            ->where('estatus', 'solicitada')
            ->exists();
        if ($abierta) {
            throw ValidationException::withMessages(['calificacion' => ['Ya existe una solicitud de corrección abierta para esta calificación.']]);
        }
        $correccion = CalificacionCorreccion::query()->create([
            'materia_cursada_id' => $mc->id,
            'user_id' => $user->id,
            'motivo' => $data['motivo'],
            'descripcion' => $data['descripcion'],
            'estatus' => 'solicitada',
        ]);
        $mc->estatus_acreditacion = 'correccion_solicitada';
        $mc->save();
        $this->registrarHistorial($mc, $user, $this->valorCalificacion($mc), $this->valorCalificacion($mc), 'correccion_solicitada', $data['motivo']);
        $this->auditoria->registrar('calificaciones.correccion.solicitar', 'materia_cursada', $mc->id, $data, $user->id, request()->ip(), (string) request()->userAgent(), ['modulo' => 'calificaciones']);

        return ['correccion_id' => $correccion->id, 'estatus' => 'solicitada'];
    }

    /**
     * @param  array<string, mixed>  $filtros
     * @return array<string, mixed>
     */
    public function historial(User $user, array $filtros): array
    {
        $perPage = max(1, min(50, (int) ($filtros['per_page'] ?? 20)));
        $page = max(1, (int) ($filtros['page'] ?? 1));
        $query = CalificacionHistorial::query()
            ->with(['materiaCursada.alumno', 'materiaCursada.matricula', 'user'])
            ->whereHas('materiaCursada', fn (Builder $q) => $this->scopeMateria($q, $user))
            ->orderByDesc('created_at');
        if (! empty($filtros['grupo_materia'])) {
            $d = self::decodeGrupoMateriaKey((string) $filtros['grupo_materia']);
            $query->whereHas('materiaCursada', fn (Builder $q) => $q
                ->where('inscripcion_periodo_id', $d['inscripcion_periodo_id'])
                ->where('clave', $d['clave']));
        }
        $paginator = $query->paginate($perPage, ['*'], 'page', $page);

        return [
            'data' => collect($paginator->items())->map(fn (CalificacionHistorial $h) => [
                'id' => $h->id,
                'evento' => $h->origen,
                'alumno' => $h->materiaCursada?->alumno !== null ? $this->nombreCompleto($h->materiaCursada->alumno) : '—',
                'materia' => (string) ($h->materiaCursada?->nombre ?? '—'),
                'valor_anterior' => $h->valor_anterior,
                'valor_nuevo' => $h->valor_nuevo,
                'motivo' => $h->motivo,
                'usuario' => $h->user?->name ?? 'Sistema',
                'fecha' => $h->created_at?->toIso8601String(),
                'origen' => $h->origen,
            ])->all(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'total' => $paginator->total(),
            ],
        ];
    }

    /**
     * @param  array<string, mixed>  $filtros
     */
    public function exportar(User $user, array $filtros): StreamedResponse
    {
        $rows = $this->filasGruposMateria($user, $filtros);
        $this->auditoria->registrar('calificaciones.exportar', 'exportacion', null, ['total' => count($rows)], $user->id, request()->ip(), (string) request()->userAgent(), ['modulo' => 'calificaciones']);

        return response()->streamDownload(function () use ($rows): void {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['grupo', 'materia', 'clave', 'programa', 'avance_pct', 'estatus', 'ultima_actualizacion']);
            foreach ($rows as $r) {
                fputcsv($out, [
                    $r['grupo_label'],
                    $r['materia'],
                    $r['clave'],
                    $r['programa'],
                    $r['avance_pct'],
                    $r['estatus'],
                    $r['ultima_actualizacion'],
                ]);
            }
            fclose($out);
        }, 'calificaciones_'.now()->format('Y-m-d').'.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    public function exportarGrupo(User $user, string $grupoMateriaKey): StreamedResponse
    {
        $alumnos = $this->alumnosGrupoMateria($user, $grupoMateriaKey);

        return response()->streamDownload(function () use ($alumnos): void {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['matricula', 'nombre', 'calificacion', 'estatus']);
            foreach ($alumnos as $a) {
                fputcsv($out, [$a['matricula'], $a['nombre'], $a['calificacion'] ?? '', $a['estatus']]);
            }
            fclose($out);
        }, 'calificaciones_grupo.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    public function cerrarCaptura(User $user, string $grupoMateriaKey): array
    {
        $decoded = self::decodeGrupoMateriaKey($grupoMateriaKey);
        $materias = $this->materiasGrupo($user, $decoded['inscripcion_periodo_id'], $decoded['clave']);
        $pendientes = $materias->filter(fn (MateriaCursada $m) => $m->calificacion === null)->count();
        if ($pendientes > 0) {
            throw ValidationException::withMessages([
                'captura' => ["Hay {$pendientes} calificaciones pendientes. No es posible cerrar la captura."],
            ]);
        }
        foreach ($materias as $m) {
            $m->estatus_acreditacion = 'cerrado';
            $m->save();
        }
        $this->auditoria->registrar('calificaciones.cerrar_captura', 'grupo_materia', null, ['key' => $grupoMateriaKey], $user->id, request()->ip(), (string) request()->userAgent(), ['modulo' => 'calificaciones']);

        return ['estatus' => 'cerrado', 'materias' => $materias->count()];
    }

    /**
     * @param  array<string, mixed>  $filtros
     * @return list<array<string, mixed>>
     */
    protected function filasGruposMateria(User $user, array $filtros): array
    {
        $query = MateriaCursada::query()
            ->with(['inscripcionPeriodo.grupo', 'matricula.ofertaAcademica.planEstudio.programaEstudio', 'matricula.ofertaAcademica.sede'])
            ->whereHas('alumno', fn (Builder $q) => $q->whereIn('id', $this->dashboard->queryAlumnosEnAlcance($user)->select('id')))
            ->whereHas('matricula', fn (Builder $m) => $m->whereIn('estado', self::ESTADOS_MATRICULA_ACTIVA))
            ->whereHas('inscripcionPeriodo', fn (Builder $ins) => $ins->whereIn('estatus', self::ESTATUS_INSCRIPCION_ACTIVA));

        $term = trim((string) ($filtros['search'] ?? ''));
        if ($term !== '') {
            $like = '%'.$term.'%';
            $query->where(function (Builder $q) use ($like): void {
                $q->where('nombre', 'like', $like)
                    ->orWhere('clave', 'like', $like)
                    ->orWhereHas('inscripcionPeriodo.grupo', fn (Builder $g) => $g->where('nombre', 'like', $like)->orWhere('clave', 'like', $like));
            });
        }
        if (! empty($filtros['estatus'])) {
            // filtered post-group
        }

        $grupos = $query->get()->groupBy(fn (MateriaCursada $m) => $m->inscripcion_periodo_id.'|'.($m->clave ?? $m->nombre));
        $filas = [];
        foreach ($grupos as $items) {
            /** @var Collection<int, MateriaCursada> $items */
            $first = $items->first();
            $total = $items->count();
            $capt = $items->filter(fn (MateriaCursada $m) => $m->calificacion !== null)->count();
            $pct = $total > 0 ? (int) round(($capt / $total) * 100) : 0;
            $estatus = $this->estatusGrupo($items, $pct);
            if (! empty($filtros['estatus']) && $estatus !== $filtros['estatus']) {
                continue;
            }
            if (! empty($filtros['con_pendientes']) && $pct >= 100) {
                continue;
            }
            if (! empty($filtros['con_correcciones']) && ! $items->contains(fn (MateriaCursada $m) => $this->esCorreccion($m))) {
                continue;
            }
            $correccionesAbiertas = CalificacionCorreccion::query()
                ->whereIn('materia_cursada_id', $items->pluck('id'))
                ->where('estatus', 'solicitada')
                ->count();
            $ins = $first->inscripcionPeriodo;
            $clave = (string) ($first->clave ?? '');
            $filas[] = [
                'grupo_materia_key' => self::encodeGrupoMateriaKey((int) $first->inscripcion_periodo_id, $clave),
                'grupo_label' => $this->etiquetaGrupo($ins),
                'materia' => (string) ($first->nombre ?? '—'),
                'clave' => $clave !== '' ? $clave : '—',
                'programa' => $this->sanitizeLabel((string) ($first->matricula?->ofertaAcademica?->planEstudio?->programaEstudio?->nombre ?? '—')),
                'periodo' => $this->sanitizeLabel((string) ($first->periodo ?? $first->etiqueta_periodo_curricular ?? '—')),
                'docente' => (string) data_get($ins?->metadata, 'docente_nombre', '—'),
                'alumnos_esperados' => $total,
                'calificaciones_capturadas' => $capt,
                'avance_pct' => $pct,
                'estatus' => $estatus,
                'estatus_label' => $this->estatusLabel($estatus),
                'ultima_actualizacion' => $items->max('updated_at')?->toIso8601String(),
                'correcciones_abiertas' => $correccionesAbiertas,
            ];
        }
        usort($filas, fn (array $a, array $b) => strcmp((string) $b['ultima_actualizacion'], (string) $a['ultima_actualizacion']));

        return $filas;
    }

    /**
     * @return Collection<int, MateriaCursada>
     */
    protected function materiasGrupo(User $user, int $inscripcionPeriodoId, string $clave): Collection
    {
        return MateriaCursada::query()
            ->with(['alumno', 'matricula', 'inscripcionPeriodo.grupo'])
            ->where('inscripcion_periodo_id', $inscripcionPeriodoId)
            ->where(function (Builder $q) use ($clave): void {
                if ($clave === '') {
                    $q->whereNull('clave')->orWhere('clave', '');
                } else {
                    $q->where('clave', $clave);
                }
            })
            ->whereHas('alumno', fn (Builder $q) => $q->whereIn('id', $this->dashboard->queryAlumnosEnAlcance($user)->select('id')))
            ->orderBy('id')
            ->get();
    }

    /**
     * @param  Builder<MateriaCursada>  $q
     */
    protected function scopeMateria(Builder $q, User $user): void
    {
        $q->whereHas('alumno', fn (Builder $a) => $a->whereIn('id', $this->dashboard->queryAlumnosEnAlcance($user)->select('id')));
    }

    /**
     * @param  Collection<int, MateriaCursada>  $items
     */
    protected function estatusGrupo(Collection $items, int $pct): string
    {
        if ($items->contains(fn (MateriaCursada $m) => strtolower((string) ($m->estatus_acreditacion ?? '')) === 'cerrado')) {
            return 'cerrado';
        }
        if ($items->contains(fn (MateriaCursada $m) => $this->esCorreccion($m))) {
            return 'en_correccion';
        }
        if ($pct >= 100) {
            return 'completado';
        }
        if ($pct > 0) {
            return 'en_captura';
        }

        return 'pendiente';
    }

    protected function estatusLabel(string $codigo): string
    {
        return match ($codigo) {
            'completado' => 'Completado',
            'en_captura' => 'En captura',
            'en_correccion', 'correccion_solicitada' => 'En corrección',
            'cerrado' => 'Cerrado',
            'validado' => 'Validado',
            'vencido' => 'Vencido',
            default => 'Pendiente',
        };
    }

    protected function estatusCodigo(MateriaCursada $m): string
    {
        if ($this->esCorreccion($m)) {
            return 'en_correccion';
        }
        if ($m->calificacion === null) {
            return 'pendiente';
        }

        return 'capturada';
    }

    protected function esCorreccion(MateriaCursada $m): bool
    {
        $e = strtolower((string) ($m->estatus_acreditacion ?? ''));

        return str_contains($e, 'correccion') || str_contains($e, 'corrección') || str_contains($e, 'revision');
    }

    protected function validarCalificacion(mixed $valor): float|false
    {
        if ($valor === null || $valor === '') {
            return false;
        }
        $n = (float) str_replace(',', '.', (string) $valor);
        $min = 0.0;
        $max = (float) config('certificacion.calificacion_maxima', 10.0);

        return ($n >= $min && $n <= $max) ? round($n, 2) : false;
    }

    protected function valorCalificacion(MateriaCursada $m): ?string
    {
        return $m->calificacion !== null ? (string) $m->calificacion : null;
    }

    protected function registrarHistorial(MateriaCursada $m, User $user, ?string $anterior, ?string $nuevo, string $origen, ?string $motivo = null): void
    {
        if ($anterior === $nuevo && $origen === 'captura_manual') {
            return;
        }
        CalificacionHistorial::query()->create([
            'materia_cursada_id' => $m->id,
            'user_id' => $user->id,
            'valor_anterior' => $anterior,
            'valor_nuevo' => $nuevo,
            'motivo' => $motivo,
            'origen' => $origen,
        ]);
    }

    /**
     * @param  array{inscripcion_periodo_id: int, clave: string}  $decoded
     * @param  array<string, mixed>  $item
     */
    protected function resolverMateriaCursada(User $user, array $decoded, array $item): ?MateriaCursada
    {
        if (! empty($item['materia_cursada_id'])) {
            return $this->materiasGrupo($user, $decoded['inscripcion_periodo_id'], $decoded['clave'])
                ->firstWhere('id', (int) $item['materia_cursada_id']);
        }
        if (! empty($item['alumno_id'])) {
            return $this->materiasGrupo($user, $decoded['inscripcion_periodo_id'], $decoded['clave'])
                ->firstWhere('alumno_id', (int) $item['alumno_id']);
        }

        return null;
    }

    /**
     * @return array{min: float, max: float, escala: string}
     */
    protected function reglasCalificacion(): array
    {
        return [
            'min' => 0,
            'max' => (float) config('certificacion.calificacion_maxima', 10.0),
            'escala' => '0-10',
            'aprobatoria' => (float) config('certificacion.calificacion_aprobatoria_minima', 6.0),
        ];
    }

    /**
     * @return list<string>
     */
    protected function accionesPermitidas(User $user): array
    {
        $a = [];
        if ($user->can('calificaciones.ver')) {
            $a[] = 'ver';
        }
        if ($user->can('calificaciones.capturar') || $user->can('calificaciones.editar')) {
            $a[] = 'capturar';
        }
        if ($user->can('calificaciones.importar') || $user->can('importaciones_academicas.importar')) {
            $a[] = 'importar';
        }
        if ($user->can('calificaciones.correccion.solicitar')) {
            $a[] = 'solicitar_correccion';
        }
        if ($user->can('calificaciones.exportar')) {
            $a[] = 'exportar';
        }
        if ($user->can('calificaciones.cerrar_captura')) {
            $a[] = 'cerrar_captura';
        }

        return $a;
    }

    protected function etiquetaGrupo(?InscripcionPeriodo $ins): string
    {
        if ($ins?->grupo !== null) {
            $clave = trim((string) ($ins->grupo->clave ?? ''));
            $nombre = trim((string) ($ins->grupo->nombre ?? ''));

            return $clave !== '' ? $clave : ($nombre !== '' ? $nombre : 'Grupo');
        }

        return 'Grupo académico';
    }

    protected function etiquetaCicloActivo(): string
    {
        $ciclo = CicloEscolar::query()->where('activo', true)->orderByDesc('id')->first();
        if ($ciclo === null) {
            return 'Ciclo escolar activo';
        }
        $clave = trim((string) ($ciclo->clave ?? ''));
        $nombre = trim((string) ($ciclo->nombre ?? ''));

        return $this->sanitizeLabel($clave !== '' ? $clave : ($nombre !== '' ? $nombre : 'Ciclo escolar activo'));
    }

    protected function tituloVentana(string $proceso, string $tipo): string
    {
        return match ($tipo) {
            'extraordinaria' => 'Inicio de captura extraordinaria',
            'cierre' => 'Cierre de captura ordinaria',
            default => 'Ventana de captura ordinaria',
        };
    }

    protected function sanitizeLabel(string $value): string
    {
        if (stripos($value, 'demo') !== false) {
            return 'Periodo escolar';
        }

        return $value;
    }

    protected function enmascararCurp(string $curp): string
    {
        if (strlen($curp) < 8) {
            return $curp !== '' ? $curp : '—';
        }

        return substr($curp, 0, 4).'********'.substr($curp, -2);
    }

    protected function nombreCompleto(\App\Models\Alumno $alumno): string
    {
        $nombre = trim(implode(' ', array_filter([$alumno->nombre, $alumno->primer_apellido, $alumno->segundo_apellido])));
        if (stripos($nombre, 'demosynthetic') !== false) {
            return 'Alumno institucional';
        }

        return $nombre !== '' ? $nombre : 'Alumno';
    }
}
