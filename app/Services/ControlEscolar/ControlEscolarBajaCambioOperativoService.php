<?php

declare(strict_types=1);

namespace App\Services\ControlEscolar;

use App\Models\Alumno;
use App\Models\BajaCambioHistorial;
use App\Models\BajaCambioSolicitud;
use App\Models\Grupo;
use App\Models\InscripcionPeriodo;
use App\Models\Matricula;
use App\Models\User;
use App\Services\Certificacion\AuditoriaService;
use App\Services\Certificacion\CertificacionAlcanceService;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

class ControlEscolarBajaCambioOperativoService
{
  private const ESTATUS_ACTIVOS = [
        'solicitada', 'en_revision', 'observada', 'en_dictamen', 'aprobada', 'por_aplicar',
    ];

    private const DIAS_SLA_REVISION = 5;

    private const DIAS_SLA_DICTAMEN = 7;

    public function __construct(
        protected ControlEscolarDashboardService $dashboard,
        protected CertificacionAlcanceService $alcance,
        protected AuditoriaService $auditoria,
    ) {}

    /**
     * @param  array<string, mixed>  $filtros
     * @return array<string, mixed>
     */
    public function index(User $user, array $filtros): array
    {
        return $this->dashboard->conAlcanceUsuario($user, function () use ($user, $filtros): array {
            $perPage = max(1, min(50, (int) ($filtros['per_page'] ?? 10)));
            $page = max(1, (int) ($filtros['page'] ?? 1));
            $query = $this->querySolicitudes($user, $filtros);
            $this->aplicarOrden($query, (string) ($filtros['sort'] ?? 'updated_at'), (string) ($filtros['direction'] ?? 'desc'));
            $paginator = $query->paginate($perPage, ['*'], 'page', $page);

            $this->auditoria->registrar(
                'control_escolar.bajas_cambios.consulta',
                BajaCambioSolicitud::class,
                null,
                ['filtros' => array_filter($filtros)],
                $user->id,
                request()?->ip(),
                request()?->userAgent(),
            );

            return [
                'actualizado_en' => now()->toIso8601String(),
                'data' => collect($paginator->items())
                    ->map(fn (BajaCambioSolicitud $s) => array_merge(
                        $this->filaListado($s),
                        ['acciones_permitidas' => $this->accionesPermitidas($s, $user)],
                    ))
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
            ];
        });
    }

    /**
     * @param  array<string, mixed>  $filtros
     * @return array<string, mixed>
     */
    public function resumen(User $user, array $filtros = []): array
    {
        return $this->dashboard->conAlcanceUsuario($user, function () use ($user, $filtros): array {
            $base = $this->querySolicitudes($user, array_diff_key($filtros, ['estatus' => null, 'etapa' => null]));

            return [
                'bajas_temporales' => (clone $base)->where('tipo_cambio', 'baja_temporal')->count(),
                'bajas_definitivas' => (clone $base)->where('tipo_cambio', 'baja_definitiva')->count(),
                'cambios_pendientes' => (clone $base)->whereIn('estatus', ['solicitada', 'en_revision', 'en_dictamen'])->count(),
                'observadas' => (clone $base)->where('estatus', 'observada')->count(),
                'aprobadas_periodo' => (clone $base)->whereIn('estatus', ['aprobada', 'por_aplicar', 'aplicada'])
                    ->where('updated_at', '>=', now()->startOfMonth())->count(),
                'total_en_alcance' => (clone $base)->count(),
                'ultima_actualizacion' => now()->toIso8601String(),
            ];
        });
    }

    /**
     * @return array<string, mixed>
     */
    public function flujo(User $user): array
    {
        return $this->dashboard->conAlcanceUsuario($user, function () use ($user): array {
            $base = $this->querySolicitudes($user, []);

            $etapas = [
                'solicitud' => (clone $base)->where('etapa', 'solicitud')->count(),
                'revision' => (clone $base)->where('etapa', 'revision')->count(),
                'dictamen' => (clone $base)->where('etapa', 'dictamen')->count(),
                'aplicacion' => (clone $base)->where('etapa', 'aplicacion')->count(),
            ];

            return [
                'solicitud_total' => $etapas['solicitud'],
                'revision_total' => $etapas['revision'],
                'dictamen_total' => $etapas['dictamen'],
                'aplicacion_total' => $etapas['aplicacion'],
                'total_por_etapa' => $etapas,
                'tiempos_promedio' => [
                    'solicitud' => self::DIAS_SLA_REVISION,
                    'revision' => self::DIAS_SLA_REVISION,
                    'dictamen' => self::DIAS_SLA_DICTAMEN,
                    'aplicacion' => 3,
                ],
                'maximos_espera' => [
                    'solicitud' => self::DIAS_SLA_REVISION,
                    'revision' => self::DIAS_SLA_REVISION,
                    'dictamen' => self::DIAS_SLA_DICTAMEN,
                    'aplicacion' => 3,
                ],
            ];
        });
    }

    /**
     * @return array<string, mixed>
     */
    public function riesgoOperativo(User $user): array
    {
        return $this->dashboard->conAlcanceUsuario($user, function () use ($user): array {
            $base = $this->querySolicitudes($user, []);

            $criticas = (clone $base)->where('prioridad', 'critica')->count();
            $vencidas = (clone $base)->whereNotNull('fecha_vencimiento')
                ->where('fecha_vencimiento', '<', now())
                ->whereNotIn('estatus', ['aplicada', 'rechazada', 'cancelada'])
                ->count();
            $docIncompleta = (clone $base)->where('documentacion_completa', false)
                ->whereNotIn('estatus', ['aplicada', 'rechazada', 'cancelada'])
                ->count();
            $impactoAlto = (clone $base)->where('impacto_academico_alto', true)
                ->whereNotIn('estatus', ['aplicada', 'rechazada', 'cancelada'])
                ->count();

            return [
                'solicitudes_criticas' => $criticas,
                'solicitudes_vencidas' => $vencidas,
                'documentacion_incompleta' => $docIncompleta,
                'impacto_academico_alto' => $impactoAlto,
                'total_riesgo' => $criticas + $vencidas + $docIncompleta,
            ];
        });
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function motivosFrecuentes(User $user): array
    {
        return $this->dashboard->conAlcanceUsuario($user, function () use ($user): array {
            $colores = ['#185FA5', '#0F6E56', '#EA580C', '#6B21A8', '#EAB308', '#64748b'];
            $rows = $this->querySolicitudes($user, [])->select('motivo')->get();
            $conteo = $rows->groupBy('motivo')->map->count()->sortDesc()->take(6);
            $total = max(1, $conteo->sum());
            $i = 0;

            return $conteo->map(function (int $count, string $motivo) use ($total, $colores, &$i): array {
                return [
                    'motivo' => $this->sanitizeLabel($motivo),
                    'label' => $this->sanitizeLabel($motivo),
                    'total' => $count,
                    'count' => $count,
                    'porcentaje' => (int) round(($count / $total) * 100),
                    'pct' => (int) round(($count / $total) * 100),
                    'color' => $colores[$i++ % count($colores)],
                    'filtro' => ['motivo' => $motivo],
                ];
            })->values()->all();
        });
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function cambiosRecientes(User $user): array
    {
        return $this->dashboard->conAlcanceUsuario($user, function () use ($user): array {
            $ids = $this->querySolicitudes($user, [])->select('id');

            return BajaCambioHistorial::query()
                ->whereIn('solicitud_id', $ids)
                ->with(['solicitud.alumno', 'solicitud.matricula'])
                ->latest('created_at')
                ->limit(10)
                ->get()
                ->map(function (BajaCambioHistorial $h): array {
                    $s = $h->solicitud;
                    $dt = $h->created_at ?? now();

                    return [
                        'id' => $h->id,
                        'alumno' => $this->sanitizeLabel($this->nombreAlumno($s?->alumno)),
                        'matricula' => (string) ($s?->matricula?->matricula ?? '—'),
                        'folio' => $s?->folio ?? '—',
                        'tipo_cambio' => $this->labelTipo((string) ($s?->tipo_cambio ?? '')),
                        'estatus' => $this->labelEstatus((string) $h->estado_nuevo),
                        'fecha' => $dt->toIso8601String(),
                        'tiempo_relativo' => $dt->locale('es')->diffForHumans(),
                        'severidad' => $this->severidadEstatus((string) $h->estado_nuevo),
                        'text' => $this->labelEstatus((string) $h->estado_nuevo).' — '.$this->labelTipo((string) ($s?->tipo_cambio ?? '')),
                        'subtext' => $this->sanitizeLabel($this->nombreAlumno($s?->alumno)),
                    ];
                })
                ->all();
        });
    }

    /**
     * @return array<string, mixed>
     */
    public function detalle(User $user, BajaCambioSolicitud $solicitud): array
    {
        $this->assertAlcance($user, $solicitud);
        $solicitud->load([
            'alumno', 'matricula.ofertaAcademica.programaEstudio', 'grupoOrigen', 'grupoDestino',
            'ofertaOrigen.programaEstudio', 'ofertaDestino.programaEstudio', 'responsable', 'historiales.usuario',
        ]);

        $this->auditoria->registrar(
            'control_escolar.bajas_cambios.detalle',
            BajaCambioSolicitud::class,
            $solicitud->id,
            ['alumno_id' => $solicitud->alumno_id],
            $user->id,
            request()?->ip(),
            request()?->userAgent(),
        );

        $fila = $this->filaListado($solicitud);

        return array_merge($fila, [
            'descripcion' => $solicitud->descripcion,
            'dictamen' => $solicitud->dictamen,
            'fecha_efectiva' => $solicitud->fecha_efectiva?->format('d/m/Y'),
            'observaciones' => (array) data_get($solicitud->metadata, 'observaciones', []),
            'historial' => $solicitud->historiales->map(fn (BajaCambioHistorial $h) => [
                'estado_anterior' => $h->estado_anterior,
                'estado_nuevo' => $h->estado_nuevo,
                'comentario' => $h->comentario,
                'usuario' => $h->usuario?->name,
                'fecha' => $h->created_at?->timezone(config('app.timezone'))->format('d/m/Y h:i a'),
            ])->values()->all(),
            'acciones_permitidas' => $this->accionesPermitidas($solicitud, $user),
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function crear(User $user, array $data, ?string $ip = null, ?string $userAgent = null): BajaCambioSolicitud
    {
        $matricula = Matricula::query()->with('ofertaAcademica')->findOrFail((int) $data['matricula_id']);
        if ((int) $matricula->alumno_id !== (int) $data['alumno_id']) {
            throw ValidationException::withMessages(['matricula_id' => ['La matrícula no corresponde al alumno.']]);
        }
        if (! $this->alcance->ofertaEnAlcance($user, (int) $matricula->oferta_academica_id)) {
            throw new AccessDeniedHttpException('El alumno está fuera de su alcance territorial.');
        }

        $tipo = (string) $data['tipo_cambio'];
        $this->validarDuplicadoActivo((int) $data['alumno_id'], $tipo);
        $this->validarCamposPorTipo($tipo, $data);

        $oferta = $matricula->ofertaAcademica;
        $ins = InscripcionPeriodo::query()
            ->with('grupo')
            ->where('matricula_id', $matricula->id)
            ->whereIn('estatus', ['activa', 'inscrita', 'cursando'])
            ->orderByDesc('id')
            ->first();

        $solicitud = BajaCambioSolicitud::query()->create([
            'folio' => $this->generarFolio(),
            'alumno_id' => (int) $data['alumno_id'],
            'matricula_id' => $matricula->id,
            'ciclo_escolar_id' => $matricula->ciclo_escolar_id,
            'periodo_escolar_id' => $ins?->periodo_escolar_id,
            'institucion_id' => $oferta?->institucion_id,
            'sede_id' => $oferta?->sede_id,
            'tipo_cambio' => $tipo,
            'motivo' => (string) $data['motivo'],
            'descripcion' => $data['descripcion'] ?? null,
            'estatus' => 'solicitada',
            'etapa' => 'solicitud',
            'prioridad' => 'media',
            'fecha_efectiva' => $data['fecha_efectiva'] ?? null,
            'fecha_inicio' => $data['fecha_inicio'] ?? null,
            'fecha_fin' => $data['fecha_fin'] ?? null,
            'grupo_origen_id' => $ins?->grupo_id,
            'grupo_destino_id' => $data['grupo_destino_id'] ?? null,
            'turno_origen' => $ins?->grupo?->turno ?? data_get($matricula->metadata, 'turno'),
            'turno_destino' => $data['turno_destino'] ?? null,
            'oferta_origen_id' => $matricula->oferta_academica_id,
            'oferta_destino_id' => $data['oferta_destino_id'] ?? null,
            'inscripcion_periodo_id' => $ins?->id,
            'documentacion_completa' => ! empty($data['documentacion_completa']),
            'impacto_academico_alto' => in_array($tipo, ['baja_definitiva', 'cambio_programa'], true),
            'fecha_vencimiento' => now()->addDays(self::DIAS_SLA_REVISION),
            'solicitado_por' => $user->id,
            'metadata' => ['soporte' => $data['soporte'] ?? null],
        ]);

        $solicitud->prioridad = $this->calcularPrioridad($solicitud);
        $solicitud->save();

        $this->registrarHistorial($solicitud, null, 'solicitada', null, 'solicitud', 'Solicitud creada.', $user->id);
        $this->auditoria->registrar(
            'control_escolar.bajas_cambios.crear',
            BajaCambioSolicitud::class,
            $solicitud->id,
            ['tipo_cambio' => $tipo, 'alumno_id' => $solicitud->alumno_id],
            $user->id,
            $ip,
            $userAgent,
        );

        return $solicitud->fresh();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function actualizar(User $user, BajaCambioSolicitud $solicitud, array $data, ?string $ip = null, ?string $userAgent = null): BajaCambioSolicitud
    {
        $this->assertAlcance($user, $solicitud);
        if (! in_array($solicitud->estatus, ['solicitada', 'observada'], true)) {
            throw ValidationException::withMessages(['estatus' => ['La solicitud no puede editarse en su estado actual.']]);
        }

        $solicitud->fill(collect($data)->only([
            'motivo', 'descripcion', 'fecha_efectiva', 'fecha_inicio', 'fecha_fin',
            'grupo_destino_id', 'turno_destino', 'oferta_destino_id',
        ])->filter(fn ($v) => $v !== null)->all());
        if (isset($data['documentacion_completa'])) {
            $solicitud->documentacion_completa = (bool) $data['documentacion_completa'];
        }
        $solicitud->save();

        $this->auditoria->registrar('control_escolar.bajas_cambios.editar', BajaCambioSolicitud::class, $solicitud->id, [], $user->id, $ip, $userAgent);

        return $solicitud->fresh();
    }

    public function revisar(User $user, BajaCambioSolicitud $solicitud, ?string $ip = null, ?string $userAgent = null): BajaCambioSolicitud
    {
        return $this->transicion($user, $solicitud, 'en_revision', 'revision', 'Solicitud en revisión.', $ip, $userAgent, 'control_escolar.bajas_cambios.revisar');
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function aprobar(User $user, BajaCambioSolicitud $solicitud, array $data, ?string $ip = null, ?string $userAgent = null): BajaCambioSolicitud
    {
        $this->assertAlcance($user, $solicitud);
        $this->validarAprobacion($solicitud);

        $nuevo = in_array($solicitud->tipo_cambio, ['baja_temporal', 'baja_definitiva'], true) ? 'aprobada' : 'por_aplicar';
        $solicitud->dictamen = (string) ($data['dictamen'] ?? $data['comentario'] ?? '');
        if (! empty($data['fecha_efectiva'])) {
            $solicitud->fecha_efectiva = $data['fecha_efectiva'];
        }
        $solicitud->responsable_id = $user->id;

        return $this->transicion($user, $solicitud, $nuevo, 'aplicacion', 'Solicitud aprobada.', $ip, $userAgent, 'control_escolar.bajas_cambios.aprobar');
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function rechazar(User $user, BajaCambioSolicitud $solicitud, array $data, ?string $ip = null, ?string $userAgent = null): BajaCambioSolicitud
    {
        if (trim((string) ($data['motivo'] ?? '')) === '') {
            throw ValidationException::withMessages(['motivo' => ['El motivo de rechazo es obligatorio.']]);
        }
        $solicitud->clasificacion_rechazo = $data['clasificacion'] ?? 'institucional';
        $comentario = trim((string) ($data['comentario'] ?? $data['motivo']));

        return $this->transicion($user, $solicitud, 'rechazada', 'dictamen', $comentario, $ip, $userAgent, 'control_escolar.bajas_cambios.rechazar');
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function observar(User $user, BajaCambioSolicitud $solicitud, array $data, ?string $ip = null, ?string $userAgent = null): BajaCambioSolicitud
    {
        if (trim((string) ($data['motivo'] ?? '')) === '') {
            throw ValidationException::withMessages(['motivo' => ['El motivo de la observación es obligatorio.']]);
        }
        $meta = $solicitud->metadata ?? [];
        $obs = (array) ($meta['observaciones'] ?? []);
        $obs[] = [
            'texto' => (string) $data['motivo'],
            'descripcion' => (string) ($data['descripcion'] ?? ''),
            'estado' => 'pendiente',
            'created_at' => now()->toIso8601String(),
        ];
        $meta['observaciones'] = $obs;
        $solicitud->metadata = $meta;

        return $this->transicion($user, $solicitud, 'observada', 'revision', (string) $data['descripcion'], $ip, $userAgent, 'control_escolar.bajas_cambios.observar');
    }

    public function aplicar(User $user, BajaCambioSolicitud $solicitud, ?string $ip = null, ?string $userAgent = null): BajaCambioSolicitud
    {
        $this->assertAlcance($user, $solicitud);
        if (! in_array($solicitud->estatus, ['aprobada', 'por_aplicar'], true)) {
            throw ValidationException::withMessages([
                'estatus' => ['No es posible aplicar el cambio porque la solicitud no cuenta con dictamen aprobado.'],
            ]);
        }

        return DB::transaction(function () use ($user, $solicitud, $ip, $userAgent): BajaCambioSolicitud {
            $this->ejecutarAplicacion($solicitud);
            $solicitud->aplicado_at = now();
            $result = $this->transicion($user, $solicitud, 'aplicada', 'aplicacion', 'Cambio aplicado en el expediente académico.', $ip, $userAgent, 'control_escolar.bajas_cambios.aplicar');

            return $result;
        });
    }

    public function dictamen(User $user, BajaCambioSolicitud $solicitud)
    {
        $this->assertAlcance($user, $solicitud);
        $solicitud->load(['alumno', 'matricula']);
        $html = view('pdf.baja_cambio_dictamen', [
            'solicitud' => $solicitud,
            'alumno' => $solicitud->alumno,
            'matricula' => $solicitud->matricula,
        ])->render();

        $this->auditoria->registrar(
            'control_escolar.bajas_cambios.dictamen',
            BajaCambioSolicitud::class,
            $solicitud->id,
            [],
            $user->id,
            request()?->ip(),
            request()?->userAgent(),
        );

        return Pdf::loadHTML($html)->download('dictamen_'.$solicitud->folio.'.pdf');
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    public function aprobarMasivo(User $user, array $data, ?string $ip = null, ?string $userAgent = null): array
    {
        $ids = array_map('intval', (array) ($data['ids'] ?? []));
        $comentario = trim((string) ($data['dictamen'] ?? $data['comentario'] ?? ''));
        if ($comentario === '') {
            throw ValidationException::withMessages(['dictamen' => ['El comentario o dictamen es obligatorio.']]);
        }

        $procesadas = [];
        $bloqueadas = [];
        $errores = [];

        foreach ($ids as $id) {
            $s = BajaCambioSolicitud::query()->find($id);
            if ($s === null) {
                $errores[] = ['id' => $id, 'message' => 'No encontrada.'];
                continue;
            }
            try {
                $this->aprobar($user, $s, ['dictamen' => $comentario], $ip, $userAgent);
                $procesadas[] = $id;
            } catch (\Throwable $e) {
                $bloqueadas[] = ['id' => $id, 'message' => $e->getMessage()];
            }
        }

        $this->auditoria->registrar('control_escolar.bajas_cambios.aprobar_masivo', BajaCambioSolicitud::class, null, [
            'ids' => $procesadas,
        ], $user->id, $ip, $userAgent);

        return compact('procesadas', 'bloqueadas', 'errores');
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    public function rechazarMasivo(User $user, array $data, ?string $ip = null, ?string $userAgent = null): array
    {
        $ids = array_map('intval', (array) ($data['ids'] ?? []));
        $motivo = trim((string) ($data['motivo'] ?? ''));
        $comentario = trim((string) ($data['comentario'] ?? ''));
        if ($motivo === '' || $comentario === '') {
            throw ValidationException::withMessages([
                'motivo' => $motivo === '' ? ['El motivo es obligatorio.'] : [],
                'comentario' => $comentario === '' ? ['El comentario es obligatorio.'] : [],
            ]);
        }

        $procesadas = [];
        $errores = [];

        foreach ($ids as $id) {
            $s = BajaCambioSolicitud::query()->find($id);
            if ($s === null) {
                $errores[] = ['id' => $id, 'message' => 'No encontrada.'];
                continue;
            }
            try {
                $this->rechazar($user, $s, ['motivo' => $motivo, 'comentario' => $comentario], $ip, $userAgent);
                $procesadas[] = $id;
            } catch (\Throwable $e) {
                $errores[] = ['id' => $id, 'message' => $e->getMessage()];
            }
        }

        $this->auditoria->registrar('control_escolar.bajas_cambios.rechazar_masivo', BajaCambioSolicitud::class, null, [
            'ids' => $procesadas,
        ], $user->id, $ip, $userAgent);

        return ['procesadas' => $procesadas, 'errores' => $errores];
    }

    /**
     * @param  array<string, mixed>  $filtros
     */
    public function exportar(User $user, array $filtros): StreamedResponse
    {
        $query = $this->querySolicitudes($user, $filtros);
        $rows = $query->limit(5000)->get();

        $this->auditoria->registrar('control_escolar.bajas_cambios.exportar', BajaCambioSolicitud::class, null, [
            'total' => $rows->count(),
        ], $user->id, request()?->ip(), request()?->userAgent());

        return response()->streamDownload(function () use ($rows): void {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['Folio', 'Alumno', 'Matrícula', 'Tipo', 'Motivo', 'Estatus', 'Etapa', 'Prioridad', 'Fecha solicitud']);
            foreach ($rows as $s) {
                $f = $this->filaListado($s);
                fputcsv($out, [
                    $f['folio'], $f['alumno'], $f['matricula'], $f['tipo_cambio_label'],
                    $f['motivo'], $f['estatus_label'], $f['etapa'], $f['prioridad'], $f['fecha_solicitud'],
                ]);
            }
            fclose($out);
        }, 'bajas_cambios_'.now()->format('Y-m-d').'.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    protected function ejecutarAplicacion(BajaCambioSolicitud $solicitud): void
    {
        $matricula = Matricula::query()->findOrFail($solicitud->matricula_id);
        $alumno = Alumno::query()->findOrFail($solicitud->alumno_id);

        match ($solicitud->tipo_cambio) {
            'baja_temporal' => $this->aplicarBajaTemporal($alumno, $matricula, $solicitud),
            'baja_definitiva' => $this->aplicarBajaDefinitiva($alumno, $matricula, $solicitud),
            'cambio_grupo' => $this->aplicarCambioGrupo($solicitud),
            'cambio_turno' => $this->aplicarCambioTurno($matricula, $solicitud),
            'cambio_programa' => $this->aplicarCambioPrograma($matricula, $solicitud),
            default => throw ValidationException::withMessages(['tipo_cambio' => ['Tipo de cambio no soportado.']]),
        };
    }

    protected function aplicarBajaTemporal(Alumno $alumno, Matricula $matricula, BajaCambioSolicitud $s): void
    {
        $alumno->estatus = 'baja_temporal';
        $alumno->save();
        $matricula->estado = 'baja_temporal';
        $meta = $matricula->metadata ?? [];
        $meta['baja_temporal'] = ['desde' => $s->fecha_inicio?->toDateString(), 'hasta' => $s->fecha_fin?->toDateString()];
        $matricula->metadata = $meta;
        $matricula->save();
    }

    protected function aplicarBajaDefinitiva(Alumno $alumno, Matricula $matricula, BajaCambioSolicitud $s): void
    {
        $alumno->estatus = 'baja_definitiva';
        $alumno->save();
        $matricula->estado = 'baja';
        $matricula->fecha_egreso = $s->fecha_efectiva ?? now();
        $matricula->save();
        InscripcionPeriodo::query()
            ->where('matricula_id', $matricula->id)
            ->whereIn('estatus', ['activa', 'inscrita', 'cursando'])
            ->update(['estatus' => 'baja']);
    }

    protected function aplicarCambioGrupo(BajaCambioSolicitud $s): void
    {
        if ($s->inscripcion_periodo_id === null || $s->grupo_destino_id === null) {
            throw ValidationException::withMessages(['grupo_destino_id' => ['Falta grupo destino.']]);
        }
        $ins = InscripcionPeriodo::query()->findOrFail($s->inscripcion_periodo_id);
        $grupo = Grupo::query()->findOrFail($s->grupo_destino_id);
        $ins->grupo_id = $grupo->id;
        $ins->save();
    }

    protected function aplicarCambioTurno(Matricula $matricula, BajaCambioSolicitud $s): void
    {
        $meta = $matricula->metadata ?? [];
        $meta['turno'] = $s->turno_destino;
        $matricula->metadata = $meta;
        $matricula->save();
    }

    protected function aplicarCambioPrograma(Matricula $matricula, BajaCambioSolicitud $s): void
    {
        if ($s->oferta_destino_id === null) {
            throw ValidationException::withMessages(['oferta_destino_id' => ['Falta programa destino.']]);
        }
        $matricula->oferta_academica_id = $s->oferta_destino_id;
        $matricula->save();
    }

    protected function transicion(
        User $user,
        BajaCambioSolicitud $solicitud,
        string $estatusNuevo,
        string $etapaNueva,
        string $comentario,
        ?string $ip,
        ?string $userAgent,
        string $eventoAuditoria,
    ): BajaCambioSolicitud {
        $this->assertAlcance($user, $solicitud);
        $anterior = $solicitud->estatus;
        $etapaAnterior = $solicitud->etapa;
        $solicitud->estatus = $estatusNuevo;
        $solicitud->etapa = $etapaNueva;
        if ($etapaNueva === 'dictamen' && $estatusNuevo === 'en_dictamen') {
            $solicitud->fecha_vencimiento = now()->addDays(self::DIAS_SLA_DICTAMEN);
        }
        $solicitud->prioridad = $this->calcularPrioridad($solicitud);
        $solicitud->save();
        $this->registrarHistorial($solicitud, $anterior, $estatusNuevo, $etapaAnterior, $etapaNueva, $comentario, $user->id);
        $this->auditoria->registrar($eventoAuditoria, BajaCambioSolicitud::class, $solicitud->id, [
            'estatus' => $estatusNuevo,
        ], $user->id, $ip, $userAgent);

        return $solicitud->fresh();
    }

    protected function validarAprobacion(BajaCambioSolicitud $solicitud): void
    {
        $errores = [];
        if (! $solicitud->documentacion_completa && in_array($solicitud->tipo_cambio, ['baja_definitiva'], true)) {
            $errores[] = 'Falta soporte documental.';
        }
        $obsPendientes = collect((array) data_get($solicitud->metadata, 'observaciones', []))
            ->contains(fn ($o) => is_array($o) && ($o['estado'] ?? '') === 'pendiente');
        if ($obsPendientes || $solicitud->estatus === 'observada') {
            $errores[] = 'Existen observaciones abiertas.';
        }
        if (! in_array($solicitud->estatus, ['en_revision', 'en_dictamen', 'solicitada'], true)) {
            $errores[] = 'La solicitud no está en etapa válida para aprobación.';
        }
        if ($errores !== []) {
            throw ValidationException::withMessages(['requisitos' => $errores]);
        }
    }

    /**
     * @param  array<string, mixed>  $data
     */
    protected function validarCamposPorTipo(string $tipo, array $data): void
    {
        if (trim((string) ($data['motivo'] ?? '')) === '') {
            throw ValidationException::withMessages(['motivo' => ['El motivo es obligatorio.']]);
        }
        match ($tipo) {
            'baja_temporal' => true,
            'baja_definitiva' => true,
            'cambio_grupo' => empty($data['grupo_destino_id'])
                ? throw ValidationException::withMessages(['grupo_destino_id' => ['Seleccione el grupo destino.']])
                : true,
            'cambio_turno' => empty($data['turno_destino'])
                ? throw ValidationException::withMessages(['turno_destino' => ['Indique el turno destino.']])
                : true,
            'cambio_programa' => empty($data['oferta_destino_id'])
                ? throw ValidationException::withMessages(['oferta_destino_id' => ['Seleccione el programa destino.']])
                : true,
            default => throw ValidationException::withMessages(['tipo_cambio' => ['Tipo de cambio no válido.']]),
        };
    }

    protected function validarDuplicadoActivo(int $alumnoId, string $tipo): void
    {
        $existe = BajaCambioSolicitud::query()
            ->where('alumno_id', $alumnoId)
            ->where('tipo_cambio', $tipo)
            ->whereIn('estatus', self::ESTATUS_ACTIVOS)
            ->exists();
        if ($existe) {
            throw ValidationException::withMessages([
                'tipo_cambio' => ['Ya existe una solicitud activa de este tipo para el alumno seleccionado.'],
            ]);
        }
    }

    /**
     * @param  array<string, mixed>  $filtros
     * @return Builder<BajaCambioSolicitud>
     */
    protected function querySolicitudes(User $user, array $filtros): Builder
    {
        $query = BajaCambioSolicitud::query()
            ->with(['alumno', 'matricula', 'ofertaOrigen.programaEstudio', 'responsable'])
            ->whereIn('alumno_id', $this->dashboard->queryAlumnosEnAlcance($user)->select('id'));

        if (! empty($filtros['search'])) {
            $like = '%'.trim((string) $filtros['search']).'%';
            $query->where(function (Builder $q) use ($like): void {
                $q->where('folio', 'like', $like)
                    ->orWhere('motivo', 'like', $like)
                    ->orWhereHas('alumno', fn (Builder $a) => $a
                        ->where('nombre', 'like', $like)
                        ->orWhere('primer_apellido', 'like', $like)
                        ->orWhere('curp', 'like', $like))
                    ->orWhereHas('matricula', fn (Builder $m) => $m->where('matricula', 'like', $like));
            });
        }

        foreach (['estatus', 'tipo_cambio', 'etapa', 'prioridad', 'motivo'] as $campo) {
            if (! empty($filtros[$campo])) {
                $query->where($campo, (string) $filtros[$campo]);
            }
        }

        if (! empty($filtros['periodo_id'])) {
            $query->where('periodo_escolar_id', (int) $filtros['periodo_id']);
        }
        if (! empty($filtros['programa_id'])) {
            $query->whereHas('ofertaOrigen', fn (Builder $q) => $q->where('programa_estudio_id', (int) $filtros['programa_id']));
        }
        if (! empty($filtros['sede_id'])) {
            $query->where('sede_id', (int) $filtros['sede_id']);
        }
        if (! empty($filtros['responsable_id'])) {
            $query->where('responsable_id', (int) $filtros['responsable_id']);
        }
        if (! empty($filtros['fecha_desde'])) {
            $query->whereDate('created_at', '>=', $filtros['fecha_desde']);
        }
        if (! empty($filtros['fecha_hasta'])) {
            $query->whereDate('created_at', '<=', $filtros['fecha_hasta']);
        }
        if (! empty($filtros['vencidas'])) {
            $query->where('fecha_vencimiento', '<', now());
        }
        if (! empty($filtros['criticas'])) {
            $query->where('prioridad', 'critica');
        }
        if (! empty($filtros['con_observaciones'])) {
            $query->where('estatus', 'observada');
        }
        if (! empty($filtros['documentos_pendientes'])) {
            $query->where('documentacion_completa', false);
        }

        return $query;
    }

    protected function aplicarOrden(Builder $query, string $sort, string $direction): void
    {
        $dir = strtolower($direction) === 'asc' ? 'asc' : 'desc';
        $col = match ($sort) {
            'prioridad' => 'prioridad',
            'fecha', 'fecha_solicitud', 'created_at' => 'created_at',
            default => 'updated_at',
        };
        $query->orderBy($col, $dir)->orderByDesc('id');
    }

    /**
     * @return array<string, mixed>
     */
    protected function filaListado(BajaCambioSolicitud $s): array
    {
        $dt = $s->created_at ?? now();
        $programa = $s->ofertaOrigen?->programaEstudio?->nombre ?? '—';

        return [
            'id' => $s->id,
            'folio' => $s->folio,
            'alumno' => $this->sanitizeLabel($this->nombreAlumno($s->alumno)),
            'alumno_id' => $s->alumno_id,
            'matricula' => (string) ($s->matricula?->matricula ?? '—'),
            'matricula_id' => $s->matricula_id,
            'programa' => $this->sanitizeLabel($programa),
            'tipo_cambio' => $s->tipo_cambio,
            'tipo_cambio_label' => $this->labelTipo($s->tipo_cambio),
            'motivo' => $this->sanitizeLabel($s->motivo),
            'fecha_solicitud' => $dt->timezone(config('app.timezone'))->format('d/m/Y h:i a'),
            'estatus' => $s->estatus,
            'estatus_label' => $this->labelEstatus($s->estatus),
            'etapa' => $s->etapa,
            'prioridad' => $s->prioridad,
            'ultimo_movimiento' => [
                'descripcion' => $this->labelEstatus($s->estatus),
                'fecha' => ($s->updated_at ?? $dt)->timezone(config('app.timezone'))->format('d/m/Y h:i a'),
            ],
            'responsable' => $s->responsable?->name ?? '—',
            'dias_espera' => (int) $s->created_at?->diffInDays(now()),
            'vencida' => $s->fecha_vencimiento !== null && $s->fecha_vencimiento->isPast(),
            'acciones_permitidas' => [],
            'detalle_url' => '/app/control-escolar/bajas-cambios?solicitud='.$s->id,
        ];
    }

    /**
     * @return list<string>
     */
    protected function accionesPermitidas(BajaCambioSolicitud $s, User $user): array
    {
        $a = ['ver'];
        if ($user->can('bajas_cambios.editar') && in_array($s->estatus, ['solicitada', 'observada'], true)) {
            $a[] = 'editar';
        }
        if ($user->can('bajas_cambios.revisar') && $s->estatus === 'solicitada') {
            $a[] = 'revisar';
        }
        if ($user->can('bajas_cambios.aprobar')) {
            $a[] = 'aprobar';
        }
        if ($user->can('bajas_cambios.rechazar')) {
            $a[] = 'rechazar';
        }
        if ($user->can('bajas_cambios.observar')) {
            $a[] = 'observar';
        }
        if ($user->can('bajas_cambios.aplicar') && in_array($s->estatus, ['aprobada', 'por_aplicar'], true)) {
            $a[] = 'aplicar';
        }
        if ($user->can('bajas_cambios.dictamen.generar') || $user->can('bajas_cambios.dictamen.descargar')) {
            $a[] = 'dictamen';
        }

        return array_values(array_unique($a));
    }

    protected function calcularPrioridad(BajaCambioSolicitud $s): string
    {
        if ($s->fecha_vencimiento !== null && $s->fecha_vencimiento->isPast()) {
            return 'critica';
        }
        if ($s->impacto_academico_alto || $s->estatus === 'observada') {
            return 'alta';
        }
        if ($s->created_at !== null && $s->created_at->diffInDays(now()) >= self::DIAS_SLA_REVISION) {
            return 'alta';
        }

        return 'media';
    }

    protected function registrarHistorial(
        BajaCambioSolicitud $s,
        ?string $estadoAnterior,
        string $estadoNuevo,
        ?string $etapaAnterior,
        string $etapaNueva,
        string $comentario,
        ?int $userId,
    ): void {
        BajaCambioHistorial::query()->create([
            'solicitud_id' => $s->id,
            'estado_anterior' => $estadoAnterior,
            'estado_nuevo' => $estadoNuevo,
            'etapa_anterior' => $etapaAnterior,
            'etapa_nueva' => $etapaNueva,
            'comentario' => $comentario,
            'user_id' => $userId,
        ]);
    }

    protected function assertAlcance(User $user, BajaCambioSolicitud $s): void
    {
        $q = BajaCambioSolicitud::query()->whereKey($s->id)
            ->whereIn('alumno_id', $this->dashboard->queryAlumnosEnAlcance($user)->select('id'));
        if (! $q->exists()) {
            throw new AccessDeniedHttpException('Solicitud fuera de su alcance institucional.');
        }
    }

    protected function generarFolio(): string
    {
        $n = (int) BajaCambioSolicitud::query()->whereYear('created_at', now()->year)->count() + 1;

        return 'BC-'.now()->format('Y').'-'.str_pad((string) $n, 5, '0', STR_PAD_LEFT);
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

    protected function sanitizeLabel(?string $value): string
    {
        $v = trim((string) $value);
        if ($v === '') {
            return '—';
        }
        if (stripos($v, 'demosynthetic') !== false || stripos($v, 'demo synthetic') !== false) {
            return 'Alumno en alcance';
        }
        if (stripos($v, 'ciclo demo') !== false) {
            return 'Ciclo escolar activo';
        }

        return $v;
    }

    protected function labelTipo(string $tipo): string
    {
        return match ($tipo) {
            'baja_temporal' => 'Baja temporal',
            'baja_definitiva' => 'Baja definitiva',
            'cambio_grupo' => 'Cambio de grupo',
            'cambio_turno' => 'Cambio de turno',
            'cambio_programa' => 'Cambio de programa',
            default => ucfirst(str_replace('_', ' ', $tipo)),
        };
    }

    protected function labelEstatus(string $estatus): string
    {
        return match ($estatus) {
            'solicitada' => 'Solicitada',
            'en_revision' => 'En revisión',
            'observada' => 'Observada',
            'en_dictamen' => 'En dictamen',
            'aprobada' => 'Aprobada',
            'rechazada' => 'Rechazada',
            'por_aplicar' => 'Por aplicar',
            'aplicada' => 'Aplicada',
            'cancelada' => 'Cancelada',
            default => ucfirst(str_replace('_', ' ', $estatus)),
        };
    }

    protected function severidadEstatus(string $estatus): string
    {
        return match ($estatus) {
            'aprobada', 'aplicada', 'por_aplicar' => 'success',
            'rechazada', 'cancelada' => 'danger',
            'observada' => 'warning',
            default => 'info',
        };
    }
}
