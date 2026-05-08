<?php

declare(strict_types=1);

namespace App\Services\Certificacion;

use App\Models\DocumentoAcademico;
use App\Models\MateriaCursada;
use App\Models\Matricula;
use App\Models\User;
use Illuminate\Validation\ValidationException;

/**
 * Impide tramitar como certificado «oficial» documentos DEC asociados a matrícula con cargas
 * importadas en modo legacy controlado, hasta validación normativa explícita o permiso de excepción.
 */
class CertificacionImportacionLegacyNormativaGate
{
    public const META_ORIGEN_LEGACY = 'legacy_controlado';

    public const MATRICULA_META_KEY = 'historico_importacion_legacy';

    public const ESTADO_PENDIENTE_VALIDACION = 'pendiente_validacion_normativa';

    public const ESTADO_VALIDADO_NORMATIVAMENTE = 'validado_normativamente';

    public const ESTADO_RECHAZADO_NORMATIVAMENTE = 'rechazado_normativamente';

    /** @throws ValidationException */
    public function asegurarMatriculaListaParaCertificadoOficial(
        ?Matricula $matricula,
        ?int $usuarioId,
        string $pasoWorkflow,
    ): void {
        if ($matricula === null) {
            return;
        }

        $mensaje = $this->mensajeSiImpedeCertificadoOficial($matricula, $usuarioId);
        if ($mensaje !== null) {
            throw ValidationException::withMessages([
                'matricula_id' => [
                    $mensaje.' ('.$pasoWorkflow.')',
                ],
            ]);
        }
    }

    /** @throws ValidationException */
    public function asegurarDocumentoListaParaCertificadoOficial(DocumentoAcademico $documento, ?int $usuarioId): void
    {
        $documento->loadMissing('matricula');
        $this->asegurarMatriculaListaParaCertificadoOficial($documento->matricula, $usuarioId, 'documento_'.$documento->id);
    }

    public static function marcarMatriculaPorImportLegacy(
        Matricula $matricula,
        string $motivo,
        int $importacionId,
        ?int $importadoPorUserId = null,
    ): void {
        $prev = (array) (data_get($matricula->metadata, self::MATRICULA_META_KEY) ?? []);

        $importacionesIds = array_values(array_unique(array_merge(
            (array) ($prev['importaciones_ids'] ?? []),
            [$importacionId],
        )));

        $bucket = array_merge($prev, [
            'estado' => self::ESTADO_PENDIENTE_VALIDACION,
            'motivo_ultimo_forzado' => $motivo,
            'importaciones_ids' => $importacionesIds,
            'marcado_en' => now()->toIso8601String(),
            'ultima_importacion_id' => $importacionId,
        ]);

        if ($importadoPorUserId !== null && $importadoPorUserId > 0) {
            $bucket['usuario_importador_id'] = $importadoPorUserId;
        }

        $meta = array_merge((array) ($matricula->metadata ?? []), [
            self::MATRICULA_META_KEY => $bucket,
        ]);

        $matricula->forceFill(['metadata' => $meta])->save();
    }

    public function mensajeSiImpedeCertificadoOficial(?Matricula $matricula, ?int $usuarioId): ?string
    {
        if ($matricula === null) {
            return null;
        }

        if ($this->usuarioTieneBypassCertificadoLegacy($usuarioId)) {
            return null;
        }

        $estado = (string) data_get($matricula->metadata, self::MATRICULA_META_KEY.'.estado');

        if ($estado === self::ESTADO_PENDIENTE_VALIDACION) {
            return 'La matrícula tiene importación histórica legacy pendiente de validación normativa por Educación Superior.';
        }

        if ($estado === self::ESTADO_RECHAZADO_NORMATIVAMENTE) {
            return 'La validación normativa de la importación legacy fue rechazada; debe corregirse la carga académica antes de certificar oficialmente.';
        }

        if ($estado === self::ESTADO_VALIDADO_NORMATIVAMENTE) {
            return null;
        }

        if ($this->matriculaTieneMateriasLegacyControlado($matricula)) {
            return 'Existen materias cursadas marcadas como «legacy_controlado» sin validación normativa registrada en la matrícula.';
        }

        return null;
    }

    private function usuarioTieneBypassCertificadoLegacy(?int $usuarioId): bool
    {
        if ($usuarioId === null || $usuarioId <= 0) {
            return false;
        }

        $usuario = User::query()->find($usuarioId);

        return $usuario?->can('emitir_certificado_oficial_legacy_sin_validacion_normativa') === true;
    }

    private function matriculaTieneMateriasLegacyControlado(Matricula $matricula): bool
    {
        return MateriaCursada::query()
            ->where('matricula_id', $matricula->id)
            ->where('metadata->origen', self::META_ORIGEN_LEGACY)
            ->exists();
    }
}
