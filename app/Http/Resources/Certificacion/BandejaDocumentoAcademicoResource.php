<?php

declare(strict_types=1);

namespace App\Http\Resources\Certificacion;

use App\Models\DocumentoAcademico;
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
        $obsTotal = $this->observaciones_count ?? $this->observaciones()->count();
        $obsPend = $this->observaciones_pendientes_count ?? $this->observaciones()->where('estado', 'pendiente')->count();
        $obsAten = $this->observaciones_atendidas_count ?? $this->observaciones()->where('estado', 'atendida')->count();
        $obsDesc = $this->observaciones_descartadas_count ?? $this->observaciones()->where('estado', 'descartada')->count();
        $ultima = $this->relationLoaded('ultimaObservacion')
            ? $this->ultimaObservacion
            : $this->observaciones()->latest()->first();

        return [
            'id' => $this->id,
            'folio_interno' => $this->folio_interno,
            'token_consulta_publica' => $this->token_consulta_publica,
            'tipo_documento' => $this->tipo_documento,
            'estado_workflow' => $this->estado_workflow,
            'estado_firma' => $this->estado_firma,
            'fecha_solicitud' => $this->fecha_solicitud?->toIso8601String(),
            'fecha_aprobacion' => $this->fecha_aprobacion?->toIso8601String(),
            'institucion_id' => $this->institucion_id,
            'sede_id' => $this->sede_id,
            'region_id' => $this->region_id,
            'alumno' => $this->whenLoaded('alumno', fn () => [
                'id' => $this->alumno?->id,
                'curp' => $this->alumno?->curp,
                'nombre' => trim(implode(' ', array_filter([
                    $this->alumno?->nombre,
                    $this->alumno?->primer_apellido,
                    $this->alumno?->segundo_apellido,
                ]))),
            ]),
            'listo_para_firma' => (bool) ($meta['listo_para_firma'] ?? false),
            'listo_para_firma_marcado_en' => $meta['listo_para_firma_marcado_en'] ?? null,
            'observaciones_total_count' => (int) $obsTotal,
            'observaciones_pendientes_count' => (int) $obsPend,
            'observaciones_atendidas_count' => (int) $obsAten,
            'observaciones_descartadas_count' => (int) $obsDesc,
            'ultima_observacion' => $ultima ? [
                'id' => $ultima->id,
                'tipo' => $ultima->tipo,
                'seccion' => $ultima->seccion,
                'observacion' => $ultima->observacion,
                'estado' => $ultima->estado,
                'prioridad' => $ultima->prioridad,
                'created_at' => $ultima->created_at?->toIso8601String(),
            ] : null,
            'tiene_observaciones_pendientes' => (bool) ($obsPend > 0),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
