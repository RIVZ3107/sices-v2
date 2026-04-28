<?php

declare(strict_types=1);

namespace App\Services\Certificacion;

use App\Enums\Certificacion\EstadoWorkflow;
use App\Models\DocumentoAcademico;
use App\Models\MateriaCursada;
use App\Models\Matricula;
use App\Models\TrayectoriaAcademica;
use Illuminate\Validation\ValidationException;

/**
 * Requisitos mínimos de captura para avanzar el documento hacia revisión y aprobación (sin firma real).
 */
class DocumentoAcademicoRequisitosService
{
    public function __construct(
        protected ValidacionAcademicaDocumentoService $validacion,
    ) {}

    /**
     * @return array{valido: bool, errores: list<string>}
     */
    public function evaluar(DocumentoAcademico $documento): array
    {
        $res = $this->validacion->validarParaRevision($documento->fresh());

        return [
            'valido' => $res['ok'],
            'errores' => $res['errores'],
        ];
    }

    /**
     * Reglas para captura base (antes de enviar a revisión).
     *
     * @throws ValidationException
     */
    public function validarParaEnvioRevision(DocumentoAcademico $documento): void
    {
        $msgs = $this->validacion->validarParaRevision($documento->fresh())['errores'];
        if ($msgs !== []) {
            throw ValidationException::withMessages(['documento' => $msgs]);
        }
    }

    /**
     * @throws ValidationException
     */
    public function validarParaAprobacion(DocumentoAcademico $documento): void
    {
        $documento->refresh();

        if ($documento->estado_workflow !== EstadoWorkflow::EN_REVISION->value) {
            throw ValidationException::withMessages([
                'estado_workflow' => ['El documento debe estar en revisión para aprobarlo.'],
            ]);
        }

        $msgs = $this->validacion->validarParaAprobacion($documento->fresh())['errores'];
        if ($msgs !== []) {
            throw ValidationException::withMessages(['documento' => $msgs]);
        }
    }

    /**
     * Folio manual y token pueden asignarse tras aprobación (orden del proceso de negocio).
     *
     * @throws ValidationException
     */
    public function validarParaMarcarListoFirma(DocumentoAcademico $documento): void
    {
        $documento->refresh();

        if ($documento->estado_workflow !== EstadoWorkflow::APROBADO->value) {
            throw ValidationException::withMessages([
                'estado_workflow' => ['El documento debe estar aprobado antes de marcarlo listo para firma.'],
            ]);
        }

        $msgs = $this->validacion->validarParaPrepararFirma($documento->fresh())['errores'];
        if ($msgs !== []) {
            throw ValidationException::withMessages(['documento' => $msgs]);
        }
    }

    /**
     * @return list<string>
     */
    protected function mensajesFallo(DocumentoAcademico $documento): array
    {
        $errores = [];

        if ($documento->alumno_id === null) {
            $errores[] = 'Debe seleccionarse un alumno.';
        }

        if ($documento->matricula_id === null) {
            $errores[] = 'Debe asociarse una matrícula.';
        }

        if ($documento->ciclo_escolar_id === null) {
            $errores[] = 'Debe indicarse el ciclo escolar.';
        }

        if ($documento->tipo_documento === null || $documento->tipo_documento === '') {
            $errores[] = 'Debe indicarse el tipo de documento.';
        }

        if ($documento->subsistema_id === null && $documento->institucion_id === null) {
            $errores[] = 'Debe indicarse al menos subsistema u organización institucional en el contexto.';
        }

        $matricula = null;
        if ($documento->matricula_id !== null) {
            $matricula = Matricula::query()->find($documento->matricula_id);
            if ($matricula === null) {
                $errores[] = 'La matrícula indicada no existe.';
            } else {
                if ($documento->alumno_id !== null && (int) $matricula->alumno_id !== (int) $documento->alumno_id) {
                    $errores[] = 'La matrícula no corresponde al alumno del documento.';
                }
                if ($documento->ciclo_escolar_id !== null && (int) $matricula->ciclo_escolar_id !== (int) $documento->ciclo_escolar_id) {
                    $errores[] = 'La matrícula no corresponde al ciclo escolar del documento.';
                }
            }
        }

        if ($documento->matricula_id !== null) {
            $n = MateriaCursada::query()
                ->where('matricula_id', $documento->matricula_id)
                ->count();
            if ($n < 1) {
                $errores[] = 'Debe cargarse al menos una materia cursada para la matrícula.';
            }

            $tr = TrayectoriaAcademica::query()
                ->where('matricula_id', $documento->matricula_id)
                ->exists();
            if (! $tr) {
                $errores[] = 'Debe registrarse la trayectoria académica para la matrícula.';
            }
        }

        return $errores;
    }
}
