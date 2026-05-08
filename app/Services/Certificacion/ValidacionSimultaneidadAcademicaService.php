<?php

declare(strict_types=1);

namespace App\Services\Certificacion;

use App\Models\Alumno;
use App\Models\InscripcionPeriodo;
use App\Models\Matricula;
use Illuminate\Validation\ValidationException;

class ValidacionSimultaneidadAcademicaService
{
    /**
     * @return list<string>
     */
    public function estadosMatriculaActivos(): array
    {
        return ['activa', 'suspendida'];
    }

    /**
     * @return list<string>
     */
    public function estadosInscripcionActivos(): array
    {
        return ['inscrita', 'cursando'];
    }

    public function alumnoTieneMatriculaActiva(Alumno $alumno, ?int $exceptMatriculaId = null): bool
    {
        return Matricula::query()
            ->where('alumno_id', $alumno->id)
            ->when($exceptMatriculaId !== null, fn ($q) => $q->whereKeyNot($exceptMatriculaId))
            ->whereIn('estado', $this->estadosMatriculaActivos())
            ->exists();
    }

    public function alumnoTieneInscripcionActivaEnCiclo(
        Alumno $alumno,
        int $cicloEscolarId,
        ?int $exceptInscripcionId = null
    ): bool {
        return InscripcionPeriodo::query()
            ->where('ciclo_escolar_id', $cicloEscolarId)
            ->whereIn('estatus', $this->estadosInscripcionActivos())
            ->whereHas('matricula', function ($q) use ($alumno): void {
                $q->where('alumno_id', $alumno->id)
                    ->whereIn('estado', $this->estadosMatriculaActivos());
            })
            ->when($exceptInscripcionId !== null, fn ($q) => $q->whereKeyNot($exceptInscripcionId))
            ->exists();
    }

    /**
     * @param  array<string,mixed>  $data
     */
    public function validarNuevaMatricula(Alumno $alumno, array $data): void
    {
        $estado = strtolower((string) ($data['estado'] ?? 'activa'));
        if (! in_array($estado, $this->estadosMatriculaActivos(), true)) {
            return;
        }

        if ($this->alumnoTieneMatriculaActiva($alumno)) {
            throw ValidationException::withMessages([
                'alumno_id' => [
                    'El alumno ya tiene una matrícula activa. Debe concluirse, cancelarse o darse de baja antes de registrar una nueva matrícula.',
                ],
            ]);
        }
    }

    public function validarCambioEstatusMatricula(Matricula $matricula, string $nuevoEstatus): void
    {
        $estado = strtolower(trim($nuevoEstatus));
        if (! in_array($estado, $this->estadosMatriculaActivos(), true)) {
            return;
        }

        $alumno = $matricula->alumno()->first();
        if ($alumno === null) {
            return;
        }

        if ($this->alumnoTieneMatriculaActiva($alumno, (int) $matricula->id)) {
            throw ValidationException::withMessages([
                'estado' => [
                    'El alumno ya tiene otra matrícula activa. Debe concluirse, cancelarse o darse de baja antes de activar esta matrícula.',
                ],
            ]);
        }
    }

    public function validarNuevaInscripcionPeriodo(
        Matricula $matricula,
        int $cicloEscolarId,
        ?int $exceptInscripcionId = null
    ): void {
        $alumno = $matricula->alumno()->first();
        if ($alumno === null) {
            return;
        }

        if ($this->alumnoTieneInscripcionActivaEnCiclo($alumno, $cicloEscolarId, $exceptInscripcionId)) {
            throw ValidationException::withMessages([
                'ciclo_escolar_id' => [
                    'El alumno ya tiene una inscripción activa en el ciclo escolar seleccionado. No puede estar activo en Normal y UPN dentro del mismo ciclo.',
                ],
            ]);
        }
    }
}
