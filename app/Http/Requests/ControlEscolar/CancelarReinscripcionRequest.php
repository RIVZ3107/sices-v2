<?php

declare(strict_types=1);

namespace App\Http\Requests\ControlEscolar;

use Illuminate\Foundation\Http\FormRequest;

class CancelarReinscripcionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('reinscripciones.cancelar') ?? false;
    }

    public function rules(): array
    {
        return [
            'motivo' => ['required', 'string', 'min:5', 'max:255'],
        ];
    }
}
