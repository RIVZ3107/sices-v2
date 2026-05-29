<?php

declare(strict_types=1);

namespace App\Services\DocumentosAcademicos;

use App\Enums\Certificacion\EstadoWorkflow;
use App\Models\DocumentoAcademico;
use App\Models\OfertaAcademica;
use Illuminate\Validation\ValidationException;

/**
 * Reglas de solicitud activa y prevención de duplicados (Control Escolar → catálogo autorizado).
 */
class DocumentoAcademicoSolicitudActivaService
{
    public const MENSAJE_DUPLICADO_ACTIVO =
        'Ya existe un documento activo de este tipo para el alumno y ciclo seleccionado. Consulte el expediente antes de crear una nueva solicitud.';

    /**
     * Estados de workflow que bloquean una nueva solicitud del mismo contexto.
     *
     * @return list<string>
     */
    public function estadosWorkflowActivos(): array
    {
        return [
            EstadoWorkflow::BORRADOR->value,
            EstadoWorkflow::PENDIENTE->value,
            EstadoWorkflow::EN_REVISION->value,
            EstadoWorkflow::APROBADO->value,
        ];
    }

    /**
     * Etapas institucionales futuras (metadata) consideradas activas si el workflow aún no las refleja.
     *
     * @return list<string>
     */
    public function etapasInstitucionalesActivas(): array
    {
        return [
            'captura',
            'solicitado',
            'solicitado_control_escolar',
            'validado_certificador',
            'folio_asignado',
            'en_procesamiento',
            'pendiente_firma',
            'firmado',
            'finalizado',
        ];
    }

    /**
     * @return list<string>
     */
    public function estadosQuePermitenNuevaSolicitud(): array
    {
        return [
            EstadoWorkflow::RECHAZADO->value,
            EstadoWorkflow::CANCELADO->value,
            'anulado',
        ];
    }

    public function existeDocumentoActivoDuplicado(DocumentoAcademico $documento): bool
    {
        if ($documento->alumno_id === null || $documento->ciclo_escolar_id === null || $documento->tipo_documento === null) {
            return false;
        }

        $query = DocumentoAcademico::query()
            ->where('alumno_id', $documento->alumno_id)
            ->where('ciclo_escolar_id', $documento->ciclo_escolar_id)
            ->where('tipo_documento', $documento->tipo_documento)
            ->whereIn('estado_workflow', $this->estadosWorkflowActivos());

        if ($documento->matricula_id !== null) {
            $query->where('matricula_id', $documento->matricula_id);
        }

        if ($documento->subsistema_id !== null) {
            $query->where('subsistema_id', $documento->subsistema_id);
        }

        if ($documento->oferta_academica_id !== null) {
            $oferta = $documento->relationLoaded('ofertaAcademica')
                ? $documento->ofertaAcademica
                : OfertaAcademica::query()->find($documento->oferta_academica_id);

            if ($oferta?->programa_estudio_id) {
                $query->whereHas('ofertaAcademica', function ($q) use ($oferta) {
                    $q->where('programa_estudio_id', $oferta->programa_estudio_id);
                    if ($oferta->plan_estudio_id) {
                        $q->where('plan_estudio_id', $oferta->plan_estudio_id);
                    }
                });
            } else {
                $query->where('oferta_academica_id', $documento->oferta_academica_id);
            }
        }

        if ($documento->exists) {
            $query->whereKeyNot($documento->getKey());
        }

        return $query->exists();
    }

    /**
     * @throws ValidationException
     */
    public function validarNoDuplicadoActivo(DocumentoAcademico $documento): void
    {
        if ($this->existeDocumentoActivoDuplicado($documento)) {
            throw ValidationException::withMessages([
                'documento' => [self::MENSAJE_DUPLICADO_ACTIVO],
            ]);
        }
    }

    /**
     * Marca de solicitud iniciada por Control Escolar (estado workflow: borrador / captura).
     *
     * @param  array<string, mixed>  $metadata
     * @return array<string, mixed>
     */
    public function marcarSolicitudControlEscolar(array $metadata): array
    {
        return array_merge($metadata, [
            'etapa_institucional' => 'solicitado_control_escolar',
            'origen_solicitud' => 'control_escolar',
            'solicitud_iniciada_en' => now()->toIso8601String(),
        ]);
    }
}
