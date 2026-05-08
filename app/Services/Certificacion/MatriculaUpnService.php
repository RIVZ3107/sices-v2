<?php

declare(strict_types=1);

namespace App\Services\Certificacion;

use App\Models\Matricula;
use Illuminate\Support\Facades\Config;

/**
 * Matrícula UPN: unicidad global SICES y captura controlada sin inventar patrón oficial SEP.
 */
final class MatriculaUpnService
{
    public const META_ORIGEN_KEY = 'origen';

    public const META_ORIGEN_UPN = UpnLicenciaturaRulesService::META_ORIGEN_UPN;

    /**
     * Fusiona metadata de origen UPN y opcionalmente valida patrón si existe configuración explícita.
     *
     * @param  array<string, mixed>  $metadata
     */
    public function prepararMetadataUpn(array $metadata): array
    {
        $metadata[self::META_ORIGEN_KEY] = self::META_ORIGEN_UPN;

        return $metadata;
    }

    public function debeGenerarAutomaticamente(): bool
    {
        return Config::get('certificacion.upn.generar_matricula_automatica', false) === true
            && trim((string) Config::get('certificacion.upn.patron_matricula_regex', '')) !== '';
    }

    /**
     * Si hay patrón configurado y generación activa, devuelve clave; si no, null (captura manual controlada).
     */
    public function generarClaveSiConfigurada(Matricula $matricula): ?string
    {
        if (! $this->debeGenerarAutomaticamente()) {
            return null;
        }

        return null;
    }

    public function validarUnicidadGlobal(string $claveMatricula, ?int $exceptoMatriculaId = null): void
    {
        $q = Matricula::query()->where('matricula', $claveMatricula);
        if ($exceptoMatriculaId !== null) {
            $q->whereKeyNot($exceptoMatriculaId);
        }
        if ($q->exists()) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'matricula' => ['La matrícula ya existe en el sistema (regla de unicidad global SICES).'],
            ]);
        }
    }
}
