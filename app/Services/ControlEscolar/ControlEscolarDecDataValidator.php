<?php

declare(strict_types=1);

namespace App\Services\ControlEscolar;

use App\Models\DocumentoAcademico;
use App\Models\DocumentoMateriaSnapshot;
use App\Models\MateriaCursada;
use App\Models\Matricula;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

class ControlEscolarDecDataValidator
{
    /**
     * @return list<string>
     */
    public function validarDocumento(DocumentoAcademico $documento): array
    {
        $documento->loadMissing([
            'alumno',
            'matricula.ofertaAcademica.programaEstudio',
            'matricula.ofertaAcademica.planEstudio',
            'sede',
            'institucion',
            'materiasSnapshot',
        ]);

        $errores = [];

        $alumno = $documento->alumno;
        if ($alumno === null) {
            $errores[] = 'Falta alumno asociado al documento.';
        } else {
            if (strlen(trim((string) $alumno->curp)) !== 18) {
                $errores[] = 'CURP incompleta o inválida (se requieren 18 caracteres).';
            }
            if (trim((string) $alumno->nombre) === '') {
                $errores[] = 'Nombre del alumno obligatorio.';
            }
            if (trim((string) $alumno->primer_apellido) === '') {
                $errores[] = 'Primer apellido del alumno obligatorio.';
            }
        }

        if ($documento->matricula_id === null) {
            $errores[] = 'Matrícula obligatoria.';
        }

        if ($documento->institucion_id === null) {
            $errores[] = 'Institución obligatoria.';
        }

        if ($documento->sede_id === null) {
            $errores[] = 'Sede obligatoria.';
        } else {
            $cct = trim((string) ($documento->sede?->clave ?? ''));
            if ($cct === '') {
                $errores[] = 'Sede/CCT obligatorio.';
            }
        }

        if ($documento->oferta_academica_id === null) {
            $errores[] = 'Oferta académica / carrera obligatoria.';
        }

        if (trim((string) $documento->tipo_documento) === '') {
            $errores[] = 'Tipo de documento obligatorio.';
        }

        if ($documento->materiasSnapshot->isEmpty()) {
            $errores[] = 'El documento no tiene snapshot de materias congelado.';
        } else {
            $errores = array_merge($errores, $this->validarMateriasSnapshot($documento->materiasSnapshot));
        }

        return $errores;
    }

    /**
     * @return list<string>
     */
    public function validarMatricula(Matricula $matricula): array
    {
        $matricula->loadMissing(['alumno', 'materiasCursadas', 'trayectoriaAcademica', 'ofertaAcademica']);

        $errores = [];
        $alumno = $matricula->alumno;
        if ($alumno === null) {
            $errores[] = 'Matrícula sin alumno.';
        } elseif (strlen(trim((string) $alumno->curp)) !== 18) {
            $errores[] = 'CURP incompleta en matrícula.';
        }

        if (trim((string) $matricula->matricula) === '') {
            $errores[] = 'Número de matrícula vacío.';
        }

        if ($matricula->materiasCursadas->isEmpty()) {
            $errores[] = 'La matrícula no tiene materias cursadas.';
        } else {
            $errores = array_merge($errores, $this->validarMateriasCursadas($matricula->materiasCursadas));
        }

        return $errores;
    }

    /**
     * @throws ValidationException
     */
    public function assertDocumentoListo(DocumentoAcademico $documento): void
    {
        $errores = $this->validarDocumento($documento);
        if ($errores !== []) {
            throw ValidationException::withMessages(['dec_validacion' => $errores]);
        }
    }

    /**
     * @param  Collection<int, DocumentoMateriaSnapshot>  $materias
     * @return list<string>
     */
    protected function validarMateriasSnapshot(Collection $materias): array
    {
        $errores = [];
        $claves = [];

        foreach ($materias as $idx => $materia) {
            $clave = trim((string) $materia->clave);
            if ($clave === '') {
                $errores[] = "Materia snapshot #{$idx}: clave obligatoria.";
            }
            if (trim((string) $materia->nombre) === '') {
                $errores[] = "Materia {$clave}: nombre obligatorio.";
            }
            $calificacion = $materia->calificacion ?? $materia->calificacion_final;
            if ($calificacion === null || trim((string) $calificacion) === '') {
                $errores[] = "Materia {$clave}: calificación obligatoria.";
            }
            if ($materia->periodo === null && $materia->semestre === null) {
                $errores[] = "Materia {$clave}: periodo o semestre curricular obligatorio (sin default semestre=1).";
            }
            if ($clave !== '') {
                $dupKey = $clave.'|'.($materia->semestre ?? '').'|'.($materia->periodo ?? '');
                if (isset($claves[$dupKey])) {
                    $errores[] = "Materia duplicada peligrosa: {$clave} en el mismo periodo/semestre.";
                }
                $claves[$dupKey] = true;
            }
        }

        return $errores;
    }

    /**
     * @param  Collection<int, MateriaCursada>  $materias
     * @return list<string>
     */
    public function validarMateriasCursadas(Collection $materias): array
    {
        $errores = [];

        foreach ($materias as $materia) {
            $clave = trim((string) $materia->clave);
            if ($clave === '') {
                $errores[] = 'Existe materia cursada sin clave.';
            }
            if ($materia->calificacion === null && $materia->calificacion_texto === null) {
                $errores[] = "Materia {$clave}: calificación obligatoria.";
            }
            if ($materia->periodo === null
                && $materia->semestre === null
                && $materia->numero_periodo_curricular === null) {
                $errores[] = "Materia {$clave}: periodo o semestre curricular obligatorio.";
            }
        }

        return $errores;
    }
}
