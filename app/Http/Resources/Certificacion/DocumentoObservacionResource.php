<?php

declare(strict_types=1);

namespace App\Http\Resources\Certificacion;

use App\Models\DocumentoObservacion;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin DocumentoObservacion */
class DocumentoObservacionResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'documento_academico_id' => $this->documento_academico_id,
            'tipo' => $this->tipo,
            'seccion' => $this->seccion,
            'observacion' => $this->observacion,
            'estado' => $this->estado,
            'prioridad' => $this->prioridad,
            'creada_por' => $this->creada_por,
            'atendida_por' => $this->atendida_por,
            'atendida_at' => $this->atendida_at?->toIso8601String(),
            'respuesta' => $this->respuesta,
            'metadata' => $this->metadata ?? [],
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
