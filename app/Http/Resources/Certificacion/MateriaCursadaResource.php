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
            'inscripcion_periodo_id' => $this->inscripcion_periodo_id,
            'carga_academica_id' => $this->carga_academica_id,
            'materia_id' => $this->materia_id,
            'plan_materia_id' => $this->plan_materia_id,
            'ciclo_escolar_id' => $this->ciclo_escolar_id,
            'clave' => $this->clave,
            'nombre' => $this->nombre,
            'calificacion' => $this->calificacion,
            'calificacion_final' => $this->calificacion_final,
            'calificacion_texto' => $this->calificacion_texto,
            'periodo' => $this->periodo,
            'semestre' => $this->semestre,
            'tipo_periodo_curricular' => $this->tipo_periodo_curricular,
            'numero_periodo_curricular' => $this->numero_periodo_curricular,
            'etiqueta_periodo_curricular' => $this->etiqueta_periodo_curricular,
            'orden' => $this->orden,
            'creditos' => $this->creditos,
            'tipo' => $this->tipo,
            'tipo_evaluacion' => $this->tipo_evaluacion,
            'estado' => $this->estado,
            'estatus_acreditacion' => $this->estatus_acreditacion,
            'metadata' => $this->metadata,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
