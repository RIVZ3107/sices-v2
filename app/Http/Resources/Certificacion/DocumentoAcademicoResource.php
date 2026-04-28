<?php

declare(strict_types=1);

namespace App\Http\Resources\Certificacion;

use App\Models\DocumentoAcademico;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin DocumentoAcademico */
class DocumentoAcademicoResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return (new DocumentoAcademicoCapturaResource($this->resource))->toArray($request);
    }
}
