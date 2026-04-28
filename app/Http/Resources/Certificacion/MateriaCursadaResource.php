<?php

declare(strict_types=1);

namespace App\Http\Resources\Certificacion;

use App\Models\MateriaCursada;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin MateriaCursada */
class MateriaCursadaResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'alumno_id' => $this->alumno_id,
            'matricula_id' => $this->matricula_id,
            'materia_id' => $this->materia_id,
            'ciclo_escolar_id' => $this->ciclo_escolar_id,
            'clave' => $this->clave,
            'nombre' => $this->nombre,
            'calificacion' => $this->calificacion,
            'calificacion_texto' => $this->calificacion_texto,
            'periodo' => $this->periodo,
            'semestre' => $this->semestre,
            'creditos' => $this->creditos,
            'tipo' => $this->tipo,
            'estado' => $this->estado,
            'metadata' => $this->metadata,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
