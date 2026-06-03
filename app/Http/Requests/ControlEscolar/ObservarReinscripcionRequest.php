<?php

declare(strict_types=1);

namespace App\Http\Requests\ControlEscolar;

use Illuminate\Foundation\Http\FormRequest;

class ObservarReinscripcionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('reinscripciones.observar') ?? false;
    }

    public function rules(): array
    {
        return [
            'motivo' => ['required', 'string', 'min:5', 'max:255'],
            'descripcion' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
