<?php

declare(strict_types=1);

namespace App\Contracts\Certificacion;

use App\Models\DocumentoAcademico;
use App\Models\Matricula;

/**
 * Reglas académicas por subsistema (Normal 2022 vs UPN). Sin reglas “por defecto” globales peligrosas.
 */
interface AcademicSubsistemaRulesContract
{
    public function claveSubsistema(): string;

    /** Educación Normal Plan 2022 (patrones de ayuda / captura institucional). */
    public function usaPatronMatriculaEducacionNormal2022(): bool;

    public function usaReferenciaInscripcionAnualNormal(): bool;

    /** presencial | semipresencial | en_linea para UPN; vacío si no aplica. */
    public function modalidadesOperacionPermitidas(): array;

    /**
     * @param  array<string, mixed>  $payload  datos validados de materia cursada (calificacion, calificacion_texto, tipo_evaluacion, metadata…)
     */
    public function validarCapturaCalificacion(Matricula $matricula, array $payload): void;

    /**
     * Alta de inscripción por periodo (integración de flujo; Normal vs UPN sin mezclar reglas).
     *
     * @param  array<string, mixed>  $payload  datos ya validados del request de inscripción
     */
    public function validarAltaInscripcionPeriodo(Matricula $matricula, array $payload): void;

    /**
     * Oferta institucional: modalidad SEP (campo modalidad) vs operación UPN (metadata).
     */
    public function validarModalidadOferta(?string $modalidadOferta, ?array $metadataOferta): void;

    public function mensajeEmisionDocumentalNoDisponible(): ?string;

    /**
     * Segunda licenciatura / simultaneidad normativa UPN: sin flujo general aún.
     */
    public function segundaLicenciaturaFlujoGeneralHabilitado(): bool;

    /** @return array{max_sin_autorizacion:int,maximo_absoluto:int} */
    public function limitesExtraordinariosPorPeriodoEscolar(bool $autorizacionConsejoRegistrada): array;

    public function plazoMaximoPermanenciaLicenciatura(?\DateTimeInterface $fechaIngreso, int $duracionPlanesPeriodosOficial): ?\DateTimeInterface;

    public function maximoAniosBajaTemporalAcumulados(): int;
}
