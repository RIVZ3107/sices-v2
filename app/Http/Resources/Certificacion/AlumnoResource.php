<?php

declare(strict_types=1);

namespace App\Http\Resources\Certificacion;

use App\Models\Alumno;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Alumno */
class AlumnoResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'curp' => $this->curp,
            'curp_raiz' => $this->curp_raiz,
            'curp_digito' => $this->curp_digito,
            'rfc' => $this->rfc,
            'rfc_raiz' => $this->rfc_raiz,
            'rfc_homoclave' => $this->rfc_homoclave,
            'nombre' => $this->nombre,
            'primer_apellido' => $this->primer_apellido,
            'segundo_apellido' => $this->segundo_apellido,
            'fecha_nacimiento' => $this->fecha_nacimiento?->format('Y-m-d'),
            'genero' => $this->genero,
            'nacionalidad' => $this->nacionalidad,
            'estatus' => $this->estatus,
            'metadata' => $this->metadata,
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
