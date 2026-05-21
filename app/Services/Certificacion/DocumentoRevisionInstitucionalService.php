<?php

declare(strict_types=1);

namespace App\Services\Certificacion;

use App\Models\DocumentoAcademico;
use App\Models\User;

class DocumentoRevisionInstitucionalService
{
    public function __construct(
        protected AlumnoInstitucionalResumenService $resumenAlumno,
        protected DocumentoAcademicoRequisitosService $requisitos,
        protected ValidacionAcademicaDocumentoService $validacionAcademica,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function armarDetalle(DocumentoAcademico $documento, ?User $viewer = null): array
    {
        $documento->load([
            'alumno',
            'matricula',
            'institucion',
            'sede',
            'cicloEscolar',
            'ofertaAcademica.programaEstudio',
            'ofertaAcademica.planEstudio',
            'observaciones' => fn ($q) => $q->orderByDesc('id'),
        ]);

        $resumenExpediente = null;
        if ($documento->alumno_id) {
            $resumenExpediente = $this->resumenAlumno->construir(
                $documento->alumno()->firstOrFail(),
            );
        }

        $eval = $this->requisitos->evaluar($documento);
        $validacion = $this->validacionAcademica->resumen($documento);

        $meta = is_array($documento->metadata) ? $documento->metadata : [];
        $a = $documento->alumno;
        $oferta = $documento->ofertaAcademica;

        return [
            'documento' => [
                'id' => $documento->id,
                'folio_interno' => $documento->folio_interno,
                'tipo_documento' => $documento->tipo_documento,
                'tipo_certificacion' => $documento->tipo_certificacion,
                'estado_workflow' => $documento->estado_workflow,
                'estado_firma' => $documento->estado_firma,
                'fecha_solicitud' => $documento->fecha_solicitud?->toIso8601String(),
                'fecha_aprobacion' => $documento->fecha_aprobacion?->toIso8601String(),
                'listo_para_firma' => (bool) ($meta['listo_para_firma'] ?? false),
                'observaciones_pendientes_count' => $documento->observaciones()->where('estado', 'pendiente')->count(),
                'puede_operar_revision' => $this->puedeOperarRevision($documento),
            ],
            'alumno' => $a ? [
                'id' => $a->id,
                'curp' => $a->curp,
                'nombre' => $a->nombre,
                'primer_apellido' => $a->primer_apellido,
                'segundo_apellido' => $a->segundo_apellido,
                'nombre_completo' => trim(implode(' ', array_filter([$a->nombre, $a->primer_apellido, $a->segundo_apellido]))),
            ] : null,
            'matricula' => $documento->matricula ? [
                'id' => $documento->matricula->id,
                'matricula' => $documento->matricula->matricula,
                'estado' => $documento->matricula->estado,
            ] : ($resumenExpediente['matricula'] ?? null),
            'institucion' => $documento->institucion ? [
                'id' => $documento->institucion->id,
                'nombre' => $documento->institucion->nombre,
                'clave' => $documento->institucion->clave,
            ] : null,
            'sede' => $documento->sede ? [
                'id' => $documento->sede->id,
                'nombre' => $documento->sede->nombre,
                'clave' => $documento->sede->clave,
                'cct' => $documento->sede->clave,
            ] : null,
            'programa' => $oferta?->programaEstudio ? [
                'nombre' => $oferta->programaEstudio->nombre,
                'clave' => $oferta->programaEstudio->clave,
            ] : ($resumenExpediente['matricula']['plan_estudios'] ?? null),
            'plan' => $oferta?->planEstudio ? [
                'nombre' => $oferta->planEstudio->nombre,
                'clave' => $oferta->planEstudio->clave,
            ] : null,
            'ciclo_escolar' => $documento->cicloEscolar ? [
                'nombre' => $documento->cicloEscolar->nombre,
                'clave' => $documento->cicloEscolar->clave,
            ] : null,
            'materias_cursadas' => $resumenExpediente['materias_cursadas'] ?? [],
            'trayectoria' => $resumenExpediente['trayectoria'] ?? null,
            'observaciones' => $documento->observaciones->map(fn ($o) => [
                'id' => $o->id,
                'tipo' => $o->tipo,
                'seccion' => $o->seccion,
                'observacion' => $o->observacion,
                'prioridad' => $o->prioridad,
                'estado' => $o->estado,
                'created_at' => $o->created_at?->toIso8601String(),
            ])->values()->all(),
            'validacion' => [
                'valido' => $eval['valido'],
                'errores' => $eval['errores'],
                'resumen' => $validacion,
            ],
        ];
    }

    protected function puedeOperarRevision(DocumentoAcademico $documento): bool
    {
        $bloqueados = ['firmado', 'cancelado'];

        if (in_array($documento->estado_workflow, $bloqueados, true)) {
            return false;
        }

        if ($documento->estado_firma === 'firmado' || $documento->estado_firma === 'firmando') {
            return false;
        }

        return true;
    }
}
