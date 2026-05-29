<?php

declare(strict_types=1);

namespace App\Http\Resources\Certificacion;

use App\Models\DocumentoAcademico;
use App\Services\DocumentosAcademicos\DocumentoAcademicoTipoService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin DocumentoAcademico */
class DocumentoAcademicoCapturaResource extends JsonResource
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
            'alumno_id' => $this->alumno_id,
            'matricula_id' => $this->matricula_id,
            'oferta_academica_id' => $this->oferta_academica_id,
            'ciclo_escolar_id' => $this->ciclo_escolar_id,
            'subsistema_id' => $this->subsistema_id,
            'region_id' => $this->region_id,
            'institucion_id' => $this->institucion_id,
            'sede_id' => $this->sede_id,
            'tipo_documento' => $this->tipo_documento,
            'tipo_certificacion' => $this->tipo_certificacion,
            'folio_interno' => $this->folio_interno,
            'folio_digital_sep' => $this->folio_digital_sep,
            'token_consulta_publica' => $this->token_consulta_publica,
            'estado_workflow' => $this->estado_workflow,
            'estado_cadena' => $this->estado_cadena,
            'estado_xml' => $this->estado_xml,
            'estado_firma' => $this->estado_firma,
            'estado_sep' => $this->estado_sep,
            'estado_pdf' => $this->estado_pdf,
            'fecha_solicitud' => $this->fecha_solicitud?->toIso8601String(),
            'fecha_aprobacion' => $this->fecha_aprobacion?->toIso8601String(),
            'created_by' => $this->created_by,
            'approved_by' => $this->approved_by,
            'metadata' => $meta,
            'capacidades_documento' => app(DocumentoAcademicoTipoService::class)->capacidadesDesdeDocumento($this->resource),
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
            'alumno' => $this->whenLoaded('alumno', function () {
                $a = $this->alumno;

                return [
                    'id' => $a->id,
                    'curp' => $a->curp,
                    'nombre' => $a->nombre,
                    'primer_apellido' => $a->primer_apellido,
                    'segundo_apellido' => $a->segundo_apellido,
                    'nombre_completo' => trim(implode(' ', array_filter([
                        $a->nombre,
                        $a->primer_apellido,
                        $a->segundo_apellido,
                    ]))),
                ];
            }),
            'matricula' => $this->whenLoaded('matricula', fn () => [
                'id' => $this->matricula->id,
                'matricula' => $this->matricula->matricula,
                'estado' => $this->matricula->estado,
            ]),
            'institucion' => $this->whenLoaded('institucion', fn () => [
                'id' => $this->institucion->id,
                'nombre' => $this->institucion->nombre,
                'clave' => $this->institucion->clave,
            ]),
            'sede' => $this->whenLoaded('sede', fn () => [
                'id' => $this->sede->id,
                'nombre' => $this->sede->nombre,
                'clave' => $this->sede->clave,
            ]),
            'validacion_resumen' => $meta['validacion_resumen'] ?? null,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
