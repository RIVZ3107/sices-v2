<?php

declare(strict_types=1);

namespace App\Http\Resources\Certificacion;

use App\Models\DocumentoAcademico;
use App\Services\DocumentosAcademicos\DocumentoAcademicoWorkflowService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin DocumentoAcademico */
class BandejaDocumentoAcademicoResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $meta = $this->metadata ?? [];
        $user = $request->user();
        $verTecnico = $user?->hasRole('sistemas') || $user?->hasAnyRole(['superadmin', 'admin']);

        $workflowResumen = app(DocumentoAcademicoWorkflowService::class)
            ->armarWorkflowResumen($this->resource, $user);

        $ultima = $this->relationLoaded('ultimaObservacion')
            ? $this->ultimaObservacion
            : null;

        $base = [
            'id' => $this->id,
            'folio_interno' => $this->folio_interno,
            'tipo_documento' => $this->tipo_documento,
            'tipo_certificacion' => $this->tipo_certificacion,
            'estado_workflow' => $this->estado_workflow,
            'etapa_institucional' => $workflowResumen['etapa'],
            'workflow_resumen' => $workflowResumen,
            'fecha_solicitud' => $this->fecha_solicitud?->toIso8601String(),
            'fecha_aprobacion' => $this->fecha_aprobacion?->toIso8601String(),
            'institucion_id' => $this->institucion_id,
            'sede_id' => $this->sede_id,
            'subsistema_id' => $this->subsistema_id,
            'institucion' => $this->whenLoaded('institucion', fn () => [
                'nombre' => $this->institucion?->nombre,
                'clave' => $this->institucion?->clave,
            ]),
            'sede' => $this->whenLoaded('sede', fn () => [
                'nombre' => $this->sede?->nombre,
                'clave' => $this->sede?->clave,
            ]),
            'subsistema' => $this->whenLoaded('subsistema', fn () => [
                'id' => $this->subsistema?->id,
                'clave' => $this->subsistema?->clave,
                'nombre' => $this->subsistema?->nombre ?? $this->subsistema?->nombre_corto,
            ]),
            'matricula' => $this->whenLoaded('matricula', fn () => [
                'id' => $this->matricula?->id,
                'matricula' => $this->matricula?->matricula,
            ]),
            'programa' => $this->whenLoaded('ofertaAcademica', fn () => [
                'nombre' => $this->ofertaAcademica?->programaEstudio?->nombre,
                'clave' => $this->ofertaAcademica?->programaEstudio?->clave,
            ]),
            'plan' => $this->whenLoaded('ofertaAcademica', fn () => [
                'nombre' => $this->ofertaAcademica?->planEstudio?->nombre,
                'clave' => $this->ofertaAcademica?->planEstudio?->clave,
            ]),
            'alumno' => $this->whenLoaded('alumno', fn () => [
                'id' => $this->alumno?->id,
                'curp' => $this->alumno?->curp,
                'nombre_completo' => trim(implode(' ', array_filter([
                    $this->alumno?->nombre,
                    $this->alumno?->primer_apellido,
                    $this->alumno?->segundo_apellido,
                ]))),
            ]),
            'ultimo_movimiento' => $this->updated_at?->toIso8601String(),
            'ultima_observacion' => $ultima ? [
                'observacion' => $ultima->observacion,
                'created_at' => $ultima->created_at?->toIso8601String(),
            ] : null,
            'tiene_observaciones_pendientes' => (bool) (($this->observaciones_pendientes_count ?? 0) > 0),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];

        if ($verTecnico) {
            $base['estado_firma'] = $this->estado_firma;
            $base['estado_xml'] = $this->estado_xml;
            $base['estado_cadena'] = $this->estado_cadena;
            $base['estado_pdf'] = $this->estado_pdf;
            $base['folio_digital_sep'] = $this->folio_digital_sep;
            $base['listo_para_firma'] = (bool) ($meta['listo_para_firma'] ?? false);
        }

        return $base;
    }
}
