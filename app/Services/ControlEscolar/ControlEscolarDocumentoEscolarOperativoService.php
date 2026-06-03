<?php

declare(strict_types=1);

namespace App\Services\ControlEscolar;

use App\Enums\Certificacion\EstadoWorkflow;
use App\Enums\Certificacion\TipoDocumentoAcademico;
use App\Enums\DocumentosAcademicos\AccionWorkflowDocumento;
use App\Enums\DocumentosAcademicos\EtapaInstitucionalDocumento;
use App\Enums\Certificacion\DocumentoVersionTipo;
use App\Models\Alumno;
use App\Models\CicloEscolar;
use App\Models\DocumentoAcademico;
use App\Models\DocumentoObservacion;
use App\Models\DocumentoVersion;
use App\Models\InscripcionPeriodo;
use App\Models\Matricula;
use App\Models\User;
use App\Models\VentanaOperacion;
use App\Services\Certificacion\AuditoriaService;
use App\Services\Certificacion\CertificacionAlcanceService;
use App\Services\Certificacion\DocumentoAcademicoWorkflowService as WorkflowEstadosService;
use App\Services\Certificacion\DocumentoObservacionService;
use App\Services\Certificacion\ValidacionAcademicaDocumentoService;
use App\Services\DocumentosAcademicos\BandejaEtapaInstitucionalService;
use App\Services\DocumentosAcademicos\DocumentoAcademicoSolicitudActivaService;
use App\Services\DocumentosAcademicos\DocumentoAcademicoTipoService;
use App\Services\DocumentosAcademicos\DocumentoAcademicoWorkflowService;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

class ControlEscolarDocumentoEscolarOperativoService extends ControlEscolarDocumentosService
{
    private const PROCESO_VENTANA = 'solicitudes_documentales';

    /** @var list<string> */
    private const TIPOS_CONTROL_ESCOLAR = [
        'constancia',
        'certificacion_parcial',
        'certificado',
        'otro',
    ];

    /** @var list<string> */
    private const ETAPAS_AUTORIZADAS = [
        'validado_por_certificador',
        'aprobado_educacion_superior',
        'folio_asignado',
        'en_procesamiento',
        'pendiente_firma',
        'firmado_timbrado',
        'finalizado',
    ];

    public function __construct(
        ControlEscolarDashboardService $dashboard,
        CertificacionAlcanceService $alcance,
        DocumentoAcademicoWorkflowService $workflow,
        BandejaEtapaInstitucionalService $etapasInstitucionales,
        protected AuditoriaService $auditoria,
        protected DocumentoAcademicoTipoService $tiposDocumento,
        protected DocumentoAcademicoSolicitudActivaService $solicitudActiva,
        protected WorkflowEstadosService $workflowEstados,
        protected DocumentoObservacionService $observaciones,
        protected ValidacionAcademicaDocumentoService $validacionAcademica,
    ) {
        parent::__construct($dashboard, $alcance, $workflow, $etapasInstitucionales);
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
            $query = $this->queryListadoOperativo($user, $filtros);
            $this->aplicarOrden($query, (string) ($filtros['sort'] ?? 'updated_at'), (string) ($filtros['direction'] ?? 'desc'));
            $paginator = $query->paginate($perPage, ['*'], 'page', $page);

            $this->auditoria->registrar(
                'control_escolar.documentos.consulta',
                DocumentoAcademico::class,
                null,
                ['filtros' => array_filter($filtros)],
                $user->id,
                request()?->ip(),
                request()?->userAgent(),
            );

            return [
                'actualizado_en' => now()->toIso8601String(),
                'aviso_institucional' => 'Control Escolar solo inicia solicitudes documentales con tipos autorizados. El ciclo, procesamiento, firma y resultado final corresponden a etapas posteriores.',
                'data' => collect($paginator->items())
                    ->map(fn (DocumentoAcademico $doc) => $this->filaOperativa($doc, $user))
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
    public function gestionLegacy(User $user, ?string $search, int $page, int $perPage): array
    {
        $filtros = ['search' => $search, 'page' => $page, 'per_page' => $perPage];
        $index = $this->index($user, $filtros);
        $resumen = $this->resumen($user, $filtros);

        return [
            'actualizado_en' => $index['actualizado_en'],
            'metricas' => [
                'solicitudes_en_captura' => $resumen['solicitudes_en_captura'],
                'enviadas_validacion' => $resumen['enviadas_validacion'],
                'observadas' => $resumen['observadas'],
                'autorizadas_generadas' => $resumen['autorizadas_generadas'],
                'rechazadas_canceladas' => $resumen['rechazadas_canceladas'],
            ],
            'listado' => [
                'data' => $index['data'],
                'meta' => $index['meta'],
            ],
            'plantillas_frecuentes' => [],
            'accesos_rapidos' => [],
        ];
    }

    /**
     * @param  array<string, mixed>  $filtros
     * @return array<string, mixed>
     */
    public function resumen(User $user, array $filtros = []): array
    {
        return $this->dashboard->conAlcanceUsuario($user, function () use ($user, $filtros): array {
            $base = $this->queryDocumentos($user);
            $this->aplicarFiltrosListado($base, $user, array_diff_key($filtros, ['estatus' => null, 'page' => null, 'per_page' => null]));

            return [
                'solicitudes_en_captura' => $this->contarPorEstatusUi($user, 'en_captura', $filtros),
                'enviadas_validacion' => $this->contarPorEstatusUi($user, 'enviada_validacion', $filtros),
                'observadas' => $this->contarPorEstatusUi($user, 'observada', $filtros),
                'autorizadas_generadas' => $this->contarPorEstatusUi($user, 'autorizada_generada', $filtros),
                'rechazadas_canceladas' => $this->contarPorEstatusUi($user, 'rechazada_cancelada', $filtros),
                'total_en_alcance' => (int) (clone $base)->count(),
                'ultima_actualizacion' => now()->toIso8601String(),
            ];
        });
    }

    /**
     * @return list<array<string, mixed>>
     */
    public function tiposAutorizados(User $user): array
    {
        $subsistema = $this->resolverSubsistemaUsuario($user);
        $items = [];
        foreach (self::TIPOS_CONTROL_ESCOLAR as $codigo) {
            $def = $this->tiposDocumento->obtener($codigo, $subsistema);
            if ($def === null) {
                continue;
            }
            $items[] = [
                'id' => $codigo,
                'codigo' => $codigo,
                'nombre' => $def['label'] ?? ucfirst($codigo),
                'descripcion' => $def['descripcion'] ?? '',
                'requiere_periodo' => true,
                'requiere_motivo' => in_array($codigo, ['constancia', 'otro'], true),
                'requiere_soporte' => false,
                'puede_generar_control_escolar' => true,
                'flujo' => 'institucional',
            ];
        }

        return $items;
    }

    /**
     * @return array<string, int>
     */
    public function pendientesAtencion(User $user): array
    {
        return $this->dashboard->conAlcanceUsuario($user, function () use ($user): array {
            return [
                'enviadas_validacion' => $this->contarPorEstatusUi($user, 'enviada_validacion', []),
                'observadas' => $this->contarPorEstatusUi($user, 'observada', []),
                'a_punto_de_vencer' => $this->contarAPuntoDeVencer($user),
                'requieren_correccion' => $this->contarPorEstatusUi($user, 'observada', []),
                'en_captura_sin_movimiento' => $this->contarCapturaSinMovimiento($user),
                'rechazadas_recientes' => $this->contarRechazadasRecientes($user),
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
            $tipo = (string) data_get($v->metadata, 'tipo', 'ordinaria');
            $items[] = [
                'id' => $v->id,
                'titulo' => $this->tituloVentanaDocumentos($tipo, $v->fecha_cierre !== null),
                'descripcion' => (string) data_get($v->metadata, 'descripcion', 'Ventana operativa de solicitudes documentales.'),
                'fecha' => $c->toIso8601String(),
                'dia' => $c->format('d'),
                'mes' => $c->locale('es')->translatedFormat('M'),
                'tipo' => $tipo,
                'estado' => $estado,
                'severidad' => $estado === 'vencido' ? 'danger' : ($estado === 'proximo' ? 'warning' : 'info'),
            ];
        }

        return $items;
    }

    /**
     * @return array<string, mixed>
     */
    public function detalle(User $user, DocumentoAcademico $documento): array
    {
        $this->assertAlcanceDocumento($user, $documento);
        $documento->load([
            'alumno', 'matricula', 'cicloEscolar', 'institucion', 'sede',
            'ofertaAcademica.programaEstudio', 'observaciones',
        ]);

        $this->auditoria->registrar(
            'control_escolar.documentos.detalle',
            DocumentoAcademico::class,
            $documento->id,
            ['alumno_id' => $documento->alumno_id],
            $user->id,
            request()?->ip(),
            request()?->userAgent(),
        );

        $workflow = $this->workflow->armarWorkflowResumen($documento, $user);
        $fila = $this->filaOperativa($documento, $user);

        return array_merge($fila, [
            'observaciones' => $documento->observaciones->map(fn (DocumentoObservacion $o) => [
                'id' => $o->id,
                'estado' => $o->estado,
                'observacion' => $o->observacion,
                'respuesta' => $o->respuesta,
                'created_at' => $o->created_at?->toIso8601String(),
            ])->values()->all(),
            'historial' => [],
            'archivos' => $this->archivosDisponibles($documento),
            'workflow' => $workflow,
            'acciones_permitidas' => $this->resolverAccionesPermitidas($documento, $user, $workflow),
        ]);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function crear(User $user, array $data, ?string $ip = null, ?string $userAgent = null): DocumentoAcademico
    {
        $tipo = (string) ($data['tipo_documento_id'] ?? $data['tipo_documento'] ?? '');
        if (! in_array($tipo, self::TIPOS_CONTROL_ESCOLAR, true)) {
            throw ValidationException::withMessages([
                'tipo_documento' => ['El tipo documental seleccionado no está autorizado para tu rol.'],
            ]);
        }

        $matricula = Matricula::query()->with('subsistema')->findOrFail((int) $data['matricula_id']);
        if ((int) $matricula->alumno_id !== (int) $data['alumno_id']) {
            throw ValidationException::withMessages(['matricula_id' => ['La matrícula no corresponde al alumno.']]);
        }

        $ofertaId = (int) ($data['oferta_academica_id'] ?? $matricula->oferta_academica_id);
        if (! $this->alcance->ofertaEnAlcance($user, $ofertaId)) {
            throw new AccessDeniedHttpException('El alumno está fuera de su alcance territorial.');
        }

        $subsistemaClave = $this->tiposDocumento->resolveSubsistemaClaveFromMatricula($matricula);
        if ($subsistemaClave === null) {
            throw ValidationException::withMessages(['matricula_id' => ['No fue posible determinar el subsistema académico.']]);
        }
        $this->tiposDocumento->validarTipoParaSubsistema($tipo, $subsistemaClave);

        $cicloId = (int) ($data['periodo_id'] ?? $data['ciclo_escolar_id'] ?? $matricula->ciclo_escolar_id);
        $metadata = $this->tiposDocumento->fusionarMetadataConCapacidades(
            is_array($data['metadata'] ?? null) ? $data['metadata'] : [],
            $tipo,
            $subsistemaClave,
        );
        $metadata = $this->solicitudActiva->marcarSolicitudControlEscolar($metadata);
        if (! empty($data['motivo'])) {
            $metadata['motivo_solicitud'] = $data['motivo'];
        }
        if (! empty($data['observaciones'])) {
            $metadata['observaciones_solicitud'] = $data['observaciones'];
        }

        $atributos = [
            'alumno_id' => (int) $data['alumno_id'],
            'matricula_id' => $matricula->id,
            'ciclo_escolar_id' => $cicloId,
            'region_id' => $matricula->region_id,
            'institucion_id' => $matricula->institucion_id,
            'sede_id' => $matricula->sede_id,
            'subsistema_id' => $matricula->subsistema_id,
            'oferta_academica_id' => $ofertaId,
            'tipo_documento' => $tipo,
            'tipo_certificacion' => $data['tipo_certificacion'] ?? null,
            'fecha_solicitud' => now(),
            'metadata' => $metadata,
        ];

        $preview = new DocumentoAcademico(array_merge($atributos, [
            'estado_workflow' => EstadoWorkflow::BORRADOR->value,
        ]));
        try {
            $this->solicitudActiva->validarNoDuplicadoActivo($preview);
        } catch (ValidationException $e) {
            throw ValidationException::withMessages([
                'documento' => [DocumentoAcademicoSolicitudActivaService::MENSAJE_DUPLICADO_ACTIVO],
            ]);
        }

        $validacion = $this->validacionAcademica->validarParaCrearBorrador($preview, $user->id);
        if ($validacion['ok'] !== true) {
            throw ValidationException::withMessages(['documento' => $validacion['errores'] ?? []]);
        }

        $documento = $this->workflowEstados->crearBorrador($atributos, $user->id);

        if (! empty($data['enviar_validacion'])) {
            $documento = $this->enviarValidacion($user, $documento, null, $ip, $userAgent);
        }

        $this->auditoria->registrar(
            'control_escolar.documentos.crear',
            DocumentoAcademico::class,
            $documento->id,
            [
                'alumno_id' => $documento->alumno_id,
                'tipo_documento' => $documento->tipo_documento,
            ],
            $user->id,
            $ip,
            $userAgent,
        );

        return $documento->fresh();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function actualizar(User $user, DocumentoAcademico $documento, array $data, ?string $ip = null, ?string $userAgent = null): DocumentoAcademico
    {
        $this->assertAlcanceDocumento($user, $documento);
        $estatus = $this->resolverEstatusUi($documento);
        if (! in_array($estatus, ['en_captura', 'observada'], true)) {
            throw ValidationException::withMessages([
                'estatus' => ['La solicitud no puede editarse en su estado actual.'],
            ]);
        }

        $meta = $documento->metadata ?? [];
        if (isset($data['motivo'])) {
            $meta['motivo_solicitud'] = $data['motivo'];
        }
        if (isset($data['observaciones'])) {
            $meta['observaciones_solicitud'] = $data['observaciones'];
        }
        $documento->metadata = $meta;
        $documento->save();

        $this->auditoria->registrar(
            'control_escolar.documentos.editar',
            DocumentoAcademico::class,
            $documento->id,
            [],
            $user->id,
            $ip,
            $userAgent,
        );

        return $documento->fresh();
    }

    public function enviarValidacion(
        User $user,
        DocumentoAcademico $documento,
        ?string $motivo = null,
        ?string $ip = null,
        ?string $userAgent = null,
    ): DocumentoAcademico {
        $this->assertAlcanceDocumento($user, $documento);
        $pendientes = DocumentoObservacion::query()
            ->where('documento_academico_id', $documento->id)
            ->where('estado', 'pendiente')
            ->count();
        if ($pendientes > 0) {
            throw ValidationException::withMessages([
                'observaciones' => ['Existen observaciones pendientes sin atender.'],
            ]);
        }

        $doc = $this->workflow->aplicarPorAccion(
            $documento,
            AccionWorkflowDocumento::ENVIAR_VALIDACION->value,
            $user,
            $motivo,
            $ip,
            $userAgent,
        );

        $meta = $doc->metadata ?? [];
        $meta['fecha_envio_validacion'] = now()->toIso8601String();
        $meta['usuario_envia_id'] = $user->id;
        $doc->metadata = $meta;
        $doc->save();

        $this->auditoria->registrar(
            'control_escolar.documentos.enviar_validacion',
            DocumentoAcademico::class,
            $doc->id,
            [],
            $user->id,
            $ip,
            $userAgent,
        );

        return $doc->fresh();
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function atenderObservacion(
        User $user,
        DocumentoAcademico $documento,
        array $data,
        ?string $ip = null,
        ?string $userAgent = null,
    ): DocumentoAcademico {
        $this->assertAlcanceDocumento($user, $documento);
        $observacion = DocumentoObservacion::query()
            ->where('documento_academico_id', $documento->id)
            ->where('estado', 'pendiente')
            ->when(isset($data['observacion_id']), fn (Builder $q) => $q->whereKey($data['observacion_id']))
            ->first();

        if ($observacion === null) {
            throw ValidationException::withMessages([
                'observacion' => ['No hay observaciones pendientes por atender.'],
            ]);
        }

        $this->observaciones->atender($observacion, [
            'estado' => 'atendida',
            'respuesta' => (string) ($data['respuesta'] ?? ''),
            'metadata' => $data['metadata'] ?? [],
        ], $user->id, $ip, $userAgent);

        $doc = $this->workflow->aplicarPorAccion(
            $documento->fresh(),
            AccionWorkflowDocumento::ENVIAR_VALIDACION->value,
            $user,
            $data['respuesta'] ?? null,
            $ip,
            $userAgent,
        );

        $this->auditoria->registrar(
            'control_escolar.documentos.atender_observacion',
            DocumentoAcademico::class,
            $doc->id,
            ['observacion_id' => $observacion->id],
            $user->id,
            $ip,
            $userAgent,
        );

        return $doc->fresh();
    }

    public function cancelar(
        User $user,
        DocumentoAcademico $documento,
        string $motivo,
        ?string $ip = null,
        ?string $userAgent = null,
    ): DocumentoAcademico {
        $this->assertAlcanceDocumento($user, $documento);
        $estatus = $this->resolverEstatusUi($documento);
        if (in_array($estatus, ['autorizada', 'generada'], true) && ! $user->can('documentos.cancelar')) {
            throw ValidationException::withMessages([
                'estatus' => ['No es posible cancelar un documento ya autorizado o generado.'],
            ]);
        }

        $doc = $this->workflow->aplicarPorAccion(
            $documento,
            AccionWorkflowDocumento::CANCELAR->value,
            $user,
            $motivo,
            $ip,
            $userAgent,
        );

        $this->auditoria->registrar(
            'control_escolar.documentos.cancelar',
            DocumentoAcademico::class,
            $doc->id,
            ['motivo' => $motivo],
            $user->id,
            $ip,
            $userAgent,
        );

        return $doc->fresh();
    }

    public function descargar(User $user, DocumentoAcademico $documento): StreamedResponse
    {
        $this->assertAlcanceDocumento($user, $documento);
        $estatus = $this->resolverEstatusUi($documento);
        if (! in_array($estatus, ['autorizada', 'generada'], true)) {
            throw ValidationException::withMessages([
                'documento' => ['El documento aún no está disponible para descarga.'],
            ]);
        }

        $version = DocumentoVersion::query()
            ->where('documento_academico_id', $documento->id)
            ->where('activo', true)
            ->whereIn('tipo', [
                DocumentoVersionTipo::PDF_OFICIAL->value,
                DocumentoVersionTipo::PDF_REGENERADO->value,
            ])
            ->orderByDesc('id')
            ->first();

        if ($version === null || empty($version->storage_path)) {
            throw ValidationException::withMessages([
                'documento' => ['El documento aún no está disponible para descarga.'],
            ]);
        }

        $this->auditoria->registrar(
            'control_escolar.documentos.descargar',
            DocumentoAcademico::class,
            $documento->id,
            ['version_id' => $version->id],
            $user->id,
            request()?->ip(),
            request()?->userAgent(),
        );

        $disk = $version->storage_disk ?: config('filesystems.default');
        $nombre = 'documento_'.$documento->id.'.pdf';

        return Storage::disk($disk)->download($version->storage_path, $nombre);
    }

    public function descargarAcuse(User $user, DocumentoAcademico $documento): StreamedResponse
    {
        $this->assertAlcanceDocumento($user, $documento);
        $path = data_get($documento->metadata, 'acuse_storage_path');
        $disk = data_get($documento->metadata, 'acuse_storage_disk', config('filesystems.default'));
        if (! is_string($path) || $path === '') {
            throw ValidationException::withMessages([
                'documento' => ['No hay acuse disponible para esta solicitud.'],
            ]);
        }

        $this->auditoria->registrar(
            'control_escolar.documentos.acuse_descargar',
            DocumentoAcademico::class,
            $documento->id,
            [],
            $user->id,
            request()?->ip(),
            request()?->userAgent(),
        );

        return Storage::disk((string) $disk)->download($path, 'acuse_'.$documento->id.'.pdf');
    }

    /**
     * @param  array<string, mixed>  $filtros
     */
    public function exportar(User $user, array $filtros): StreamedResponse
    {
        $query = $this->queryListadoOperativo($user, $filtros);
        $this->aplicarOrden($query, 'updated_at', 'desc');
        $rows = $query->limit(5000)->get();

        $this->auditoria->registrar(
            'control_escolar.documentos.exportar',
            DocumentoAcademico::class,
            null,
            ['total' => $rows->count(), 'filtros' => array_filter($filtros)],
            $user->id,
            request()?->ip(),
            request()?->userAgent(),
        );

        $filename = 'documentos_escolares_'.now()->format('Y-m-d').'.csv';

        return response()->streamDownload(function () use ($rows, $user): void {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['ID', 'Tipo', 'Alumno', 'Matrícula', 'Periodo', 'Estatus', 'Fecha solicitud', 'Último movimiento']);
            foreach ($rows as $doc) {
                $fila = $this->filaOperativa($doc, $user);
                fputcsv($out, [
                    $fila['id'],
                    $fila['tipo_documento'],
                    $fila['alumno'],
                    $fila['matricula'],
                    $fila['periodo'],
                    $fila['estatus_label'],
                    $fila['fecha_solicitud'],
                    $fila['ultimo_movimiento']['descripcion'] ?? '',
                ]);
            }
            fclose($out);
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    /**
     * @param  array<string, mixed>  $filtros
     * @return Builder<DocumentoAcademico>
     */
    protected function queryListadoOperativo(User $user, array $filtros): Builder
    {
        $search = trim((string) ($filtros['search'] ?? ''));
        $query = $this->queryDocumentos($user)
            ->with(['alumno', 'matricula', 'cicloEscolar', 'institucion', 'ofertaAcademica.programaEstudio'])
            ->withCount([
                'observaciones as observaciones_pendientes_count' => fn (Builder $sub) => $sub->where('estado', 'pendiente'),
            ]);

        $query->where(function (Builder $outer) use ($user): void {
            $outer->where(function (Builder $ce) use ($user): void {
                $this->etapasInstitucionales->aplicarAlcanceEtapasPorRol($ce, $user);
            })->orWhere(function (Builder $own): void {
                $own->where('metadata->origen_solicitud', 'control_escolar');
            });
        });

        $this->aplicarFiltrosListado($query, $user, $filtros);

        if ($search !== '') {
            $like = '%'.$search.'%';
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
     * @param  array<string, mixed>  $filtros
     */
    protected function aplicarFiltrosListado(Builder $query, User $user, array $filtros): void
    {
        if (! empty($filtros['estatus'])) {
            $this->aplicarFiltroEstatusUi($query, (string) $filtros['estatus']);
        }

        if (! empty($filtros['tipo_documento_id'])) {
            $query->where('tipo_documento', (string) $filtros['tipo_documento_id']);
        }

        if (! empty($filtros['programa_id'])) {
            $query->whereHas('ofertaAcademica', fn (Builder $q) => $q->where('programa_estudio_id', (int) $filtros['programa_id']));
        }

        if (! empty($filtros['sede_id'])) {
            $query->where('sede_id', (int) $filtros['sede_id']);
        }

        if (! empty($filtros['periodo_id'])) {
            $periodoId = (int) $filtros['periodo_id'];
            $query->where(function (Builder $q) use ($periodoId): void {
                $q->where('ciclo_escolar_id', $periodoId)
                    ->orWhereHas('matricula.inscripcionesPeriodo', fn (Builder $ins) => $ins->where('periodo_escolar_id', $periodoId));
            });
        }

        if (! empty($filtros['fecha_desde'])) {
            $query->whereDate('created_at', '>=', $filtros['fecha_desde']);
        }
        if (! empty($filtros['fecha_hasta'])) {
            $query->whereDate('created_at', '<=', $filtros['fecha_hasta']);
        }

        if (! empty($filtros['solo_mis_solicitudes'])) {
            $query->where('created_by', $user->id);
        }

        if (! empty($filtros['con_observaciones'])) {
            $query->whereHas('observaciones', fn (Builder $o) => $o->where('estado', 'pendiente'));
        }

        if (! empty($filtros['requiere_correccion'])) {
            $this->aplicarFiltroEstatusUi($query, 'observada');
        }

        if (! empty($filtros['a_punto_de_vencer'])) {
            $limite = now()->addDays(7);
            $query->where('updated_at', '<=', $limite)
                ->whereNotIn('estado_workflow', [
                    EstadoWorkflow::RECHAZADO->value,
                    EstadoWorkflow::CANCELADO->value,
                ]);
        }
    }

    protected function aplicarFiltroEstatusUi(Builder $query, string $estatus): void
    {
        match ($estatus) {
            'en_captura' => $this->etapasInstitucionales->aplicarFiltroEtapaInstitucional(
                $query,
                EtapaInstitucionalDocumento::SOLICITADO_CONTROL_ESCOLAR->value,
            ),
            'enviada_validacion' => $this->etapasInstitucionales->aplicarFiltroEtapaInstitucional(
                $query,
                EtapaInstitucionalDocumento::EN_VALIDACION_CERTIFICADOR->value,
            ),
            'en_revision' => $query->where('estado_workflow', EstadoWorkflow::EN_REVISION->value),
            'observada' => $this->etapasInstitucionales->aplicarFiltroEtapaInstitucional(
                $query,
                EtapaInstitucionalDocumento::OBSERVADO_POR_CERTIFICADOR->value,
            ),
            'autorizada', 'generada', 'autorizada_generada' => $query->where(function (Builder $outer): void {
                foreach (self::ETAPAS_AUTORIZADAS as $etapa) {
                    $outer->orWhere(function (Builder $sub) use ($etapa): void {
                        $this->etapasInstitucionales->aplicarFiltroEtapaInstitucional($sub, $etapa);
                    });
                }
            }),
            'rechazada', 'cancelada', 'rechazada_cancelada' => $query->whereIn('estado_workflow', [
                EstadoWorkflow::RECHAZADO->value,
                EstadoWorkflow::CANCELADO->value,
            ]),
            default => null,
        };
    }

    protected function aplicarOrden(Builder $query, string $sort, string $direction): void
    {
        $dir = strtolower($direction) === 'asc' ? 'asc' : 'desc';
        $col = match ($sort) {
            'tipo', 'tipo_documento' => 'tipo_documento',
            'fecha', 'fecha_solicitud', 'created_at' => 'created_at',
            default => 'updated_at',
        };
        $query->orderBy($col, $dir)->orderByDesc('id');
    }

    /**
     * @param  array<string, mixed>  $filtros
     */
    protected function contarPorEstatusUi(User $user, string $estatus, array $filtros): int
    {
        $q = $this->queryDocumentos($user);
        $q->where(function (Builder $outer) use ($user): void {
            $outer->where(function (Builder $ce) use ($user): void {
                $this->etapasInstitucionales->aplicarAlcanceEtapasPorRol($ce, $user);
            })->orWhere('metadata->origen_solicitud', 'control_escolar');
        });
        $this->aplicarFiltrosListado($q, $user, array_diff_key($filtros, ['estatus' => null]));
        $this->aplicarFiltroEstatusUi($q, $estatus);

        return (int) $q->count();
    }

    protected function contarAPuntoDeVencer(User $user): int
    {
        $q = $this->queryDocumentos($user);
        $this->aplicarFiltrosListado($q, $user, ['a_punto_de_vencer' => true]);

        return (int) $q->count();
    }

    protected function contarCapturaSinMovimiento(User $user): int
    {
        $q = $this->queryDocumentos($user);
        $this->aplicarFiltroEstatusUi($q, 'en_captura');
        $q->where('updated_at', '<=', now()->subDays(5));

        return (int) $q->count();
    }

    protected function contarRechazadasRecientes(User $user): int
    {
        $q = $this->queryDocumentos($user);
        $this->aplicarFiltroEstatusUi($q, 'rechazada_cancelada');
        $q->where('updated_at', '>=', now()->subDays(30));

        return (int) $q->count();
    }

    /**
     * @return array<string, mixed>
     */
    protected function filaOperativa(DocumentoAcademico $doc, User $user): array
    {
        $base = parent::filaListado($doc, $user);
        $estatus = $this->resolverEstatusUi($doc);
        $meta = $this->metaEstatusUi($estatus);
        $dtSol = $doc->fecha_solicitud ?? $doc->created_at;
        $carbonSol = $dtSol instanceof Carbon ? $dtSol : Carbon::parse($dtSol ?? now());
        $dtMov = $doc->updated_at ?? $doc->created_at;
        $carbonMov = $dtMov instanceof Carbon ? $dtMov : Carbon::parse($dtMov ?? now());

        return array_merge($base, [
            'tipo_documento' => $base['tipo'],
            'periodo' => $this->etiquetaPeriodo($doc),
            'estatus' => $estatus,
            'estatus_label' => $meta['label'],
            'estatus_color' => $meta['color'],
            'fecha_solicitud' => $carbonSol->timezone(config('app.timezone'))->format('d/m/Y h:i a'),
            'ultimo_movimiento' => [
                'descripcion' => $base['siguiente_accion'] ?? $meta['label'],
                'fecha' => $carbonMov->timezone(config('app.timezone'))->format('d/m/Y h:i a'),
            ],
            'siguiente_accion' => $base['siguiente_accion'],
            'descargable' => in_array($estatus, ['autorizada', 'generada'], true),
            'detalle_url' => '/app/control-escolar/documentos/'.$doc->id,
            'acciones_permitidas' => $this->resolverAccionesPermitidas($doc, $user),
        ]);
    }

    public function resolverEstatusUi(DocumentoAcademico $doc): string
    {
        if (in_array($doc->estado_workflow, [EstadoWorkflow::RECHAZADO->value, EstadoWorkflow::CANCELADO->value], true)) {
            return $doc->estado_workflow === EstadoWorkflow::CANCELADO->value ? 'cancelada' : 'rechazada';
        }

        $etapa = $this->workflow->resolverEtapaInstitucional($doc);

        return match ($etapa) {
            EtapaInstitucionalDocumento::SOLICITADO_CONTROL_ESCOLAR => 'en_captura',
            EtapaInstitucionalDocumento::EN_VALIDACION_CERTIFICADOR => 'enviada_validacion',
            EtapaInstitucionalDocumento::OBSERVADO_POR_CERTIFICADOR => 'observada',
            EtapaInstitucionalDocumento::VALIDADO_POR_CERTIFICADOR,
            EtapaInstitucionalDocumento::APROBADO_EDUCACION_SUPERIOR => 'autorizada',
            EtapaInstitucionalDocumento::FIRMADO_TIMBRADO,
            EtapaInstitucionalDocumento::FINALIZADO => 'generada',
            default => $doc->estado_workflow === EstadoWorkflow::EN_REVISION->value ? 'en_revision' : 'en_captura',
        };
    }

    /**
     * @return array{label: string, color: string}
     */
    protected function metaEstatusUi(string $estatus): array
    {
        return match ($estatus) {
            'en_captura' => ['label' => 'En captura', 'color' => '#534AB7'],
            'enviada_validacion' => ['label' => 'Enviada a validación', 'color' => '#BA7517'],
            'en_revision' => ['label' => 'En revisión', 'color' => '#185FA5'],
            'observada' => ['label' => 'Observada', 'color' => '#EA580C'],
            'autorizada' => ['label' => 'Autorizada', 'color' => '#0F6E56'],
            'generada' => ['label' => 'Autorizada / Generada', 'color' => '#15803D'],
            'rechazada' => ['label' => 'Rechazada', 'color' => '#991B1B'],
            'cancelada' => ['label' => 'Cancelada', 'color' => '#64748b'],
            default => ['label' => ucfirst(str_replace('_', ' ', $estatus)), 'color' => '#64748b'],
        };
    }

    /**
     * @param  array<string, mixed>|null  $workflow
     * @return list<string>
     */
    protected function resolverAccionesPermitidas(DocumentoAcademico $doc, User $user, ?array $workflow = null): array
    {
        $estatus = $this->resolverEstatusUi($doc);
        $acciones = ['ver'];
        if ($user->can('documentos.editar') || $user->can('editar_documentos')) {
            if (in_array($estatus, ['en_captura', 'observada'], true)) {
                $acciones[] = 'editar';
                $acciones[] = 'continuar_captura';
            }
        }
        if ($user->can('documentos.enviar_validacion') || $user->can('documentos.enviar_revision') || $user->can('enviar_revision')) {
            if (in_array($estatus, ['en_captura', 'observada'], true)) {
                $acciones[] = 'enviar_validacion';
            }
        }
        if ($user->can('documentos.observaciones.atender') || $user->can('observaciones.atender')) {
            if ($estatus === 'observada') {
                $acciones[] = 'atender_observacion';
                $acciones[] = 'ver_observaciones';
            }
        }
        if (($user->can('documentos.descargar') || $user->can('expedientes.documentos.descargar'))
            && in_array($estatus, ['autorizada', 'generada'], true)) {
            $acciones[] = 'descargar';
        }
        if ($user->can('documentos.acuse.descargar') && data_get($doc->metadata, 'acuse_storage_path')) {
            $acciones[] = 'descargar_acuse';
        }
        if ($user->can('documentos.cancelar') || $user->can('rechazar_documentos')) {
            if (! in_array($estatus, ['generada', 'cancelada', 'rechazada'], true)) {
                $acciones[] = 'cancelar';
            }
        }
        if ($user->can('expedientes.ver') && $doc->alumno_id) {
            $acciones[] = 'ver_expediente';
        }

        return array_values(array_unique($acciones));
    }

    protected function etiquetaPeriodo(DocumentoAcademico $doc): string
    {
        $ciclo = $doc->cicloEscolar;
        if ($ciclo !== null) {
            $nombre = trim((string) ($ciclo->nombre ?? ''));
            if ($nombre !== '' && ! str_contains(strtolower($nombre), 'demo')) {
                return $nombre;
            }
            $clave = trim((string) ($ciclo->clave ?? ''));
            if ($clave !== '') {
                return $clave;
            }
        }

        $ins = InscripcionPeriodo::query()
            ->where('matricula_id', $doc->matricula_id)
            ->where('ciclo_escolar_id', $doc->ciclo_escolar_id)
            ->orderByDesc('id')
            ->first();

        return $ins?->etiqueta_periodo_curricular
            ?? (string) data_get($doc->metadata, 'periodo_label', '—');
    }

    protected function assertAlcanceDocumento(User $user, DocumentoAcademico $documento): void
    {
        $q = DocumentoAcademico::query()->whereKey($documento->id);
        $this->alcance->aplicarAlcanceDocumentosAcademicos($q, $user);
        if (! $q->exists()) {
            throw new AccessDeniedHttpException('Documento fuera de su alcance institucional.');
        }
    }

    /**
     * @return list<array<string, mixed>>
     */
    protected function archivosDisponibles(DocumentoAcademico $documento): array
    {
        return DocumentoVersion::query()
            ->where('documento_academico_id', $documento->id)
            ->where('activo', true)
            ->whereIn('tipo', [
                DocumentoVersionTipo::PDF_OFICIAL->value,
                DocumentoVersionTipo::PDF_REGENERADO->value,
            ])
            ->get()
            ->map(fn (DocumentoVersion $v) => [
                'id' => $v->id,
                'tipo' => $v->tipo,
                'generado_en' => $v->generado_en?->toIso8601String(),
            ])
            ->all();
    }

    protected function resolverSubsistemaUsuario(User $user): ?string
    {
        $inst = $user->institucion_id;
        if ($inst === null) {
            return 'NORMAL';
        }

        return 'NORMAL';
    }

    protected function tituloVentanaDocumentos(string $tipo, bool $esCierre): string
    {
        $prefijo = $esCierre ? 'Cierre' : 'Inicio';

        return match ($tipo) {
            'extraordinaria' => "{$prefijo} de solicitudes extraordinarias",
            'ordinaria' => "{$prefijo} de solicitudes ordinarias",
            default => "{$prefijo} de solicitudes documentales",
        };
    }
}
