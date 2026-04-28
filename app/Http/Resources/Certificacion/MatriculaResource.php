<?php

declare(strict_types=1);

namespace App\Http\Resources\Certificacion;

use App\Models\Matricula;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Matricula */
class MatriculaResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'alumno_id' => $this->alumno_id,
            'oferta_academica_id' => $this->oferta_academica_id,
            'ciclo_escolar_id' => $this->ciclo_escolar_id,
            'matricula' => $this->matricula,
            'estado' => $this->estado,
            'fecha_ingreso' => $this->fecha_ingreso?->format('Y-m-d'),
            'fecha_egreso' => $this->fecha_egreso?->format('Y-m-d'),
            'metadata' => $this->metadata,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
