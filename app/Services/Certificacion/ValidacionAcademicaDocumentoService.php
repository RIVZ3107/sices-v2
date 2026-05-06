<?php

declare(strict_types=1);

namespace App\Services\Certificacion;

use App\Enums\Certificacion\EstadoWorkflow;
use App\Models\DocumentoAcademico;
use App\Models\MateriaCursada;
use App\Models\Matricula;
use App\Models\OfertaAcademica;
use App\Models\TrayectoriaAcademica;

class ValidacionAcademicaDocumentoService
{
    public function __construct(
        protected IdentificadorAlumnoService $identificadores,
    ) {}

    /**
     * @return array{ok: bool, errores: list<string>, advertencias: list<string>}
     */
    public function validarParaRevision(DocumentoAcademico $documento): array
    {
        $secciones = [
            $this->validarDocumentoDuplicado($documento),
            $this->validarDatosAlumno($documento),
            $this->validarMatricula($documento),
            $this->validarMatriculaUnica($documento),
            $this->validarOfertaAcademica($documento),
            $this->validarProgramaPlan($documento),
            $this->validarMaterias($documento),
            $this->validarTrayectoria($documento),
        ];

        return $this->combinar($secciones);
    }

    /**
     * @return array{ok: bool, errores: list<string>, advertencias: list<string>}
     */
    public function validarParaAprobacion(DocumentoAcademico $documento): array
    {
        $base = $this->validarParaRevision($documento);
        $extra = $this->validarObservaciones($documento);
        $estado = $this->validarEstadoWorkflow($documento, EstadoWorkflow::EN_REVISION->value, 'El documento debe estar en revisión para aprobar.');

        return $this->combinar([$base, $extra, $estado]);
    }

    /**
     * @return array{ok: bool, errores: list<string>, advertencias: list<string>}
     */
    public function validarParaPrepararFirma(DocumentoAcademico $documento): array
    {
        $base = $this->combinar([
            $this->validarParaRevision($documento),
            $this->validarObservaciones($documento),
        ]);
        $estado = $this->validarEstadoWorkflow($documento, EstadoWorkflow::APROBADO->value, 'El documento debe estar aprobado para preparar firma.');

        $errores = [];
        if ($documento->folio_interno === null || trim((string) $documento->folio_interno) === '') {
            $errores[] = 'Debe existir folio interno asignado.';
        }
        if ($documento->token_consulta_publica === null || trim((string) $documento->token_consulta_publica) === '') {
            $errores[] = 'Debe existir token de consulta pública.';
        }

        return $this->combinar([
            $base,
            $estado,
            ['ok' => $errores === [], 'errores' => $errores, 'advertencias' => []],
        ]);
    }

    /**
     * @return array{ok: bool, errores: list<string>, advertencias: list<string>}
     */
    public function validarDatosAlumno(DocumentoAcademico $documento): array
    {
        $documento->loadMissing('alumno');
        $errores = [];
        $advertencias = [];

        if ($documento->alumno_id === null || $documento->alumno === null) {
            $errores[] = 'Debe seleccionarse un alumno válido.';

            return ['ok' => false, 'errores' => $errores, 'advertencias' => $advertencias];
        }

        $curp = trim((string) $documento->alumno->curp);
        if ($curp === '') {
            $errores[] = 'El alumno no tiene CURP registrada.';
        } elseif (strlen($curp) !== 18) {
            $advertencias[] = 'La CURP del alumno no tiene longitud estándar de 18 caracteres.';
        }

        if (trim((string) $documento->alumno->nombre) === '') {
            $errores[] = 'El alumno no tiene nombre registrado.';
        }
        if (trim((string) $documento->alumno->primer_apellido) === '') {
            $errores[] = 'El alumno no tiene primer apellido registrado.';
        }

        return ['ok' => $errores === [], 'errores' => $errores, 'advertencias' => $advertencias];
    }

    /**
     * @return array{ok: bool, errores: list<string>, advertencias: list<string>}
     */
    public function validarMatricula(DocumentoAcademico $documento): array
    {
        $errores = [];
        $advertencias = [];

        if ($documento->matricula_id === null) {
            $errores[] = 'Debe asociarse una matrícula al documento.';

            return ['ok' => false, 'errores' => $errores, 'advertencias' => $advertencias];
        }

        $matricula = Matricula::query()->find($documento->matricula_id);
        if ($matricula === null) {
            $errores[] = 'La matrícula asociada no existe.';

            return ['ok' => false, 'errores' => $errores, 'advertencias' => $advertencias];
        }

        if ($documento->alumno_id !== null && (int) $matricula->alumno_id !== (int) $documento->alumno_id) {
            $errores[] = 'La matrícula no corresponde al alumno del documento.';
        }

        if ($documento->ciclo_escolar_id !== null && (int) $matricula->ciclo_escolar_id !== (int) $documento->ciclo_escolar_id) {
            $errores[] = 'La matrícula no corresponde al ciclo escolar del documento.';
        }

        if ($documento->oferta_academica_id !== null && (int) $matricula->oferta_academica_id !== (int) $documento->oferta_academica_id) {
            $advertencias[] = 'La oferta académica del documento difiere de la oferta de la matrícula.';
        }

        return ['ok' => $errores === [], 'errores' => $errores, 'advertencias' => $advertencias];
    }

    /**
     * @return array{ok: bool, errores: list<string>, advertencias: list<string>}
     */
    public function validarOfertaAcademica(DocumentoAcademico $documento): array
    {
        $errores = [];
        $advertencias = [];

        if ($documento->oferta_academica_id === null) {
            $errores[] = 'Debe existir una oferta académica asociada.';

            return ['ok' => false, 'errores' => $errores, 'advertencias' => $advertencias];
        }

        $oferta = OfertaAcademica::query()->find($documento->oferta_academica_id);
        if ($oferta === null) {
            $errores[] = 'La oferta académica asociada no existe.';

            return ['ok' => false, 'errores' => $errores, 'advertencias' => $advertencias];
        }

        if ($documento->institucion_id !== null && (int) $oferta->institucion_id !== (int) $documento->institucion_id) {
            $advertencias[] = 'La institución del documento difiere de la institución de la oferta académica.';
        }

        if ($documento->sede_id !== null && (int) $oferta->sede_id !== (int) $documento->sede_id) {
            $advertencias[] = 'La sede del documento difiere de la sede de la oferta académica.';
        }

        if ($documento->ciclo_escolar_id !== null && $oferta->ciclo_escolar_id !== null && (int) $oferta->ciclo_escolar_id !== (int) $documento->ciclo_escolar_id) {
            $advertencias[] = 'El ciclo escolar del documento difiere del ciclo de la oferta académica.';
        }

        return ['ok' => $errores === [], 'errores' => $errores, 'advertencias' => $advertencias];
    }

    /**
     * @return array{ok: bool, errores: list<string>, advertencias: list<string>}
     */
    public function validarMaterias(DocumentoAcademico $documento): array
    {
        $errores = [];
        $advertencias = [];

        if ($documento->matricula_id === null) {
            return [
                'ok' => false,
                'errores' => ['No se puede validar materias sin matrícula asociada.'],
                'advertencias' => [],
            ];
        }

        $materias = MateriaCursada::query()->where('matricula_id', $documento->matricula_id)->get();
        if ($materias->count() < 1) {
            $errores[] = 'Debe existir al menos una materia cursada para el documento.';
        }

        $materiasAlumnoDesalineado = false;
        foreach ($materias as $materia) {
            if ($documento->alumno_id !== null && (int) $materia->alumno_id !== (int) $documento->alumno_id) {
                $materiasAlumnoDesalineado = true;
            }
            if ($materia->calificacion !== null) {
                $valor = (float) $materia->calificacion;
                if ($valor < 0 || $valor > 10) {
                    $advertencias[] = "La materia {$materia->clave} tiene calificación fuera del rango 0-10.";
                }
            } else {
                $advertencias[] = "La materia {$materia->clave} no tiene calificación numérica.";
            }
        }

        if ($materiasAlumnoDesalineado) {
            $errores[] = 'Al menos una materia cursada no corresponde al alumno del documento (consistencia alumno–matrícula).';
        }

        return ['ok' => $errores === [], 'errores' => $errores, 'advertencias' => array_values(array_unique($advertencias))];
    }

    /**
     * @return array{ok: bool, errores: list<string>, advertencias: list<string>}
     */
    public function validarTrayectoria(DocumentoAcademico $documento): array
    {
        $errores = [];
        $advertencias = [];

        if ($documento->matricula_id === null) {
            return [
                'ok' => false,
                'errores' => ['No se puede validar trayectoria sin matrícula asociada.'],
                'advertencias' => [],
            ];
        }

        $trayectoria = TrayectoriaAcademica::query()->where('matricula_id', $documento->matricula_id)->first();
        if ($trayectoria === null) {
            $errores[] = 'Debe registrarse trayectoria académica para la matrícula.';

            return ['ok' => false, 'errores' => $errores, 'advertencias' => $advertencias];
        }

        if ($trayectoria->promedio !== null) {
            $prom = (float) $trayectoria->promedio;
            if ($prom < 0 || $prom > 10) {
                $advertencias[] = 'El promedio de trayectoria está fuera de rango 0-10.';
            }
        } else {
            $advertencias[] = 'La trayectoria no tiene promedio registrado.';
        }

        if ($trayectoria->total_materias !== null && $trayectoria->materias_aprobadas !== null && $trayectoria->materias_reprobadas !== null) {
            $suma = (int) $trayectoria->materias_aprobadas + (int) $trayectoria->materias_reprobadas;
            if ($suma > (int) $trayectoria->total_materias) {
                $advertencias[] = 'La suma de aprobadas/reprobadas excede el total de materias en trayectoria.';
            }
        }

        if ($trayectoria->total_materias !== null && (int) $trayectoria->total_materias === 0) {
            $errores[] = 'La trayectoria académica no refleja materias consolidadas (total 0).';
        }

        return ['ok' => $errores === [], 'errores' => $errores, 'advertencias' => $advertencias];
    }

    /**
     * @return array{ok: bool, errores: list<string>, advertencias: list<string>}
     */
    public function validarAlumno(DocumentoAcademico $documento): array
    {
        return $this->validarDatosAlumno($documento);
    }

    /**
     * @return array{ok: bool, errores: list<string>, advertencias: list<string>}
     */
    public function validarCurpORExtranjero(DocumentoAcademico $documento): array
    {
        $documento->loadMissing('alumno');
        if ($documento->alumno === null) {
            return ['ok' => false, 'errores' => ['Sin alumno asociado.'], 'advertencias' => []];
        }

        $res = $this->identificadores->validarCurpOExtranjero((string) $documento->alumno->curp);

        return [
            'ok' => $res['ok'],
            'errores' => $res['ok'] ? [] : $res['errores'],
            'advertencias' => [],
        ];
    }

    /**
     * Valida ausencia de matrícula duplicada activa por alumno.
     *
     * @return array{ok: bool, errores: list<string>, advertencias: list<string>}
     */
    public function validarMatriculaUnica(DocumentoAcademico $documento): array
    {
        if ($documento->alumno_id === null) {
            return ['ok' => false, 'errores' => ['Falta alumno para validar unicidad de matrícula.'], 'advertencias' => []];
        }

        $n = Matricula::query()->where('alumno_id', $documento->alumno_id)->count();
        $errores = [];
        if ($n !== 1) {
            $errores[] = $n === 0
                ? 'El alumno no tiene una matrícula activa registrada.'
                : 'El alumno tiene más de una matrícula activa; debe haber exactamente una matrícula por alumno.';
        }

        return ['ok' => $errores === [], 'errores' => $errores, 'advertencias' => []];
    }

    /**
     * @return array{ok: bool, errores: list<string>, advertencias: list<string>}
     */
    public function validarProgramaPlan(DocumentoAcademico $documento): array
    {
        $errores = [];
        $advertencias = [];

        if ($documento->oferta_academica_id === null) {
            $errores[] = 'Debe existir oferta académica para validar programa y plan.';

            return ['ok' => false, 'errores' => $errores, 'advertencias' => $advertencias];
        }

        $oferta = OfertaAcademica::query()->find($documento->oferta_academica_id);
        if ($oferta === null) {
            $errores[] = 'La oferta académica asociada no existe.';

            return ['ok' => false, 'errores' => $errores, 'advertencias' => $advertencias];
        }

        if ($oferta->programa_estudio_id === null) {
            $errores[] = 'La oferta académica no tiene programa de estudio vinculado.';
        }
        if ($oferta->plan_estudio_id === null) {
            $errores[] = 'La oferta académica no tiene plan de estudio vinculado.';
        }

        return ['ok' => $errores === [], 'errores' => $errores, 'advertencias' => $advertencias];
    }

    /**
     * Evita duplicados de documento académico para el mismo contexto de captura.
     *
     * @return array{ok: bool, errores: list<string>, advertencias: list<string>}
     */
    public function validarDocumentoDuplicado(DocumentoAcademico $documento): array
    {
        $errores = [];

        if ($documento->alumno_id === null || $documento->matricula_id === null || $documento->ciclo_escolar_id === null) {
            return ['ok' => true, 'errores' => [], 'advertencias' => []];
        }

        $query = DocumentoAcademico::query()
            ->where('alumno_id', $documento->alumno_id)
            ->where('matricula_id', $documento->matricula_id)
            ->where('ciclo_escolar_id', $documento->ciclo_escolar_id)
            ->where('tipo_documento', $documento->tipo_documento)
            ->where('estado_workflow', '!=', EstadoWorkflow::CANCELADO->value);

        if ($documento->exists) {
            $query->whereKeyNot($documento->getKey());
        }

        if ($query->exists()) {
            $errores[] = 'Ya existe un documento académico no cancelado con el mismo alumno, matrícula, ciclo y tipo.';
        }

        return ['ok' => $errores === [], 'errores' => $errores, 'advertencias' => []];
    }

    /**
     * @return array{ok: bool, errores: list<string>, advertencias: list<string>}
     */
    public function validarParaCrearBorrador(DocumentoAcademico $documento): array
    {
        return $this->combinar([
            $this->validarDocumentoDuplicado($documento),
            $this->validarDatosAlumno($documento),
            $this->validarMatricula($documento),
            $this->validarMatriculaUnica($documento),
            $this->validarOfertaAcademica($documento),
            $this->validarProgramaPlan($documento),
            $this->validarMaterias($documento),
            $this->validarTrayectoria($documento),
        ]);
    }

    /**
     * @return array{ok: bool, errores: list<string>, advertencias: list<string>}
     */
    public function validarParaEnviarRevision(DocumentoAcademico $documento): array
    {
        return $this->validarParaRevision($documento);
    }

    /**
     * @return array{ok: bool, errores: list<string>, advertencias: list<string>}
     */
    public function validarParaGenerarCadena(DocumentoAcademico $documento): array
    {
        $base = $this->validarParaPrepararFirma($documento);
        $errores = $base['ok'] ? [] : $base['errores'];
        $errores[] = 'TODO técnico: validar reglas oficiales de cadena original / comparación legacy cuando esté disponible la especificación o XML de referencia.';

        return [
            'ok' => false,
            'errores' => array_values(array_unique($errores)),
            'advertencias' => $base['advertencias'],
        ];
    }

    /**
     * @return array{ok: bool, errores: list<string>, advertencias: list<string>}
     */
    public function validarParaGenerarXml(DocumentoAcademico $documento): array
    {
        $base = $this->validarParaPrepararFirma($documento);
        $errores = $base['ok'] ? [] : $base['errores'];
        $errores[] = 'TODO técnico: validar plantilla XSD / estructura XML oficial o payload comparado contra legacy antes de generar XML productivo.';

        return [
            'ok' => false,
            'errores' => array_values(array_unique($errores)),
            'advertencias' => $base['advertencias'],
        ];
    }

    /**
     * @return array{ok: bool, errores: list<string>, advertencias: list<string>}
     */
    public function validarParaFirmar(DocumentoAcademico $documento): array
    {
        $base = $this->validarParaPrepararFirma($documento);
        $errores = $base['ok'] ? [] : $base['errores'];
        $errores[] = 'TODO técnico: validar esquema de firma (FIEL u homólogo) y validación de certificados según normativa vigente.';

        return [
            'ok' => false,
            'errores' => array_values(array_unique($errores)),
            'advertencias' => $base['advertencias'],
        ];
    }

    /**
     * @return array{ok: bool, errores: list<string>, advertencias: list<string>}
     */
    public function validarMateriasCursadas(DocumentoAcademico $documento): array
    {
        return $this->validarMaterias($documento);
    }

    /**
     * @return array{ok: bool, errores: list<string>, advertencias: list<string>}
     */
    public function validarObservaciones(DocumentoAcademico $documento): array
    {
        $pendientes = $documento->observacionesPendientes()->count();
        $errores = [];

        if ($pendientes > 0) {
            $errores[] = 'Existen observaciones pendientes por atender.';
        }

        return [
            'ok' => $errores === [],
            'errores' => $errores,
            'advertencias' => [],
        ];
    }

    /**
     * @return array{
     *   documento_id:int,
     *   validaciones: array<string, array{ok: bool, errores: list<string>, advertencias: list<string>}>,
     *   totales: array{errores:int, advertencias:int},
     *   ok_revision: bool,
     *   ok_aprobacion: bool,
     *   ok_preparar_firma: bool
     * }
     */
    public function resumen(DocumentoAcademico $documento): array
    {
        $documento = $documento->fresh();

        $secciones = [
            'documento_duplicado' => $this->validarDocumentoDuplicado($documento),
            'datos_alumno' => $this->validarDatosAlumno($documento),
            'matricula' => $this->validarMatricula($documento),
            'matricula_unica' => $this->validarMatriculaUnica($documento),
            'oferta_academica' => $this->validarOfertaAcademica($documento),
            'programa_plan' => $this->validarProgramaPlan($documento),
            'materias' => $this->validarMaterias($documento),
            'trayectoria' => $this->validarTrayectoria($documento),
            'observaciones' => $this->validarObservaciones($documento),
        ];

        $review = $this->validarParaRevision($documento);
        $approval = $this->validarParaAprobacion($documento);
        $ready = $this->validarParaPrepararFirma($documento);

        $errores = 0;
        $advertencias = 0;
        foreach ($secciones as $sec) {
            $errores += count($sec['errores']);
            $advertencias += count($sec['advertencias']);
        }

        return [
            'documento_id' => (int) $documento->id,
            'validaciones' => $secciones,
            'totales' => [
                'errores' => $errores,
                'advertencias' => $advertencias,
            ],
            'ok_revision' => $review['ok'],
            'ok_aprobacion' => $approval['ok'],
            'ok_preparar_firma' => $ready['ok'],
        ];
    }

    /**
     * @param  list<array{ok: bool, errores: list<string>, advertencias: list<string>}>  $partes
     * @return array{ok: bool, errores: list<string>, advertencias: list<string>}
     */
    protected function combinar(array $partes): array
    {
        $errores = [];
        $advertencias = [];

        foreach ($partes as $parte) {
            $errores = array_merge($errores, $parte['errores']);
            $advertencias = array_merge($advertencias, $parte['advertencias']);
        }

        return [
            'ok' => $errores === [],
            'errores' => array_values(array_unique($errores)),
            'advertencias' => array_values(array_unique($advertencias)),
        ];
    }

    /**
     * @return array{ok: bool, errores: list<string>, advertencias: list<string>}
     */
    protected function validarEstadoWorkflow(DocumentoAcademico $documento, string $requerido, string $mensaje): array
    {
        if ($documento->estado_workflow !== $requerido) {
            return [
                'ok' => false,
                'errores' => [$mensaje],
                'advertencias' => [],
            ];
        }

        return ['ok' => true, 'errores' => [], 'advertencias' => []];
    }
}
