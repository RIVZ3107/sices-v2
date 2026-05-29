<?php

declare(strict_types=1);

namespace App\Http\Requests\Certificacion;

use App\Models\DocumentoAcademico;
use App\Rules\TipoDocumentoAcademicoCatalogoRule;
use App\Services\DocumentosAcademicos\DocumentoAcademicoTipoService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdateDocumentoAcademicoRequest extends FormRequest
{
    public function authorize(): bool
    {
        $doc = $this->route('documento');

        return $doc instanceof DocumentoAcademico
            ? $this->user()?->can('update', $doc) ?? false
            : false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'tipo_documento' => ['sometimes', 'string', 'max:64', new TipoDocumentoAcademicoCatalogoRule()],
            'tipo_certificacion' => ['sometimes', 'nullable', 'string', 'max:50'],
            'metadata' => ['sometimes', 'array'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v): void {
            if (! $this->has('tipo_documento')) {
                return;
            }

            $doc = $this->route('documento');
            if (! $doc instanceof DocumentoAcademico) {
                return;
            }

            $tipos = app(DocumentoAcademicoTipoService::class);
            if (! $tipos->documentoPermiteCambioTipoDocumento($doc)) {
                $v->errors()->add(
                    'tipo_documento',
                    'No es posible cambiar el tipo documental cuando el documento ya inició su flujo institucional.',
                );

                return;
            }

            $sub = $tipos->resolveSubsistemaClaveFromDocumento($doc);
            if ($sub === null) {
                $v->errors()->add(
                    'subsistema',
                    'No fue posible determinar el subsistema académico para este documento.',
                );

                return;
            }

            try {
                $tipos->validarTipoParaSubsistema((string) $this->input('tipo_documento'), $sub);
            } catch (\Illuminate\Validation\ValidationException $e) {
                foreach ($e->errors() as $field => $messages) {
                    foreach ($messages as $message) {
                        $v->errors()->add($field, $message);
                    }
                }
            }
        });
    }
}
