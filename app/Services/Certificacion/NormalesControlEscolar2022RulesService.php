<?php

declare(strict_types=1);

namespace App\Services\Certificacion;

use App\Contracts\Certificacion\AcademicSubsistemaRulesContract;
use App\Models\DocumentoAcademico;
use App\Models\Matricula;
use Illuminate\Validation\ValidationException;

/**
 * Normas de Control Escolar — Licenciaturas de Formación de Maestras y Maestros (Planes 2022, modalidad escolarizada).
 * No aplicar estos criterios a UPN.
 */
final class NormalesControlEscolar2022RulesService implements AcademicSubsistemaRulesContract
{
    public function claveSubsistema(): string
    {
        return 'NORMAL';
    }

    public function usaPatronMatriculaEducacionNormal2022(): bool
    {
        return true;
    }

    public function usaReferenciaInscripcionAnualNormal(): bool
    {
        return true;
    }

    public function modalidadesOperacionPermitidas(): array
    {
        return ['escolarizada', 'escolarizado'];
    }

    public function validarCapturaCalificacion(Matricula $matricula, array $payload): void
    {
        $cal = $payload['calificacion'] ?? $payload['calificacion_final'] ?? null;
        if ($cal === null || $cal === '') {
            return;
        }
        $num = is_numeric($cal) ? (float) $cal : null;
        if ($num === null) {
            throw ValidationException::withMessages([
                'calificacion' => ['La calificación debe ser numérica en el esquema del plantel (Educación Normal).'],
            ]);
        }
        if ($num < 0 || $num > 10) {
            throw ValidationException::withMessages([
                'calificacion' => ['La calificación debe estar en el rango institucional habitual (0–10).'],
            ]);
        }
    }

    public function validarAltaInscripcionPeriodo(Matricula $matricula, array $payload): void
    {
        // Punto de extensión: calendario escolarizado / referencia anual Plan 2022 (no aplicar a UPN).
    }

    public function validarModalidadOferta(?string $modalidadOferta, ?array $metadataOferta): void
    {
        $modSep = strtolower(trim((string) $modalidadOferta));
        if ($modSep === '') {
            throw ValidationException::withMessages([
                'modalidad' => ['Educación Normal: la oferta debe declarar modalidad SEP (escolarizada, mixta o no escolarizada).'],
            ]);
        }

        $sepEnum = ['escolarizada', 'mixta', 'no_escolarizada'];
        if (! in_array($modSep, $sepEnum, true)) {
            throw ValidationException::withMessages([
                'modalidad' => ['Educación Normal: modalidad de oferta debe ser una de las previstas por el modelo (escolarizada, mixta o no escolarizada).'],
            ]);
        }

        unset($metadataOferta);
    }

    public function mensajeEmisionDocumentalNoDisponible(): ?string
    {
        return null;
    }

    public function segundaLicenciaturaFlujoGeneralHabilitado(): bool
    {
        return false;
    }

    public function limitesExtraordinariosPorPeriodoEscolar(bool $autorizacionConsejoRegistrada): array
    {
        return ['max_sin_autorizacion' => 99, 'maximo_absoluto' => 99];
    }

    public function plazoMaximoPermanenciaLicenciatura(?\DateTimeInterface $fechaIngreso, int $duracionPlanesPeriodosOficial): ?\DateTimeInterface
    {
        if ($fechaIngreso === null || $duracionPlanesPeriodosOficial <= 0) {
            return null;
        }

        $aniosNominalesPlan = max(0.5, $duracionPlanesPeriodosOficial / 2.0);
        $aniosMaximos = (int) ceil($aniosNominalesPlan * 2);

        return (clone \DateTimeImmutable::createFromInterface($fechaIngreso))->modify('+'.$aniosMaximos.' years');
    }

    public function maximoAniosBajaTemporalAcumulados(): int
    {
        return 2;
    }

    public static function assertDocumentoInstitucionalNormales(DocumentoAcademico $documento): void
    {
        // Punto de extensión: validaciones documentales específicas Normal (sin SEP real aquí).
        $documento->loadMissing('subsistema');
        if (strtoupper((string) ($documento->subsistema?->clave ?? '')) !== 'NORMAL') {
            throw ValidationException::withMessages([
                'subsistema_id' => ['Este documento no está asociado a Educación Normal.'],
            ]);
        }
    }
}
