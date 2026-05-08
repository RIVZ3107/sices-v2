<?php

declare(strict_types=1);

namespace App\Services\Certificacion;

use App\Enums\Certificacion\EstadoCadena;
use App\Enums\Certificacion\EstadoFirma;
use App\Enums\Certificacion\EstadoPdf;
use App\Enums\Certificacion\EstadoSep;
use App\Enums\Certificacion\EstadoWorkflow;
use App\Enums\Certificacion\EstadoXml;
use App\Models\DocumentoAcademico;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Orquestación de transiciones de workflow sobre documentos académicos (sin firma/XML/PDF reales).
 */
class DocumentoAcademicoWorkflowService
{
    public function __construct(
        protected DocumentoEstadoService $estados,
        protected AuditoriaService $auditoria,
        protected DocumentoMateriaSnapshotService $materiasSnapshot,
        protected CertificacionImportacionLegacyNormativaGate $legacyNormativaGate,
    ) {}

    /**
     * @param  array<string, mixed>  $atributos  Campos persistibles del modelo `DocumentoAcademico`.
     */
    public function crearBorrador(array $atributos, ?int $creadoPor = null): DocumentoAcademico
    {
        $documento = DocumentoAcademico::query()->create(array_merge([
            'estado_workflow' => EstadoWorkflow::BORRADOR->value,
            'estado_cadena' => EstadoCadena::NO_GENERADA->value,
            'estado_xml' => EstadoXml::NO_GENERADO->value,
            'estado_firma' => EstadoFirma::NO_FIRMADO->value,
            'estado_sep' => EstadoSep::NO_ENVIADO->value,
            'estado_pdf' => EstadoPdf::NO_GENERADO->value,
            'created_by' => $creadoPor,
        ], $atributos));

        $this->auditoria->registrar(
            evento: 'documento_academico.creado',
            entidadTipo: DocumentoAcademico::class,
            entidadId: $documento->id,
            payload: ['estado_workflow' => $documento->estado_workflow],
            userId: $creadoPor,
            metadata: ['servicio' => self::class],
        );

        return $documento;
    }

    public function pasarAPendiente(
        DocumentoAcademico $documento,
        ?int $usuarioId = null,
        ?string $motivo = null,
        ?string $ip = null,
        ?string $userAgent = null,
    ): DocumentoAcademico {
        $doc = $this->estados->cambiarEstado(
            $documento,
            'estado_workflow',
            EstadoWorkflow::PENDIENTE->value,
            $usuarioId,
            $motivo,
            [],
            $ip,
            $userAgent,
        );

        $this->auditoria->registrar(
            'documento_academico.workflow.pendiente',
            DocumentoAcademico::class,
            $doc->id,
            ['motivo' => $motivo],
            $usuarioId,
            $ip,
            $userAgent,
        );

        return $doc;
    }

    public function pasarAEnRevision(
        DocumentoAcademico $documento,
        ?int $usuarioId = null,
        ?string $motivo = null,
        ?string $ip = null,
        ?string $userAgent = null,
    ): DocumentoAcademico {
        $doc = $this->estados->cambiarEstado(
            $documento,
            'estado_workflow',
            EstadoWorkflow::EN_REVISION->value,
            $usuarioId,
            $motivo,
            [],
            $ip,
            $userAgent,
        );

        $this->auditoria->registrar(
            'documento_academico.workflow.en_revision',
            DocumentoAcademico::class,
            $doc->id,
            ['motivo' => $motivo],
            $usuarioId,
            $ip,
            $userAgent,
        );

        return $doc;
    }

    public function aprobar(
        DocumentoAcademico $documento,
        ?int $usuarioId = null,
        ?string $motivo = null,
        ?string $ip = null,
        ?string $userAgent = null,
    ): DocumentoAcademico {
        $doc = $this->estados->cambiarEstado(
            $documento,
            'estado_workflow',
            EstadoWorkflow::APROBADO->value,
            $usuarioId,
            $motivo,
            [],
            $ip,
            $userAgent,
        );

        $doc->forceFill([
            'fecha_aprobacion' => now(),
            'approved_by' => $usuarioId,
        ])->save();

        $this->auditoria->registrar(
            'documento_academico.workflow.aprobado',
            DocumentoAcademico::class,
            $doc->id,
            ['motivo' => $motivo],
            $usuarioId,
            $ip,
            $userAgent,
        );

        return $doc->refresh();
    }

    public function rechazar(
        DocumentoAcademico $documento,
        ?int $usuarioId = null,
        ?string $motivo = null,
        ?string $ip = null,
        ?string $userAgent = null,
    ): DocumentoAcademico {
        $doc = $this->estados->cambiarEstado(
            $documento,
            'estado_workflow',
            EstadoWorkflow::RECHAZADO->value,
            $usuarioId,
            $motivo,
            [],
            $ip,
            $userAgent,
        );

        $this->auditoria->registrar(
            'documento_academico.workflow.rechazado',
            DocumentoAcademico::class,
            $doc->id,
            ['motivo' => $motivo],
            $usuarioId,
            $ip,
            $userAgent,
        );

        return $doc;
    }

    public function cancelar(
        DocumentoAcademico $documento,
        ?int $usuarioId = null,
        ?string $motivo = null,
        ?string $ip = null,
        ?string $userAgent = null,
    ): DocumentoAcademico {
        $doc = $this->estados->cambiarEstado(
            $documento,
            'estado_workflow',
            EstadoWorkflow::CANCELADO->value,
            $usuarioId,
            $motivo,
            [],
            $ip,
            $userAgent,
        );

        $this->auditoria->registrar(
            'documento_academico.workflow.cancelado',
            DocumentoAcademico::class,
            $doc->id,
            ['motivo' => $motivo],
            $usuarioId,
            $ip,
            $userAgent,
        );

        return $doc;
    }

    /**
     * Marca metadata de preparación para firma (bloques posteriores); no ejecuta firma SEP.
     *
     * @throws ValidationException
     */
    public function marcarListoParaFirma(
        DocumentoAcademico $documento,
        DocumentoAcademicoRequisitosService $requisitos,
        ?int $usuarioId = null,
        ?string $ip = null,
        ?string $userAgent = null,
    ): DocumentoAcademico {
        $documento->loadMissing('matricula');
        $this->legacyNormativaGate->asegurarMatriculaListaParaCertificadoOficial(
            $documento->matricula,
            $usuarioId,
            'marcar_listo_para_firma',
        );
        $requisitos->validarParaMarcarListoFirma($documento);
        $this->materiasSnapshot->generarSiNoExiste($documento->fresh(), $usuarioId);

        return DB::transaction(function () use ($documento, $usuarioId, $ip, $userAgent) {
            $documento->refresh();

            $meta = array_merge($documento->metadata ?? [], [
                'listo_para_firma' => true,
                'listo_para_firma_marcado_en' => now()->toIso8601String(),
            ]);

            $documento->forceFill(['metadata' => $meta])->save();

            $this->auditoria->registrar(
                'documento_academico.preparado_para_firma',
                DocumentoAcademico::class,
                $documento->id,
                [],
                $usuarioId,
                $ip,
                $userAgent,
                ['servicio' => self::class],
            );

            return $documento->fresh();
        });
    }
}
