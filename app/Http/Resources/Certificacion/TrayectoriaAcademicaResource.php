<?php

declare(strict_types=1);

namespace App\Http\Resources\Certificacion;

use App\Models\TrayectoriaAcademica;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin TrayectoriaAcademica */
class TrayectoriaAcademicaResource extends JsonResource
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
            'fecha_inicio' => $this->fecha_inicio?->format('Y-m-d'),
            'fecha_fin' => $this->fecha_fin?->format('Y-m-d'),
            'promedio' => $this->promedio,
            'promedio_texto' => $this->promedio_texto,
            'creditos_obtenidos' => $this->creditos_obtenidos,
            'creditos_totales' => $this->creditos_totales,
            'total_materias' => $this->total_materias,
            'materias_aprobadas' => $this->materias_aprobadas,
            'materias_reprobadas' => $this->materias_reprobadas,
            'asignaturas_cursadas' => $this->asignaturas_cursadas,
            'asignaturas_total' => $this->asignaturas_total,
            'promedio_aprovechamiento' => $this->promedio_aprovechamiento,
            'materias_acreditadas' => $this->materias_acreditadas,
            'materias_no_acreditadas' => $this->materias_no_acreditadas,
            'estatus_trayectoria' => $this->estatus_trayectoria,
            'estado' => $this->estado,
            'metadata' => $this->metadata,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
