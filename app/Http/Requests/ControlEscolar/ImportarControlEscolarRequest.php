<?php

declare(strict_types=1);

namespace App\Http\Requests\ControlEscolar;

use Illuminate\Foundation\Http\FormRequest;

class ImportarControlEscolarRequest extends FormRequest
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
            'curp' => ['nullable', 'string', 'size:18', 'required_without:matricula'],
            'matricula' => ['nullable', 'string', 'max:64', 'required_without:curp'],
        ];
    }
}
