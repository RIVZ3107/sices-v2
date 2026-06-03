<?php

declare(strict_types=1);

namespace App\Http\Requests\ControlEscolar;

use Illuminate\Foundation\Http\FormRequest;

class CompletarReinscripcionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('reinscripciones.completar') ?? false;
    }

    public function rules(): array
    {
        return [
            'comentario' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
