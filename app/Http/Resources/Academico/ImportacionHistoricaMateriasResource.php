<?php

declare(strict_types=1);

namespace App\Http\Resources\Academico;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\ImportacionHistoricaMaterias */
class ImportacionHistoricaMateriasResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'user_id' => $this->user_id,
            'matricula_id' => $this->matricula_id,
            'ciclo_escolar_id' => $this->ciclo_escolar_id,
            'estado' => $this->estado,
            'matricula' => $this->whenLoaded('matricula', fn () => [
                'id' => $this->matricula->id,
                'alumno_id' => $this->matricula->alumno_id,
                'oferta_academica_id' => $this->matricula->oferta_academica_id,
                'matricula' => $this->matricula->matricula,
            ]),
            'filas_payload' => $this->filas_payload,
            'validacion_payload' => $this->validacion_payload,
            'reconciliacion_payload' => $this->reconciliacion_payload,
            'metadata' => $this->metadata,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
