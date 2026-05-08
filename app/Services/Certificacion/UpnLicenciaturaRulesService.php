<?php

declare(strict_types=1);

namespace App\Services\Certificacion;

use App\Contracts\Certificacion\AcademicSubsistemaRulesContract;
use App\Models\Matricula;
use Illuminate\Validation\ValidationException;

/**
 * Reglamento de Estudios de Licenciatura — UPN (reglas académicas operativas en SICES).
 * No sustituye la normativa oficial completa; centraliza validaciones mínimas acordadas.
 */
final class UpnLicenciaturaRulesService implements AcademicSubsistemaRulesContract
{
    public const MOD_PRESENCIAL = 'presencial';

    public const MOD_SEMIPRESENCIAL = 'semipresencial';

    public const MOD_EN_LINEA = 'en_linea';

    public const META_ORIGEN_UPN = 'upn_control_escolar';

    public const MSG_EMISION_OFICIAL_BLOQUEADA = 'La emisión documental oficial UPN no está configurada. El expediente puede gestionarse académicamente, pero no emitirse oficialmente hasta cargar la especificación documental correspondiente.';

    public function claveSubsistema(): string
    {
        return 'UPN';
    }

    public function usaPatronMatriculaEducacionNormal2022(): bool
    {
        return false;
    }

    public function usaReferenciaInscripcionAnualNormal(): bool
    {
        return false;
    }

    public function modalidadesOperacionPermitidas(): array
    {
        return [self::MOD_PRESENCIAL, self::MOD_SEMIPRESENCIAL, self::MOD_EN_LINEA];
    }

    /**
     * Calificación entera 5–10; 6 mínimo aprobatorio; 5 no acreditada; N.P. no presentó (no acreditada).
     *
     * @param  array<string, mixed>  $payload
     */
    public function validarCapturaCalificacion(Matricula $matricula, array $payload): void
    {
        $txtRaw = trim((string) ($payload['calificacion_texto'] ?? ''));
        $txt = strtoupper(str_replace(' ', '', $txtRaw));

        if ($txt === 'N.P.' || $txt === 'NP') {
            return;
        }

        $cal = $payload['calificacion'] ?? $payload['calificacion_final'] ?? null;
        if ($cal === null || $cal === '') {
            if ($txtRaw !== '') {
                throw ValidationException::withMessages([
                    'calificacion' => ['UPN: use número entero de calificación o N.P. como texto controlado.'],
                ]);
            }

            return;
        }

        if (! is_numeric($cal)) {
            throw ValidationException::withMessages([
                'calificacion' => ['UPN: la calificación debe ser número entero (o N.P.).'],
            ]);
        }

        if ((float) $cal !== (float) (int) $cal) {
            throw ValidationException::withMessages([
                'calificacion' => ['UPN: la calificación debe ser número entero.'],
            ]);
        }

        $n = (int) $cal;
        if ($n < 5 || $n > 10) {
            throw ValidationException::withMessages([
                'calificacion' => ['UPN: la calificación entera debe estar entre 5 y 10.'],
            ]);
        }
    }

    public function validarAltaInscripcionPeriodo(Matricula $matricula, array $payload): void
    {
        // Punto de extensión: reinscripción por periodo y calendario UPN (no usar regla de inscripción anual Normal).
    }

    public function esCalificacionNoAcreditada(int $entero): bool
    {
        return $entero === 5;
    }

    public function esCalificacionAcreditada(int $entero): bool
    {
        return $entero >= 6 && $entero <= 10;
    }

    public function mensajeEmisionDocumentalNoDisponible(): ?string
    {
        return self::MSG_EMISION_OFICIAL_BLOQUEADA;
    }

    public function segundaLicenciaturaFlujoGeneralHabilitado(): bool
    {
        return false;
    }

    public function limitesExtraordinariosPorPeriodoEscolar(bool $autorizacionConsejoRegistrada): array
    {
        if ($autorizacionConsejoRegistrada) {
            return ['max_sin_autorizacion' => 4, 'maximo_absoluto' => 4];
        }

        return ['max_sin_autorizacion' => 2, 'maximo_absoluto' => 4];
    }

    /**
     * Plazo máximo para concluir: doble del término oficial del plan (en años aproximados por periodos).
     */
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

    /**
     * Validación mínima de modalidad en oferta/programa (metadata o campo modalidad).
     *
     * @param  array<string, mixed>|null  $metadataOferta
     */
    public function validarModalidadOferta(?string $modalidadOferta, ?array $metadataOferta): void
    {
        $mod = strtolower(trim((string) ($metadataOferta['modalidad_upn'] ?? $modalidadOferta ?? '')));
        if ($mod === '') {
            throw ValidationException::withMessages([
                'modalidad' => ['UPN: indique modalidad operativa (presencial, semipresencial o en línea).'],
            ]);
        }

        if (! in_array($mod, $this->modalidadesOperacionPermitidas(), true)) {
            throw ValidationException::withMessages([
                'modalidad' => ['UPN: modalidad no permitida para licenciatura (presencial, semipresencial, en línea).'],
            ]);
        }
    }

    /**
     * Extraordinarios en periodo escolar: cuenta registros en metadata.
     *
     * @param  list<array<string,mixed>>  $filasMateriasMetadata  lista de metadata de materias del periodo
     */
    public function validarTopeExtraordinarios(array $filasMateriasMetadata, bool $autorizacionRegistrada): void
    {
        $n = 0;
        foreach ($filasMateriasMetadata as $meta) {
            $tipo = strtolower((string) ($meta['tipo_evaluacion_upn'] ?? $meta['tipo_evaluacion'] ?? ''));
            if ($tipo === 'extraordinaria' || $tipo === 'extraordinario') {
                $n++;
            }
        }

        $limites = $this->limitesExtraordinariosPorPeriodoEscolar($autorizacionRegistrada);
        if ($n > $limites['maximo_absoluto']) {
            throw ValidationException::withMessages([
                'tipo_evaluacion' => ['UPN: máximo '.$limites['maximo_absoluto'].' extraordinarios por periodo escolar (Consejo Técnico puede autorizar hasta 4 en conjunto).'],
            ]);
        }

        if ($n > $limites['max_sin_autorizacion'] && ! $autorizacionRegistrada) {
            throw ValidationException::withMessages([
                'tipo_evaluacion' => ['UPN: sin autorización registrada solo se permiten hasta '.$limites['max_sin_autorizacion'].' extraordinarios por periodo.'],
            ]);
        }
    }

    public function validarPermanenciaLicenciatura(\DateTimeInterface $fechaIngreso, \DateTimeInterface $ahora, int $duracionPlanesPeriodosOficial): void
    {
        $tope = $this->plazoMaximoPermanenciaLicenciatura($fechaIngreso, $duracionPlanesPeriodosOficial);
        if ($tope !== null && $ahora > $tope) {
            throw ValidationException::withMessages([
                'matricula_id' => ['UPN: el plazo máximo de permanencia (doble del plan) parece excedido; revise baja temporal y reinscripciones.'],
            ]);
        }
    }

    public function validarBajaTemporalAcumulada(float $aniosAcumulados): void
    {
        if ($aniosAcumulados > $this->maximoAniosBajaTemporalAcumulados()) {
            throw ValidationException::withMessages([
                'estado' => ['UPN: la baja temporal no debe exceder dos años acumulados continua o discontinua sin autorización especial.'],
            ]);
        }
    }
}
