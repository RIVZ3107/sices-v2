<?php

declare(strict_types=1);

namespace App\Services\DocumentosAcademicos;

use App\Enums\Certificacion\EstadoFirma;
use App\Enums\Certificacion\EstadoWorkflow;
use App\Enums\DocumentosAcademicos\AccionWorkflowDocumento;
use App\Enums\DocumentosAcademicos\EtapaInstitucionalDocumento;
use App\Models\DocumentoAcademico;
use App\Models\User;
use App\Services\Certificacion\AuditoriaService;
use App\Services\Certificacion\DocumentoAcademicoCapturaService;
use App\Services\Certificacion\DocumentoAcademicoWorkflowService as WorkflowEstadosService;
use App\Services\Certificacion\FolioService;
use App\Support\SicesAuth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Workflow institucional por etapas (metadata + estado_workflow) sin firma/XML/PDF reales.
 */
class DocumentoAcademicoWorkflowService
{
    public const MENSAJE_TRANSICION_INVALIDA =
        'La acción solicitada no corresponde al estado actual del documento ni a su rol institucional.';

    public const MENSAJE_MOTIVO_OBLIGATORIO =
        'Debe indicar un motivo o comentario institucional para continuar.';

    public function __construct(
        protected WorkflowEstadosService $workflowEstados,
        protected DocumentoAcademicoCapturaService $captura,
        protected FolioService $folioService,
        protected AuditoriaService $auditoria,
    ) {}

    public function resolverEtapaInstitucional(DocumentoAcademico $documento): EtapaInstitucionalDocumento
    {
        $documento->refresh();
        $meta = $documento->metadata ?? [];
        $guardada = EtapaInstitucionalDocumento::tryFromLoose($meta['etapa_institucional'] ?? null);

        if ($documento->estado_workflow === EstadoWorkflow::RECHAZADO->value) {
            return EtapaInstitucionalDocumento::RECHAZADO;
        }
        if ($documento->estado_workflow === EstadoWorkflow::CANCELADO->value) {
            return EtapaInstitucionalDocumento::CANCELADO;
        }

        if ($guardada === EtapaInstitucionalDocumento::EN_REVISION_SISTEMAS) {
            return EtapaInstitucionalDocumento::EN_REVISION_SISTEMAS;
        }
        if ($guardada === EtapaInstitucionalDocumento::REINTENTADO) {
            return EtapaInstitucionalDocumento::REINTENTADO;
        }

        if ($guardada === EtapaInstitucionalDocumento::INCIDENCIA_TECNICA
            || $documento->estado_firma === EstadoFirma::ERROR_FIRMA->value) {
            return EtapaInstitucionalDocumento::INCIDENCIA_TECNICA;
        }

        if ($guardada === EtapaInstitucionalDocumento::FINALIZADO
            || ! empty($meta['documento_finalizado'])) {
            return EtapaInstitucionalDocumento::FINALIZADO;
        }

        if ($documento->estado_firma === EstadoFirma::FIRMADO->value
            || $guardada === EtapaInstitucionalDocumento::FIRMADO_TIMBRADO) {
            return EtapaInstitucionalDocumento::FIRMADO_TIMBRADO;
        }

        if ($guardada === EtapaInstitucionalDocumento::PENDIENTE_FIRMA
            || (! empty($meta['listo_para_firma']) && $documento->estado_workflow === EstadoWorkflow::APROBADO->value)) {
            return EtapaInstitucionalDocumento::PENDIENTE_FIRMA;
        }

        if ($guardada === EtapaInstitucionalDocumento::EN_PROCESAMIENTO) {
            return EtapaInstitucionalDocumento::EN_PROCESAMIENTO;
        }

        if ($documento->folio_interno !== null && $documento->folio_interno !== '') {
            if ($guardada === EtapaInstitucionalDocumento::FOLIO_ASIGNADO) {
                return EtapaInstitucionalDocumento::FOLIO_ASIGNADO;
            }
            if ($documento->estado_workflow === EstadoWorkflow::APROBADO->value) {
                return EtapaInstitucionalDocumento::FOLIO_ASIGNADO;
            }
        }

        if ($documento->estado_workflow === EstadoWorkflow::APROBADO->value) {
            return EtapaInstitucionalDocumento::APROBADO_EDUCACION_SUPERIOR;
        }

        if ($guardada === EtapaInstitucionalDocumento::VALIDADO_POR_CERTIFICADOR) {
            return EtapaInstitucionalDocumento::VALIDADO_POR_CERTIFICADOR;
        }

        if ($guardada === EtapaInstitucionalDocumento::OBSERVADO_POR_CERTIFICADOR
            || ($documento->estado_workflow === EstadoWorkflow::EN_REVISION->value
                && ($documento->observaciones_pendientes_count ?? 0) > 0)) {
            return EtapaInstitucionalDocumento::OBSERVADO_POR_CERTIFICADOR;
        }

        if ($documento->estado_workflow === EstadoWorkflow::EN_REVISION->value) {
            return EtapaInstitucionalDocumento::EN_VALIDACION_CERTIFICADOR;
        }

        return EtapaInstitucionalDocumento::SOLICITADO_CONTROL_ESCOLAR;
    }

    /**
     * @return array{
     *     estado_actual: string,
     *     estado_actual_label: string,
     *     transiciones_disponibles: list<string>,
     *     acciones_permitidas: list<array{accion: string, label: string, etapa_destino: string, requiere_motivo: bool}>,
     *     requiere_motivo: bool
     * }
     */
    public function armarPayloadWorkflow(DocumentoAcademico $documento, ?User $usuario): array
    {
        $resumen = $this->armarWorkflowResumen($documento, $usuario);
        $acciones = $resumen['acciones_permitidas'];

        return [
            'estado_actual' => $resumen['etapa'],
            'estado_actual_label' => $resumen['etapa_label'],
            'transiciones_disponibles' => array_values(array_unique(array_map(
                static fn (array $a) => $a['etapa_destino'] ?? '',
                $acciones,
            ))),
            'acciones_permitidas' => $acciones,
            'requiere_motivo' => (bool) $resumen['requiere_motivo'],
        ];
    }

    /**
     * Resumen ligero para listados y bandejas (sin payloads técnicos).
     *
     * @return array{
     *     etapa: string,
     *     etapa_label: string,
     *     acciones_permitidas: list<array{accion: string, label: string, etapa_destino?: string, requiere_motivo: bool}>,
     *     siguiente_accion_principal: array{accion: string, label: string}|null,
     *     requiere_motivo: bool
     * }
     */
    public function armarWorkflowResumen(DocumentoAcademico $documento, ?User $usuario): array
    {
        $etapa = $this->resolverEtapaInstitucional($documento);
        $acciones = $usuario ? $this->accionesPermitidas($documento, $usuario) : [];
        $principal = $acciones[0] ?? null;

        return [
            'etapa' => $etapa->value,
            'etapa_label' => $etapa->label(),
            'acciones_permitidas' => $acciones,
            'siguiente_accion_principal' => $principal !== null ? [
                'accion' => $principal['accion'],
                'label' => $principal['label'],
            ] : null,
            'requiere_motivo' => (bool) ($principal['requiere_motivo'] ?? false),
        ];
    }

    /**
     * @return list<array{accion: string, label: string, etapa_destino: string, requiere_motivo: bool}>
     */
    public function accionesPermitidas(DocumentoAcademico $documento, User $usuario): array
    {
        $etapa = $this->resolverEtapaInstitucional($documento);
        $definiciones = $this->definicionesDesdeEtapa($etapa);
        $out = [];

        foreach ($definiciones as $def) {
            $destino = $def['etapa'];
            if (! $this->puedeTransicionar($documento, $destino->value, $usuario)) {
                continue;
            }
            $out[] = [
                'accion' => $def['accion']->value,
                'label' => $def['accion']->label(),
                'etapa_destino' => $destino->value,
                'requiere_motivo' => $this->requiereMotivo($etapa->value, $destino->value),
            ];
        }

        if ($this->puedeVerResultadoFinal($documento, $usuario)) {
            $out[] = [
                'accion' => AccionWorkflowDocumento::VER_RESULTADO_FINAL->value,
                'label' => AccionWorkflowDocumento::VER_RESULTADO_FINAL->label(),
                'etapa_destino' => $etapa->value,
                'requiere_motivo' => false,
            ];
        }

        return $out;
    }

    /**
     * @return list<string>
     */
    public function transicionesDisponibles(DocumentoAcademico $documento, User $usuario): array
    {
        return array_values(array_unique(array_map(
            static fn (array $a) => $a['etapa_destino'],
            $this->accionesPermitidas($documento, $usuario),
        )));
    }

    public function puedeTransicionar(DocumentoAcademico $documento, string $nuevoEstado, User $usuario): bool
    {
        $destino = EtapaInstitucionalDocumento::tryFromLoose($nuevoEstado);
        if ($destino === null) {
            return false;
        }

        $origen = $this->resolverEtapaInstitucional($documento);
        $permitido = $this->grafoPermitido($origen, $destino);
        if (! $permitido) {
            return false;
        }

        return $this->usuarioPuedeEjecutarTransicion($origen, $destino, $usuario, $documento);
    }

    public function requiereMotivo(string $estadoOrigen, string $estadoDestino): bool
    {
        $destino = EtapaInstitucionalDocumento::tryFromLoose($estadoDestino);
        if ($destino === null) {
            return false;
        }

        return in_array($destino, [
            EtapaInstitucionalDocumento::OBSERVADO_POR_CERTIFICADOR,
            EtapaInstitucionalDocumento::RECHAZADO,
            EtapaInstitucionalDocumento::CANCELADO,
            EtapaInstitucionalDocumento::INCIDENCIA_TECNICA,
            EtapaInstitucionalDocumento::EN_REVISION_SISTEMAS,
        ], true);
    }

    /**
     * @throws ValidationException
     */
    public function aplicarTransicion(
        DocumentoAcademico $documento,
        string $nuevoEstado,
        User $usuario,
        ?string $motivo = null,
        ?string $ip = null,
        ?string $userAgent = null,
    ): DocumentoAcademico {
        $destino = EtapaInstitucionalDocumento::tryFromLoose($nuevoEstado);
        if ($destino === null) {
            throw ValidationException::withMessages([
                'etapa_institucional' => ['La etapa institucional indicada no es válida.'],
            ]);
        }

        $origen = $this->resolverEtapaInstitucional($documento);

        if (! $this->puedeTransicionar($documento, $destino->value, $usuario)) {
            throw ValidationException::withMessages([
                'workflow' => [self::MENSAJE_TRANSICION_INVALIDA],
            ]);
        }

        if ($this->requiereMotivo($origen->value, $destino->value) && trim((string) $motivo) === '') {
            throw ValidationException::withMessages([
                'motivo' => [self::MENSAJE_MOTIVO_OBLIGATORIO],
            ]);
        }

        return DB::transaction(function () use ($documento, $origen, $destino, $usuario, $motivo, $ip, $userAgent) {
            $doc = $this->ejecutarTransicionInterna($documento, $origen, $destino, $usuario, $motivo, $ip, $userAgent);

            $this->auditoria->registrar(
                'documento_academico.workflow.institucional',
                DocumentoAcademico::class,
                $doc->id,
                [
                    'etapa_origen' => $origen->value,
                    'etapa_destino' => $destino->value,
                    'motivo' => $motivo,
                ],
                $usuario->id,
                $ip,
                $userAgent,
            );

            return $doc->refresh();
        });
    }

    /**
     * @throws ValidationException
     */
    public function aplicarPorAccion(
        DocumentoAcademico $documento,
        string $accion,
        User $usuario,
        ?string $motivo = null,
        ?string $ip = null,
        ?string $userAgent = null,
    ): DocumentoAcademico {
        $accionEnum = AccionWorkflowDocumento::tryFrom($accion);
        if ($accionEnum === null) {
            throw ValidationException::withMessages([
                'accion' => [self::MENSAJE_TRANSICION_INVALIDA],
            ]);
        }

        $etapa = $this->resolverEtapaDestinoPorAccion($documento, $accionEnum);
        if ($etapa === null) {
            throw ValidationException::withMessages([
                'accion' => [self::MENSAJE_TRANSICION_INVALIDA],
            ]);
        }

        return $this->aplicarTransicion($documento, $etapa->value, $usuario, $motivo, $ip, $userAgent);
    }

    protected function resolverEtapaDestinoPorAccion(
        DocumentoAcademico $documento,
        AccionWorkflowDocumento $accion,
    ): ?EtapaInstitucionalDocumento {
        $origen = $this->resolverEtapaInstitucional($documento);

        return match ($accion) {
            AccionWorkflowDocumento::ENVIAR_VALIDACION => EtapaInstitucionalDocumento::EN_VALIDACION_CERTIFICADOR,
            AccionWorkflowDocumento::CORREGIR_OBSERVACIONES => EtapaInstitucionalDocumento::SOLICITADO_CONTROL_ESCOLAR,
            AccionWorkflowDocumento::VALIDAR_INFORMACION => EtapaInstitucionalDocumento::VALIDADO_POR_CERTIFICADOR,
            AccionWorkflowDocumento::DEVOLVER_OBSERVACIONES => EtapaInstitucionalDocumento::OBSERVADO_POR_CERTIFICADOR,
            AccionWorkflowDocumento::APROBAR_EXPEDIENTE => EtapaInstitucionalDocumento::APROBADO_EDUCACION_SUPERIOR,
            AccionWorkflowDocumento::ASIGNAR_FOLIO => EtapaInstitucionalDocumento::FOLIO_ASIGNADO,
            AccionWorkflowDocumento::PROCESAR_CERTIFICACION => $origen === EtapaInstitucionalDocumento::EN_PROCESAMIENTO
                ? EtapaInstitucionalDocumento::PENDIENTE_FIRMA
                : EtapaInstitucionalDocumento::EN_PROCESAMIENTO,
            AccionWorkflowDocumento::FIRMAR_CERTIFICADO => EtapaInstitucionalDocumento::FIRMADO_TIMBRADO,
            AccionWorkflowDocumento::ENVIAR_INCIDENCIA_TECNICA => EtapaInstitucionalDocumento::INCIDENCIA_TECNICA,
            AccionWorkflowDocumento::TOMAR_INCIDENCIA => EtapaInstitucionalDocumento::EN_REVISION_SISTEMAS,
            AccionWorkflowDocumento::REINTENTAR_PROCESO => $origen === EtapaInstitucionalDocumento::EN_REVISION_SISTEMAS
                ? EtapaInstitucionalDocumento::REINTENTADO
                : EtapaInstitucionalDocumento::EN_PROCESAMIENTO,
            AccionWorkflowDocumento::RECHAZAR => EtapaInstitucionalDocumento::RECHAZADO,
            AccionWorkflowDocumento::CANCELAR => EtapaInstitucionalDocumento::CANCELADO,
            AccionWorkflowDocumento::VER_RESULTADO_FINAL => null,
        };
    }

    protected function ejecutarTransicionInterna(
        DocumentoAcademico $documento,
        EtapaInstitucionalDocumento $origen,
        EtapaInstitucionalDocumento $destino,
        User $usuario,
        ?string $motivo,
        ?string $ip,
        ?string $userAgent,
    ): DocumentoAcademico {
        $uid = $usuario->id;

        return match ($destino) {
            EtapaInstitucionalDocumento::EN_VALIDACION_CERTIFICADOR => $this->captura->enviarARevision(
                $documento,
                $uid,
                $motivo ?? 'Enviado a validación del certificador.',
                $ip,
                $userAgent,
            )->tap(fn (DocumentoAcademico $d) => $this->persistirEtapa($d, $destino)),

            EtapaInstitucionalDocumento::SOLICITADO_CONTROL_ESCOLAR => $this->persistirEtapa(
                $documento,
                $destino,
                array_merge(['corregido_tras_observacion' => true], $motivo ? ['motivo_correccion' => $motivo] : []),
            ),

            EtapaInstitucionalDocumento::VALIDADO_POR_CERTIFICADOR => $this->persistirEtapa(
                $documento,
                $destino,
                ['validado_por_certificador_en' => now()->toIso8601String(), 'validado_por' => $uid],
            ),

            EtapaInstitucionalDocumento::OBSERVADO_POR_CERTIFICADOR => $this->persistirEtapa(
                $documento,
                $destino,
                [
                    'observado_por_certificador' => true,
                    'motivo_observacion' => $motivo,
                ],
            ),

            EtapaInstitucionalDocumento::APROBADO_EDUCACION_SUPERIOR => $this->persistirEtapa(
                $this->captura->aprobar($documento, $uid, $motivo ?? 'Aprobación institucional.', $ip, $userAgent),
                $destino,
            ),

            EtapaInstitucionalDocumento::FOLIO_ASIGNADO => $this->persistirEtapa(
                tap($documento->fresh(), function (DocumentoAcademico $d) {
                    $this->folioService->asignarFolioInterno($d, null);
                })->refresh(),
                $destino,
            ),

            EtapaInstitucionalDocumento::EN_PROCESAMIENTO => $this->persistirEtapa(
                $documento,
                $destino,
                ['procesamiento_iniciado_en' => now()->toIso8601String()],
            ),

            EtapaInstitucionalDocumento::PENDIENTE_FIRMA => $this->persistirEtapa(
                $this->workflowEstados->marcarListoParaFirma(
                    $documento,
                    app(\App\Services\Certificacion\DocumentoAcademicoRequisitosService::class),
                    $uid,
                    $ip,
                    $userAgent,
                ),
                $destino,
            ),

            EtapaInstitucionalDocumento::FIRMADO_TIMBRADO => $this->persistirEtapa(
                $documento,
                $destino,
                [
                    'firma_simulada' => true,
                    'firma_simulada_en' => now()->toIso8601String(),
                    'nota' => 'Simulación institucional; no ejecuta firma SEP real.',
                ],
            ),

            EtapaInstitucionalDocumento::FINALIZADO => $this->persistirEtapa(
                $documento,
                $destino,
                ['documento_finalizado' => true, 'finalizado_en' => now()->toIso8601String()],
            ),

            EtapaInstitucionalDocumento::INCIDENCIA_TECNICA => $this->persistirEtapa(
                $documento,
                $destino,
                ['incidencia_registrada_en' => now()->toIso8601String(), 'incidencia_motivo' => $motivo],
            ),

            EtapaInstitucionalDocumento::EN_REVISION_SISTEMAS => $this->persistirEtapa(
                $documento,
                $destino,
                ['sistemas_tomo_incidencia_en' => now()->toIso8601String()],
            ),

            EtapaInstitucionalDocumento::REINTENTADO => $this->persistirEtapa(
                $documento,
                $destino,
                ['reintentado_en' => now()->toIso8601String(), 'etapa_previa_reintento' => $origen->value],
            ),

            EtapaInstitucionalDocumento::RECHAZADO => $this->persistirEtapa(
                $this->workflowEstados->rechazar($documento, $uid, $motivo ?? 'Rechazo institucional.', $ip, $userAgent),
                $destino,
            ),

            EtapaInstitucionalDocumento::CANCELADO => $this->persistirEtapa(
                $this->workflowEstados->cancelar($documento, $uid, $motivo ?? 'Cancelación institucional.', $ip, $userAgent),
                $destino,
            ),

            default => throw ValidationException::withMessages([
                'workflow' => [self::MENSAJE_TRANSICION_INVALIDA],
            ]),
        };
    }

    /**
     * @param  array<string, mixed>  $extraMeta
     */
    protected function persistirEtapa(
        DocumentoAcademico $documento,
        EtapaInstitucionalDocumento $etapa,
        array $extraMeta = [],
    ): DocumentoAcademico {
        $meta = array_merge($documento->metadata ?? [], $extraMeta, [
            'etapa_institucional' => $etapa->value,
            'etapa_actualizada_en' => now()->toIso8601String(),
        ]);
        $documento->forceFill(['metadata' => $meta])->save();

        return $documento->refresh();
    }

    protected function grafoPermitido(EtapaInstitucionalDocumento $origen, EtapaInstitucionalDocumento $destino): bool
    {
        $mapa = [
            EtapaInstitucionalDocumento::SOLICITADO_CONTROL_ESCOLAR->value => [
                EtapaInstitucionalDocumento::EN_VALIDACION_CERTIFICADOR,
                EtapaInstitucionalDocumento::CANCELADO,
            ],
            EtapaInstitucionalDocumento::EN_VALIDACION_CERTIFICADOR->value => [
                EtapaInstitucionalDocumento::VALIDADO_POR_CERTIFICADOR,
                EtapaInstitucionalDocumento::OBSERVADO_POR_CERTIFICADOR,
                EtapaInstitucionalDocumento::INCIDENCIA_TECNICA,
            ],
            EtapaInstitucionalDocumento::OBSERVADO_POR_CERTIFICADOR->value => [
                EtapaInstitucionalDocumento::SOLICITADO_CONTROL_ESCOLAR,
                EtapaInstitucionalDocumento::EN_VALIDACION_CERTIFICADOR,
                EtapaInstitucionalDocumento::RECHAZADO,
            ],
            EtapaInstitucionalDocumento::VALIDADO_POR_CERTIFICADOR->value => [
                EtapaInstitucionalDocumento::APROBADO_EDUCACION_SUPERIOR,
                EtapaInstitucionalDocumento::OBSERVADO_POR_CERTIFICADOR,
            ],
            EtapaInstitucionalDocumento::APROBADO_EDUCACION_SUPERIOR->value => [
                EtapaInstitucionalDocumento::FOLIO_ASIGNADO,
                EtapaInstitucionalDocumento::EN_PROCESAMIENTO,
                EtapaInstitucionalDocumento::INCIDENCIA_TECNICA,
            ],
            EtapaInstitucionalDocumento::FOLIO_ASIGNADO->value => [
                EtapaInstitucionalDocumento::EN_PROCESAMIENTO,
                EtapaInstitucionalDocumento::INCIDENCIA_TECNICA,
            ],
            EtapaInstitucionalDocumento::EN_PROCESAMIENTO->value => [
                EtapaInstitucionalDocumento::PENDIENTE_FIRMA,
                EtapaInstitucionalDocumento::INCIDENCIA_TECNICA,
            ],
            EtapaInstitucionalDocumento::PENDIENTE_FIRMA->value => [
                EtapaInstitucionalDocumento::FIRMADO_TIMBRADO,
                EtapaInstitucionalDocumento::INCIDENCIA_TECNICA,
            ],
            EtapaInstitucionalDocumento::FIRMADO_TIMBRADO->value => [
                EtapaInstitucionalDocumento::FINALIZADO,
            ],
            EtapaInstitucionalDocumento::INCIDENCIA_TECNICA->value => [
                EtapaInstitucionalDocumento::EN_REVISION_SISTEMAS,
            ],
            EtapaInstitucionalDocumento::EN_REVISION_SISTEMAS->value => [
                EtapaInstitucionalDocumento::REINTENTADO,
                EtapaInstitucionalDocumento::INCIDENCIA_TECNICA,
            ],
            EtapaInstitucionalDocumento::REINTENTADO->value => [
                EtapaInstitucionalDocumento::EN_PROCESAMIENTO,
                EtapaInstitucionalDocumento::PENDIENTE_FIRMA,
            ],
        ];

        $permitidos = $mapa[$origen->value] ?? [];

        foreach ($permitidos as $p) {
            if ($p === $destino) {
                return true;
            }
        }

        if (in_array($destino, [EtapaInstitucionalDocumento::RECHAZADO, EtapaInstitucionalDocumento::CANCELADO], true)) {
            return ! in_array($origen, [EtapaInstitucionalDocumento::FINALIZADO, EtapaInstitucionalDocumento::CANCELADO], true);
        }

        return false;
    }

    protected function usuarioPuedeEjecutarTransicion(
        EtapaInstitucionalDocumento $origen,
        EtapaInstitucionalDocumento $destino,
        User $usuario,
        DocumentoAcademico $documento,
    ): bool {
        if ($usuario->hasAnyRole(['superadmin', 'admin'])) {
            return true;
        }

        return match ($destino) {
            EtapaInstitucionalDocumento::EN_VALIDACION_CERTIFICADOR,
            EtapaInstitucionalDocumento::SOLICITADO_CONTROL_ESCOLAR => $this->esControlEscolar($usuario),

            EtapaInstitucionalDocumento::VALIDADO_POR_CERTIFICADOR,
            EtapaInstitucionalDocumento::OBSERVADO_POR_CERTIFICADOR => $this->esCertificador($usuario) && ! $this->esSoloEducacionSuperior($usuario),

            EtapaInstitucionalDocumento::APROBADO_EDUCACION_SUPERIOR,
            EtapaInstitucionalDocumento::FOLIO_ASIGNADO,
            EtapaInstitucionalDocumento::EN_PROCESAMIENTO,
            EtapaInstitucionalDocumento::PENDIENTE_FIRMA,
            EtapaInstitucionalDocumento::FIRMADO_TIMBRADO,
            EtapaInstitucionalDocumento::FINALIZADO => $this->esEducacionSuperior($usuario) && ! $this->esSoloSistemas($usuario),

            EtapaInstitucionalDocumento::INCIDENCIA_TECNICA,
            EtapaInstitucionalDocumento::EN_REVISION_SISTEMAS,
            EtapaInstitucionalDocumento::REINTENTADO => $this->esSistemasTecnico($usuario),

            EtapaInstitucionalDocumento::RECHAZADO,
            EtapaInstitucionalDocumento::CANCELADO => $this->puedeRechazarOCancelar($usuario, $origen),

            default => false,
        };
    }

    protected function esControlEscolar(User $usuario): bool
    {
        return SicesAuth::canAny($usuario, 'crear_documentos', 'documentos.crear', 'documentos.crear_borrador', 'enviar_revision', 'documentos.enviar_revision')
            && ! $this->esSoloSistemas($usuario);
    }

    protected function esCertificador(User $usuario): bool
    {
        return $usuario->can('certificacion.validar')
            || SicesAuth::canAny($usuario, 'validaciones_normativas.aprobar', 'documentos.observar');
    }

    protected function esEducacionSuperior(User $usuario): bool
    {
        return SicesAuth::canAny(
            $usuario,
            'aprobar_documentos',
            'documentos.aprobar',
            'documentos.aprobar_institucionalmente',
            'certificacion.autorizar_emision',
        ) || $usuario->hasRole('educacion_superior');
    }

    protected function esSoloEducacionSuperior(User $usuario): bool
    {
        return $this->esEducacionSuperior($usuario) && ! $this->esCertificador($usuario) && ! $this->esControlEscolar($usuario);
    }

    protected function esSistemasTecnico(User $usuario): bool
    {
        return ($usuario->hasRole('sistemas') || SicesAuth::canAny($usuario, 'logs.ver', 'integraciones.ver', 'certificacion.enviar_incidencia_sistemas'))
            && ! $this->esEducacionSuperior($usuario);
    }

    protected function esSoloSistemas(User $usuario): bool
    {
        return $usuario->hasRole('sistemas')
            && ! $usuario->hasAnyRole(['superadmin', 'admin', 'educacion_superior'])
            && ! SicesAuth::canAny($usuario, 'aprobar_documentos', 'documentos.aprobar', 'certificacion.autorizar_emision');
    }

    protected function puedeRechazarOCancelar(User $usuario, EtapaInstitucionalDocumento $origen): bool
    {
        if ($origen === EtapaInstitucionalDocumento::OBSERVADO_POR_CERTIFICADOR
            || $origen === EtapaInstitucionalDocumento::EN_VALIDACION_CERTIFICADOR) {
            return $this->esCertificador($usuario) || $this->esEducacionSuperior($usuario);
        }

        return SicesAuth::canAny($usuario, 'rechazar_documentos', 'documentos.rechazar', 'cancelar_documentos', 'documentos.cancelar');
    }

    protected function puedeVerResultadoFinal(DocumentoAcademico $documento, User $usuario): bool
    {
        $etapa = $this->resolverEtapaInstitucional($documento);

        return in_array($etapa, [
            EtapaInstitucionalDocumento::FIRMADO_TIMBRADO,
            EtapaInstitucionalDocumento::FINALIZADO,
        ], true) && SicesAuth::canAny($usuario, 'ver_documentos', 'documentos.ver');
    }

    /**
     * @return list<array{accion: AccionWorkflowDocumento, etapa: EtapaInstitucionalDocumento}>
     */
    protected function definicionesDesdeEtapa(EtapaInstitucionalDocumento $etapa): array
    {
        return match ($etapa) {
            EtapaInstitucionalDocumento::SOLICITADO_CONTROL_ESCOLAR => [
                ['accion' => AccionWorkflowDocumento::ENVIAR_VALIDACION, 'etapa' => EtapaInstitucionalDocumento::EN_VALIDACION_CERTIFICADOR],
            ],
            EtapaInstitucionalDocumento::OBSERVADO_POR_CERTIFICADOR => [
                ['accion' => AccionWorkflowDocumento::CORREGIR_OBSERVACIONES, 'etapa' => EtapaInstitucionalDocumento::SOLICITADO_CONTROL_ESCOLAR],
                ['accion' => AccionWorkflowDocumento::ENVIAR_VALIDACION, 'etapa' => EtapaInstitucionalDocumento::EN_VALIDACION_CERTIFICADOR],
            ],
            EtapaInstitucionalDocumento::EN_VALIDACION_CERTIFICADOR => [
                ['accion' => AccionWorkflowDocumento::VALIDAR_INFORMACION, 'etapa' => EtapaInstitucionalDocumento::VALIDADO_POR_CERTIFICADOR],
                ['accion' => AccionWorkflowDocumento::DEVOLVER_OBSERVACIONES, 'etapa' => EtapaInstitucionalDocumento::OBSERVADO_POR_CERTIFICADOR],
            ],
            EtapaInstitucionalDocumento::VALIDADO_POR_CERTIFICADOR => [
                ['accion' => AccionWorkflowDocumento::APROBAR_EXPEDIENTE, 'etapa' => EtapaInstitucionalDocumento::APROBADO_EDUCACION_SUPERIOR],
                ['accion' => AccionWorkflowDocumento::DEVOLVER_OBSERVACIONES, 'etapa' => EtapaInstitucionalDocumento::OBSERVADO_POR_CERTIFICADOR],
            ],
            EtapaInstitucionalDocumento::APROBADO_EDUCACION_SUPERIOR => [
                ['accion' => AccionWorkflowDocumento::ASIGNAR_FOLIO, 'etapa' => EtapaInstitucionalDocumento::FOLIO_ASIGNADO],
                ['accion' => AccionWorkflowDocumento::PROCESAR_CERTIFICACION, 'etapa' => EtapaInstitucionalDocumento::EN_PROCESAMIENTO],
            ],
            EtapaInstitucionalDocumento::FOLIO_ASIGNADO => [
                ['accion' => AccionWorkflowDocumento::PROCESAR_CERTIFICACION, 'etapa' => EtapaInstitucionalDocumento::EN_PROCESAMIENTO],
            ],
            EtapaInstitucionalDocumento::EN_PROCESAMIENTO => [
                ['accion' => AccionWorkflowDocumento::PROCESAR_CERTIFICACION, 'etapa' => EtapaInstitucionalDocumento::PENDIENTE_FIRMA],
            ],
            EtapaInstitucionalDocumento::PENDIENTE_FIRMA => [
                ['accion' => AccionWorkflowDocumento::FIRMAR_CERTIFICADO, 'etapa' => EtapaInstitucionalDocumento::FIRMADO_TIMBRADO],
            ],
            EtapaInstitucionalDocumento::FIRMADO_TIMBRADO => [
                ['accion' => AccionWorkflowDocumento::VER_RESULTADO_FINAL, 'etapa' => EtapaInstitucionalDocumento::FINALIZADO],
            ],
            EtapaInstitucionalDocumento::INCIDENCIA_TECNICA => [
                ['accion' => AccionWorkflowDocumento::TOMAR_INCIDENCIA, 'etapa' => EtapaInstitucionalDocumento::EN_REVISION_SISTEMAS],
            ],
            EtapaInstitucionalDocumento::EN_REVISION_SISTEMAS => [
                ['accion' => AccionWorkflowDocumento::REINTENTAR_PROCESO, 'etapa' => EtapaInstitucionalDocumento::REINTENTADO],
                ['accion' => AccionWorkflowDocumento::ENVIAR_INCIDENCIA_TECNICA, 'etapa' => EtapaInstitucionalDocumento::INCIDENCIA_TECNICA],
            ],
            EtapaInstitucionalDocumento::REINTENTADO => [
                ['accion' => AccionWorkflowDocumento::REINTENTAR_PROCESO, 'etapa' => EtapaInstitucionalDocumento::EN_PROCESAMIENTO],
            ],
            default => [],
        };
    }
}
