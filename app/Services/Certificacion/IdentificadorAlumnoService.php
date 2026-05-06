<?php

declare(strict_types=1);

namespace App\Services\Certificacion;

use App\Models\Alumno;

/**
 * Normalización de identificadores de persona sin asumir reglas SEP finales.
 */
class IdentificadorAlumnoService
{
    public const CURP_EXTRANJERO = 'EXTRANJERO';

    /**
     * Aplica mayúsculas, recorte y derivación de segmentos derivados (no editables en UI).
     */
    public function aplicarAlModelo(Alumno $alumno): void
    {
        $curp = $this->normalizarCurp((string) $alumno->curp);
        $alumno->curp = $curp;
        $this->derivarCurp($alumno);

        if ($alumno->rfc !== null && trim((string) $alumno->rfc) !== '') {
            $rfc = $this->normalizarRfc((string) $alumno->rfc);
            $alumno->rfc = $rfc;
            $this->derivarRfc($alumno);
        } else {
            $alumno->rfc = null;
            $alumno->rfc_raiz = null;
            $alumno->rfc_homoclave = null;
        }
    }

    public function normalizarCurp(string $curp): string
    {
        $sinEspacios = preg_replace('/\s+/', '', trim($curp));
        $curp = strtoupper(is_string($sinEspacios) ? $sinEspacios : trim($curp));
        if ($curp === self::CURP_EXTRANJERO) {
            return self::CURP_EXTRANJERO;
        }

        return $curp;
    }

    public function normalizarRfc(string $rfc): string
    {
        $sinEspacios = preg_replace('/\s+/', '', trim($rfc));

        return strtoupper(is_string($sinEspacios) ? $sinEspacios : trim($rfc));
    }

    /**
     * @return array{ok: bool, errores: list<string>}
     */
    public function validarCurpOExtranjero(string $curp): array
    {
        $curp = $this->normalizarCurp($curp);
        if ($curp === self::CURP_EXTRANJERO) {
            return ['ok' => true, 'errores' => []];
        }
        if (strlen($curp) !== 18) {
            return ['ok' => false, 'errores' => ['La CURP debe tener 18 caracteres o utilizarse el valor controlado EXTRANJERO.']];
        }
        if (! preg_match('/^[A-Z0-9]{18}$/', $curp)) {
            return ['ok' => false, 'errores' => ['La CURP contiene caracteres no permitidos (solo A-Z y 0-9).']];
        }

        return ['ok' => true, 'errores' => []];
    }

    /**
     * @return array{ok: bool, errores: list<string>}
     */
    public function validarRfcPersonaFisicaOpcional(?string $rfc): array
    {
        if ($rfc === null || trim($rfc) === '') {
            return ['ok' => true, 'errores' => []];
        }
        $rfc = $this->normalizarRfc($rfc);
        if (strlen($rfc) !== 13) {
            return ['ok' => false, 'errores' => ['El RFC de persona física debe tener 13 caracteres.']];
        }
        if (! preg_match('/^[A-ZÑ&]{4}\d{6}[A-Z0-9]{3}$/', $rfc)) {
            return ['ok' => false, 'errores' => ['El RFC no cumple el patrón básico de persona física (validación interna, no fiscal).']];
        }

        return ['ok' => true, 'errores' => []];
    }

    protected function derivarCurp(Alumno $alumno): void
    {
        if ($alumno->curp === self::CURP_EXTRANJERO) {
            $alumno->curp_raiz = null;
            $alumno->curp_digito = null;

            return;
        }
        if (strlen($alumno->curp) === 18) {
            $alumno->curp_raiz = substr($alumno->curp, 0, 16);
            $alumno->curp_digito = substr($alumno->curp, 16, 2);

            return;
        }
        $alumno->curp_raiz = null;
        $alumno->curp_digito = null;
    }

    protected function derivarRfc(Alumno $alumno): void
    {
        $rfc = (string) $alumno->rfc;
        if (strlen($rfc) === 13) {
            $alumno->rfc_raiz = substr($rfc, 0, 10);
            $alumno->rfc_homoclave = substr($rfc, 10, 3);

            return;
        }

        $alumno->rfc_raiz = null;
        $alumno->rfc_homoclave = null;
    }
}
