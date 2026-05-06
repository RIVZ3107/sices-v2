<?php

declare(strict_types=1);

namespace App\Http\Requests\Certificacion;

use App\Services\Certificacion\IdentificadorAlumnoService;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAlumnoCapturaRequest extends FormRequest
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
            'curp' => ['sometimes', 'string', 'max:18', Rule::unique('alumnos', 'curp')->ignore($this->route('alumno'))],
            'rfc' => ['nullable', 'string', 'max:13'],
            'nombre' => ['sometimes', 'string', 'max:120'],
            'primer_apellido' => ['sometimes', 'string', 'max:120'],
            'segundo_apellido' => ['nullable', 'string', 'max:120'],
            'fecha_nacimiento' => ['nullable', 'date'],
            'genero' => ['nullable', 'string', 'max:20'],
            'nacionalidad' => ['nullable', 'string', 'max:80'],
            'estatus' => ['sometimes', 'string', 'max:30'],
            'metadata' => ['nullable', 'array'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v): void {
            $ident = app(IdentificadorAlumnoService::class);
            if ($this->filled('curp')) {
                $curpOk = $ident->validarCurpOExtranjero((string) $this->input('curp'));
                if ($curpOk['ok'] !== true) {
                    foreach ($curpOk['errores'] as $msg) {
                        $v->errors()->add('curp', $msg);
                    }
                }
            }
            if ($this->has('rfc')) {
                $rfcOk = $ident->validarRfcPersonaFisicaOpcional($this->input('rfc'));
                if ($rfcOk['ok'] !== true) {
                    foreach ($rfcOk['errores'] as $msg) {
                        $v->errors()->add('rfc', $msg);
                    }
                }
            }
        });
    }
}
