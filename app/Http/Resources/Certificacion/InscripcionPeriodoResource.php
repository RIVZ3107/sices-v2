<?php

declare(strict_types=1);

namespace App\Http\Resources\Certificacion;

use App\Models\InscripcionPeriodo;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin InscripcionPeriodo */
class InscripcionPeriodoResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'matricula_id' => $this->matricula_id,
            'ciclo_escolar_id' => $this->ciclo_escolar_id,
            'periodo_escolar_id' => $this->periodo_escolar_id,
            'grupo_id' => $this->grupo_id,
            'semestre' => $this->semestre,
            'tipo_periodo_curricular' => $this->tipo_periodo_curricular,
            'numero_periodo_curricular' => $this->numero_periodo_curricular,
            'etiqueta_periodo_curricular' => $this->etiqueta_periodo_curricular,
            'estatus' => $this->estatus,
            'fecha_inscripcion' => $this->fecha_inscripcion?->format('Y-m-d'),
            'metadata' => $this->metadata,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
