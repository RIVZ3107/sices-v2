<?php

declare(strict_types=1);

namespace App\Http\Requests\ControlEscolar;

use Illuminate\Foundation\Http\FormRequest;

class ExpedienteMasivoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'ids' => ['required', 'array', 'min:1', 'max:50'],
            'ids.*' => ['integer', 'min:1'],
            'motivo' => ['nullable', 'string', 'min:5', 'max:255'],
            'descripcion' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
