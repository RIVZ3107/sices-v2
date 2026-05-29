<?php

declare(strict_types=1);

namespace App\Http\Requests\Certificacion;

use App\Rules\TipoDocumentoAcademicoCatalogoRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreDocumentoAcademicoCapturaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'alumno_id' => ['required', 'integer', 'exists:alumnos,id'],
            'matricula_id' => ['required', 'integer', 'exists:matriculas,id'],
            'oferta_academica_id' => ['nullable', 'integer', 'exists:ofertas_academicas,id'],
            'ciclo_escolar_id' => ['required', 'integer', 'exists:ciclos_escolares,id'],
            'subsistema_id' => ['nullable', 'integer', 'exists:subsistemas,id'],
            'region_id' => ['nullable', 'integer', 'exists:regiones,id'],
            'institucion_id' => ['nullable', 'integer', 'exists:instituciones,id'],
            'sede_id' => ['nullable', 'integer', 'exists:sedes,id'],
            'tipo_documento' => ['required', 'string', 'max:64', new TipoDocumentoAcademicoCatalogoRule()],
            'tipo_certificacion' => ['nullable', 'string', 'max:50'],
            'metadata' => ['nullable', 'array'],
        ];
    }
}
