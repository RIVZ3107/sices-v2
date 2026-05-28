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
            'folio_digital_sep' => $this->folio_digital_sep,
            'subsistema_id' => $this->subsistema_id,
            'estado_pdf' => $this->estado_pdf,
            'token_consulta_publica' => $this->token_consulta_publica,
            'tipo_documento' => $this->tipo_documento,
            'estado_workflow' => $this->estado_workflow,
            'estado_cadena' => $this->estado_cadena,
            'estado_xml' => $this->estado_xml,
            'estado_firma' => $this->estado_firma,
            'fecha_solicitud' => $this->fecha_solicitud?->toIso8601String(),
            'fecha_aprobacion' => $this->fecha_aprobacion?->toIso8601String(),
            'institucion_id' => $this->institucion_id,
            'sede_id' => $this->sede_id,
            'region_id' => $this->region_id,
            'institucion' => $this->whenLoaded('institucion', fn () => [
                'nombre' => $this->institucion?->nombre,
                'clave' => $this->institucion?->clave,
            ]),
            'sede' => $this->whenLoaded('sede', fn () => [
                'nombre' => $this->sede?->nombre,
                'clave' => $this->sede?->clave,
            ]),
            'ciclo_escolar' => $this->whenLoaded('cicloEscolar', fn () => [
                'nombre' => $this->cicloEscolar?->nombre,
                'clave' => $this->cicloEscolar?->clave,
            ]),
            'tipo_certificacion' => $this->tipo_certificacion,
            'matricula' => $this->whenLoaded('matricula', fn () => [
                'id' => $this->matricula?->id,
                'matricula' => $this->matricula?->matricula,
            ]),
            'programa' => $this->whenLoaded('ofertaAcademica', fn () => [
                'nombre' => $this->ofertaAcademica?->programaEstudio?->nombre,
            ]),
            'plan' => $this->whenLoaded('ofertaAcademica', fn () => [
                'nombre' => $this->ofertaAcademica?->planEstudio?->nombre,
            ]),
            'alumno' => $this->whenLoaded('alumno', fn () => [
                'id' => $this->alumno?->id,
                'curp' => $this->alumno?->curp,
                'nombre_completo' => trim(implode(' ', array_filter([
                    $this->alumno?->nombre,
                    $this->alumno?->primer_apellido,
                    $this->alumno?->segundo_apellido,
                ]))),
                'nombre' => $this->alumno?->nombre,
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
