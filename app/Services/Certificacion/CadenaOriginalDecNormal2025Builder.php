<?php

declare(strict_types=1);

namespace App\Services\Certificacion;

use Illuminate\Validation\ValidationException;

class CadenaOriginalDecNormal2025Builder
{
    /**
     * @param  array<string, mixed>  $payload
     */
    public function build(array $payload): string
    {
        $partes = [];

        $partes[] = $this->norm((string) ($payload['Dec']['version'] ?? ''));
        $partes[] = $this->norm((string) ($payload['Dec']['tipoCertificado'] ?? ''));

        $partes[] = $this->norm((string) ($payload['ServicioFirmante']['servicio'] ?? ''));
        $partes[] = $this->norm((string) ($payload['ServicioFirmante']['idEntidad'] ?? ''));

        $partes[] = $this->norm((string) ($payload['FirmaResponsable']['curp'] ?? ''));
        $partes[] = $this->norm((string) ($payload['FirmaResponsable']['cargo'] ?? ''));

        $partes[] = $this->norm((string) ($payload['ServicioEducativo']['nombreSecretariaInstituto'] ?? ''));
        $partes[] = $this->norm((string) ($payload['ServicioEducativo']['nombreEscuelaDependencia'] ?? ''));
        $partes[] = $this->norm((string) ($payload['ServicioEducativo']['cct'] ?? ''));
        $partes[] = $this->norm((string) ($payload['ServicioEducativo']['nombreEscuelaDesaparecida'] ?? ''));
        $partes[] = $this->norm((string) ($payload['ServicioEducativo']['cctDesaparecida'] ?? ''));
        $partes[] = $this->norm((string) ($payload['ServicioEducativo']['claveInstitucion'] ?? ''));
        $partes[] = $this->norm((string) ($payload['ServicioEducativo']['idEntidadFederativa'] ?? ''));
        $partes[] = $this->norm((string) ($payload['ServicioEducativo']['idMunicipio'] ?? ''));
        $partes[] = $this->norm((string) ($payload['ServicioEducativo']['estatusEscuela'] ?? ''));

        $partes[] = $this->norm((string) ($payload['Carrera']['claveCarrera'] ?? ''));
        $partes[] = $this->norm((string) ($payload['Carrera']['carrera'] ?? ''));
        $partes[] = $this->norm((string) ($payload['Carrera']['idModalidad'] ?? ''));
        $partes[] = $this->norm((string) ($payload['Carrera']['planEstudios'] ?? ''));

        $partes[] = $this->norm((string) ($payload['Alumno']['curp'] ?? ''));
        $partes[] = $this->norm((string) ($payload['Alumno']['nombre'] ?? ''));
        $partes[] = $this->norm((string) ($payload['Alumno']['primerApellido'] ?? ''));
        $partes[] = $this->norm((string) ($payload['Alumno']['segundoApellido'] ?? ''));
        $partes[] = $this->norm((string) ($payload['Alumno']['idGenero'] ?? ''));

        $partes[] = $this->norm((string) ($payload['Acreditacion']['idTipoCertificacion'] ?? ''));
        $partes[] = $this->norm((string) ($payload['Acreditacion']['fechaExpedicion'] ?? ''));
        $partes[] = $this->norm((string) ($payload['Acreditacion']['asignaturasCursadas'] ?? ''));
        $partes[] = $this->norm((string) ($payload['Acreditacion']['asignaturasTotal'] ?? ''));
        $partes[] = $this->norm((string) ($payload['Acreditacion']['creditosTotales'] ?? ''));
        $partes[] = $this->norm((string) ($payload['Acreditacion']['promedioAprovechamiento'] ?? ''));

        $asignaturas = $payload['AsignaturasCursos']['AsignaturaCurso'] ?? [];
        if (is_array($asignaturas)) {
            foreach ($asignaturas as $asignatura) {
                $partes[] = $this->norm((string) ($asignatura['clave'] ?? ''));
                $partes[] = $this->norm((string) ($asignatura['calificacionFinal'] ?? ''));
                $partes[] = $this->norm((string) ($asignatura['semestre'] ?? ''));
                $partes[] = $this->norm((string) ($asignatura['periodo'] ?? ''));
            }
        }

        return '||'.implode('|', $partes).'||';
    }

    private function norm(string $value): string
    {
        if (str_contains($value, '|')) {
            throw ValidationException::withMessages([
                'cadena_original' => ['La cadena DEC no permite pipes (|) dentro de los valores del payload.'],
            ]);
        }
        $value = preg_replace('/[\t\r\n]+/', ' ', $value) ?? $value;
        $value = preg_replace('/\s+/', ' ', $value) ?? $value;

        return trim($value);
    }
}
