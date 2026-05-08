<?php

declare(strict_types=1);

namespace App\Services\Certificacion;

use App\Enums\Certificacion\EstadoWorkflow;
use App\Models\DocumentoAcademico;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Orquesta transiciones del proceso de captura (API) sin firma/XML/PDF reales.
 */
class DocumentoAcademicoCapturaService
{
    public function __construct(
        protected DocumentoAcademicoWorkflowService $workflow,
        protected DocumentoAcademicoRequisitosService $requisitos,
        protected DocumentoMateriaSnapshotService $materiasSnapshot,
        protected CertificacionImportacionLegacyNormativaGate $legacyNormativaGate,
    ) {}

    /**
     * Borrador/Rechazado → pendiente cuando los datos mínimos están completos.
     *
     * @throws ValidationException
     */
    public function pasarAPendienteDesdeCaptura(
        DocumentoAcademico $documento,
        ?int $usuarioId = null,
        ?string $motivo = null,
        ?string $ip = null,
        ?string $userAgent = null,
    ): DocumentoAcademico {
        return DB::transaction(function () use ($documento, $usuarioId, $motivo, $ip, $userAgent) {
            $documento->refresh();

            if (! in_array($documento->estado_workflow, [EstadoWorkflow::BORRADOR->value, EstadoWorkflow::RECHAZADO->value], true)) {
                throw ValidationException::withMessages([
                    'estado_workflow' => ['Solo los documentos en borrador o rechazados pueden pasar a pendiente por este proceso.'],
                ]);
            }

            $this->requisitos->validarParaEnvioRevision($documento);

            return $this->workflow->pasarAPendiente($documento->fresh(), $usuarioId, $motivo ?? 'Captura completada.', $ip, $userAgent);
        });
    }

    /**
     * Pendiente → en revisión (o borrador/rechazado → pendiente → en revisión).
     *
     * @throws ValidationException
     */
    public function enviarARevision(
        DocumentoAcademico $documento,
        ?int $usuarioId = null,
        ?string $motivo = null,
        ?string $ip = null,
        ?string $userAgent = null,
    ): DocumentoAcademico {
        return DB::transaction(function () use ($documento, $usuarioId, $motivo, $ip, $userAgent) {
            $documento->refresh();

            $this->requisitos->validarParaEnvioRevision($documento);

            if (in_array($documento->estado_workflow, [EstadoWorkflow::BORRADOR->value, EstadoWorkflow::RECHAZADO->value], true)) {
                $this->workflow->pasarAPendiente($documento->fresh(), $usuarioId, 'Avance automático desde captura para reenvío.', $ip, $userAgent);
                $documento->refresh();
            }

            if ($documento->estado_workflow !== EstadoWorkflow::PENDIENTE->value) {
                throw ValidationException::withMessages([
                    'estado_workflow' => ['El documento debe estar pendiente para enviarlo a revisión.'],
                ]);
            }

            return $this->workflow->pasarAEnRevision($documento->fresh(), $usuarioId, $motivo ?? 'Enviado a revisión.', $ip, $userAgent);
        });
    }

    /**
     * @throws ValidationException
     */
    public function aprobar(
        DocumentoAcademico $documento,
        ?int $usuarioId = null,
        ?string $motivo = null,
        ?string $ip = null,
        ?string $userAgent = null,
    ): DocumentoAcademico {
        return DB::transaction(function () use ($documento, $usuarioId, $motivo, $ip, $userAgent) {
            $documento->loadMissing('matricula');
            $this->legacyNormativaGate->asegurarMatriculaListaParaCertificadoOficial(
                $documento->matricula,
                $usuarioId,
                'aprobar_documento',
            );
            $this->requisitos->validarParaAprobacion($documento);
            $this->materiasSnapshot->generarSiNoExiste($documento->fresh(), $usuarioId);

            return $this->workflow->aprobar($documento->fresh(), $usuarioId, $motivo ?? 'Documento aprobado.', $ip, $userAgent);
        });
    }
}
