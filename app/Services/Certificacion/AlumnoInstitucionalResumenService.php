<?php

declare(strict_types=1);

namespace App\Services\Certificacion;

use App\Enums\Certificacion\EstadoCadena;
use App\Enums\Certificacion\EstadoFirma;
use App\Enums\Certificacion\EstadoSep;
use App\Enums\Certificacion\EstadoWorkflow;
use App\Enums\Certificacion\EstadoXml;
use App\Enums\Certificacion\TipoCertificacion;
use App\Enums\Certificacion\TipoDocumentoAcademico;
use App\Models\Alumno;
use App\Models\DocumentoAcademico;
use App\Models\DocumentoMateriaSnapshot;
use App\Models\MateriaCursada;
use App\Models\PlanMateria;
use App\Models\SolicitudMatricula;
use Illuminate\Support\Collection;

final class AlumnoInstitucionalResumenService
{
    public function __construct(
        protected CertificacionImportacionLegacyNormativaGate $legacyGate,
        protected AcademicRulesResolver $academicRulesResolver,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function construir(Alumno $alumno): array
    {
        $alumno->load([
            'matricula.ofertaAcademica.institucion.subsistema',
            'matricula.ofertaAcademica.sede',
            'matricula.ofertaAcademica.programaEstudio',
            'matricula.ofertaAcademica.planEstudio',
            'matricula.cicloEscolar',
            'matricula.inscripcionesPeriodo.cicloEscolar',
            'matricula.inscripcionesPeriodo.cargasAcademicas',
            'matricula.materiasCursadas.planMateria',
            'matricula.trayectoriaAcademica',
            'documentosAcademicos' => function ($q) {
                $q->withCount('observacionesPendientes')
                    ->orderByDesc('updated_at')
                    ->limit(25);
            },
        ]);

        return [
            /** Referencias operativas internas (SPA / POST); no mostrar al usuario final. */
            'refs' => $this->refsOperativas($alumno),
            'alumno' => $this->resumenPersona($alumno),
            'matricula' => $this->resumenMatricula($alumno),
            'solicitud_matricula' => $this->resumenSolicitudMatricula($alumno),
            'expediente_normativo' => $this->expedienteNormativoContexto($alumno),
            'contexto_legacy_normativo' => $this->contextoLegacyNormativo($alumno),
            'inscripciones_periodo' => $this->inscripciones($alumno),
            'materias_cursadas' => $this->resumenMateriasCursadas($alumno),
            'trayectoria' => $this->resumenTrayectoria($alumno),
            'documentos_certificacion' => $this->documentosLegibles($alumno),
            'linea_tiempo_certificacion' => $this->lineaTiempoBasica($alumno),
        ];
    }

    /** @return array<string, mixed> */
    /**
     * @return array<string, int|null>
     */
    private function refsOperativas(Alumno $alumno): array
    {
        $m = $alumno->matricula;
        $oferta = $m?->ofertaAcademica;
        $ins = $oferta?->institucion;

        return [
            'alumno_id' => $alumno->id,
            'matricula_id' => $m?->id,
            'oferta_academica_id' => $oferta?->id,
            'ciclo_escolar_id' => $m?->ciclo_escolar_id,
            'subsistema_id' => $ins?->subsistema_id,
            'region_id' => $ins?->region_id,
            'institucion_id' => $oferta?->institucion_id,
            'sede_id' => $oferta?->sede_id,
        ];
    }

    private function resumenPersona(Alumno $alumno): array
    {
        return [
            'nombre_completo' => trim(implode(' ', array_filter([
                $alumno->nombre,
                $alumno->primer_apellido,
                $alumno->segundo_apellido,
            ]))),
            'curp' => $alumno->curp,
            'fecha_nacimiento' => $alumno->fecha_nacimiento?->format('Y-m-d'),
            'genero' => $this->generoLegible((string) ($alumno->genero ?? '')),
            'estatus' => $this->estatusAlumnoLegible((string) ($alumno->estatus ?? '')),
        ];
    }

    /**
     * Contexto separado Normal vs UPN para Expediente 360 (sin duplicar pantallas).
     *
     * @return array<string, mixed>
     */
    private function expedienteNormativoContexto(Alumno $alumno): array
    {
        $m = $alumno->matricula;
        if ($m === null) {
            return [
                'subsistema_clave' => null,
                'mensajes_institucionales' => [],
                'ui' => [],
            ];
        }

        try {
            $rules = $this->academicRulesResolver->forMatricula($m);
            $clave = $rules->claveSubsistema();
            $msgs = [];
            $bloqueoDoc = $rules->mensajeEmisionDocumentalNoDisponible();
            if ($bloqueoDoc !== null && $bloqueoDoc !== '') {
                $msgs[] = $bloqueoDoc;
            }

            $oferta = $m->ofertaAcademica;
            $meta = is_array($oferta?->metadata) ? $oferta->metadata : [];
            // Modalidad UPN: ver TODO en modelo OfertaAcademica (metadata.modalidad_upn vs enum SEP).
            $modalidadUpn = $meta['modalidad_upn'] ?? null;

            return [
                'subsistema_clave' => $clave,
                'mensajes_institucionales' => $msgs,
                'ui' => [
                    'mostrar_ayuda_matricula_normal_2022' => $rules->usaPatronMatriculaEducacionNormal2022(),
                    'mostrar_texto_inscripcion_anual_normal' => $rules->usaReferenciaInscripcionAnualNormal(),
                    'modalidad_operacion_upn' => $clave === 'UPN' ? ($modalidadUpn ?? $oferta?->modalidad) : null,
                    'programa_educativo' => $oferta?->programaEstudio?->nombre,
                    'unidad_academica' => $oferta?->institucion?->nombre,
                    'sede_cct' => $oferta?->sede?->nombre ?? $oferta?->sede?->clave,
                    'reinscripcion_periodo_calendario_upn' => $clave === 'UPN',
                    'avisos_upn' => $clave === 'UPN' ? [
                        'La reinscripción UPN se efectúa en periodos subsecuentes conforme al calendario del programa (no use la referencia de inscripción anual exclusiva de Educación Normal).',
                        'Bajas temporales y permanencia máxima se supervisan según reglamento UPN integrado en motor.',
                    ] : [],
                ],
            ];
        } catch (\Throwable) {
            return [
                'subsistema_clave' => null,
                'mensajes_institucionales' => [],
                'ui' => [],
            ];
        }
    }

    /** @return array<string, mixed>|null */
    private function resumenMatricula(Alumno $alumno): ?array
    {
        $m = $alumno->matricula;
        if ($m === null) {
            return null;
        }

        $oferta = $m->ofertaAcademica;
        $plan = $oferta?->planEstudio;
        $prog = $oferta?->programaEstudio;

        return [
            'clave_matricula' => $m->matricula,
            'estado' => $this->estadoMatriculaLegible((string) ($m->estado ?? '')),
            'subsistema' => $oferta?->institucion?->subsistema?->nombre,
            'subsistema_clave' => $oferta?->institucion?->subsistema?->clave,
            'ciclo_actual' => $m->cicloEscolar?->nombre ?? $m->cicloEscolar?->clave,
            'institucion' => $oferta?->institucion?->nombre,
            'sede' => $oferta?->sede?->nombre,
            'programa' => $prog !== null ? $prog->nombre.' · '.$prog->clave : null,
            'plan_estudios' => $plan !== null ? $plan->nombre.' · '.$plan->clave : null,
            'creditos_catalogo_plan' => $plan?->id !== null
                ? (float) PlanMateria::query()
                    ->where('plan_estudio_id', $plan->id)
                    ->where('estatus', 'activa')
                    ->sum('creditos')
                : null,
        ];
    }

    /** @return array<string, mixed>|null */
    private function resumenSolicitudMatricula(Alumno $alumno): ?array
    {
        $s = SolicitudMatricula::query()
            ->where('alumno_id', $alumno->id)
            ->whereNot('estado', SolicitudMatricula::ESTADO_CANCELADA)
            ->orderByDesc('id')
            ->first();

        if ($s === null) {
            return null;
        }

        $s->loadMissing([
            'ofertaAcademica.institucion',
            'programaEstudio',
            'planEstudio',
            'cicloIngreso',
            'matricula',
        ]);

        return [
            'id' => $s->id,
            'estado' => $s->estado,
            'observaciones' => $s->observaciones,
            'motivo_rechazo' => $s->motivo_rechazo,
            'matricula_asignada_clave' => $s->matricula?->matricula,
            'matricula_id' => $s->matricula_id,
            'oferta_academica_id' => $s->oferta_academica_id,
            'ciclo_ingreso_etiqueta' => $s->cicloIngreso?->nombre ?? $s->cicloIngreso?->clave,
            'programa_etiqueta' => $s->programaEstudio?->nombre,
            'plan_etiqueta' => $s->planEstudio?->nombre,
            'actualizado_en' => $s->updated_at?->toIso8601String(),
        ];
    }

    /** @return array<string, mixed> */
    private function contextoLegacyNormativo(Alumno $alumno): array
    {
        $m = $alumno->matricula;
        if ($m === null) {
            return [
                'requiere_atencion' => false,
                'mensaje_operativo' => null,
                'estado_legacy' => null,
            ];
        }

        $estadoCodigo = (string) data_get($m->metadata, CertificacionImportacionLegacyNormativaGate::MATRICULA_META_KEY.'.estado');
        $msg = $this->legacyGate->mensajeSiImpedeCertificadoOficial($m, null);

        return [
            'requiere_atencion' => $msg !== null,
            'bloquea' => $estadoCodigo === CertificacionImportacionLegacyNormativaGate::ESTADO_RECHAZADO_NORMATIVAMENTE,
            'advertencia_carga_historica' => $estadoCodigo === CertificacionImportacionLegacyNormativaGate::ESTADO_PENDIENTE_VALIDACION,
            'estado_codigo' => $estadoCodigo !== '' ? $estadoCodigo : null,
            'mensaje_operativo' => $msg,
            'estado_legacy' => $this->labelBucketLegacyNormativo($estadoCodigo !== '' ? $estadoCodigo : null),
        ];
    }

    private function labelBucketLegacyNormativo(?string $estadoRaw): ?string
    {
        $estado = (string) $estadoRaw;
        if ($estado === '') {
            return null;
        }

        return match ($estado) {
            CertificacionImportacionLegacyNormativaGate::ESTADO_PENDIENTE_VALIDACION => 'Validación normativa pendiente',
            CertificacionImportacionLegacyNormativaGate::ESTADO_VALIDADO_NORMATIVAMENTE => 'Carga histórica validada normativamente',
            CertificacionImportacionLegacyNormativaGate::ESTADO_RECHAZADO_NORMATIVAMENTE => 'Validación normativa rechazada (requiere corrección)',
            default => null,
        };
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function inscripciones(Alumno $alumno): array
    {
        $mat = $alumno->matricula;
        if ($mat === null) {
            return [];
        }

        return $mat->inscripcionesPeriodo
            ->sortBy('id')
            ->values()
            ->map(function ($ins) {
                return [
                    'etiqueta' => $ins->etiqueta_periodo_curricular
                        ?: 'Periodo '.($ins->numero_periodo_curricular ?? '—'),
                    'tipo_periodo' => $this->tipoPeriodoLegible((string) ($ins->tipo_periodo_curricular ?? '')),
                    'ciclo' => $ins->cicloEscolar?->nombre ?? $ins->cicloEscolar?->clave,
                    'estatus' => $this->estatusInscripcionLegible((string) ($ins->estatus ?? '')),
                    'cargas_detectadas' => $ins->cargasAcademicas->count(),
                ];
            })->all();
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function resumenMateriasCursadas(Alumno $alumno): array
    {
        $mat = $alumno->matricula;
        if ($mat === null) {
            return [];
        }

        $planId = $mat->ofertaAcademica?->plan_estudio_id;
        $clavePlan = $planId !== null
            ? PlanMateria::query()
                ->where('plan_estudio_id', $planId)
                ->where('estatus', 'activa')
                ->pluck('clave_materia')
                ->flip()
            : collect();

        $congeladasIds = $this->materiasConSnapshotCertificacion($mat->id);

        return $mat->materiasCursadas
            ->sortBy(fn (MateriaCursada $mc) => [$mc->orden ?? 9999, $mc->id])
            ->values()
            ->map(function (MateriaCursada $mc) use ($clavePlan, $congeladasIds) {
                $origenCatalogo = $mc->plan_materia_id !== null || $mc->carga_academica_id !== null;
                $clave = trim((string) ($mc->clave ?? ''));
                $fuera = $clave !== '' && $clavePlan->isNotEmpty()
                    && ! $clavePlan->has($clave)
                    && ! $origenCatalogo;

                return [
                    'clave' => $mc->clave,
                    'nombre' => $mc->nombre,
                    'periodo_cursado' => $mc->periodo ?: $mc->etiqueta_periodo_curricular,
                    'periodo_curricular_etiqueta' => trim(implode(' ', array_filter([
                        $mc->tipo_periodo_curricular,
                        $mc->numero_periodo_curricular !== null ? '#'.$mc->numero_periodo_curricular : null,
                    ]))),
                    'calificacion' => $mc->calificacion,
                    'creditos_catalogo' => $mc->creditos,
                    'tipo_evaluacion' => $mc->tipo_evaluacion,
                    'estatus_acreditacion' => $mc->estatus_acreditacion,
                    'bloque_catalogo' => $origenCatalogo,
                    'captura_manual' => ! $origenCatalogo,
                    'posible_fuera_de_plan' => $fuera,
                    'dato_congelado_en_certificado' => $congeladasIds->contains((int) $mc->id),
                    'fuente_catalogo_legible' => $mc->plan_materia_id
                        ? 'Plan de estudios'
                        : ($mc->carga_academica_id ? 'Carga académica' : 'Captura o histórico'),
                ];
            })->all();
    }

    /** @return Collection<int, int> */
    private function materiasConSnapshotCertificacion(int $matriculaId): Collection
    {
        $docIds = DocumentoAcademico::query()
            ->where('matricula_id', $matriculaId)
            ->where(function ($q) {
                $q->where('estado_workflow', EstadoWorkflow::APROBADO->value)
                    ->orWhere('estado_firma', EstadoFirma::FIRMADO->value)
                    ->orWhere('metadata->listo_para_firma', true);
            })
            ->pluck('id');

        if ($docIds->isEmpty()) {
            return collect();
        }

        return DocumentoMateriaSnapshot::query()
            ->whereIn('documento_academico_id', $docIds->all())
            ->pluck('materia_cursada_id');
    }

    /** @return array<string, mixed>|null */
    private function resumenTrayectoria(Alumno $alumno): ?array
    {
        $tr = $alumno->matricula?->trayectoriaAcademica;
        if ($tr === null) {
            return null;
        }

        return [
            'estado_consolidacion' => $this->labelEstatusTrayectoria((string) ($tr->estatus_trayectoria ?? '')),
            'promedio' => $tr->promedio,
            'creditos_obtenidos' => $tr->creditos_obtenidos,
            'creditos_registrados' => $tr->creditos_totales,
            'materias_totales_plan' => $tr->asignaturas_total,
            'materias_cursadas' => $tr->asignaturas_cursadas,
            'aprobaciones' => $tr->materias_acreditadas,
            'no_acreditadas' => $tr->materias_no_acreditadas,
        ];
    }

    /** @return list<array<string, mixed>> */
    private function documentosLegibles(Alumno $alumno): array
    {
        return $alumno->documentosAcademicos
            ->sortByDesc('updated_at')
            ->values()
            ->map(fn (DocumentoAcademico $d) => $this->filaDocumento($d))->all();
    }

    /** @return list<array<string, mixed>> */
    private function lineaTiempoBasica(Alumno $alumno): array
    {
        return $alumno->documentosAcademicos
            ->sortByDesc('updated_at')
            ->values()
            ->take(15)
            ->map(function (DocumentoAcademico $d) {
                return [
                    'fecha' => $d->updated_at?->toIso8601String(),
                    'tipo' => TipoDocumentoAcademico::tryFrom((string) $d->tipo_documento)?->label()
                        ?? (string) $d->tipo_documento,
                    'estado_principal' => EstadoWorkflow::tryFrom((string) $d->estado_workflow)?->label()
                        ?? (string) $d->estado_workflow,
                ];
            })
            ->all();
    }

    /** @return array<string, mixed> */
    private function filaDocumento(DocumentoAcademico $d): array
    {
        $pendObs = isset($d->observaciones_pendientes_count)
            ? (int) $d->observaciones_pendientes_count
            : 0;

        return [
            'id' => $d->id,
            'tipo_documento_key' => (string) $d->tipo_documento,
            'estado_workflow' => (string) $d->estado_workflow,
            'tipo_certificacion' => $d->tipo_certificacion !== null && $d->tipo_certificacion !== ''
                ? (TipoCertificacion::tryFrom((string) $d->tipo_certificacion)?->label() ?? (string) $d->tipo_certificacion)
                : null,
            'tipo_documento' => TipoDocumentoAcademico::tryFrom((string) $d->tipo_documento)?->label()
                ?? (string) $d->tipo_documento,
            'workflow' => EstadoWorkflow::tryFrom((string) $d->estado_workflow)?->label()
                ?? (string) $d->estado_workflow,
            'cadena' => EstadoCadena::tryFrom((string) $d->estado_cadena)?->label()
                ?? (string) $d->estado_cadena,
            'xml' => EstadoXml::tryFrom((string) $d->estado_xml)?->label()
                ?? (string) $d->estado_xml,
            'firma' => EstadoFirma::tryFrom((string) $d->estado_firma)?->label()
                ?? (string) $d->estado_firma,
            'sep' => EstadoSep::tryFrom((string) $d->estado_sep)?->label()
                ?? (string) $d->estado_sep,
            'folio_interno' => $d->folio_interno,
            'requiere_revision_observaciones' => $pendObs > 0,
            'alerta_observaciones' => $pendObs > 0 ? 'Hay observaciones institucionales pendientes de atender.' : null,
        ];
    }

    private function tipoPeriodoLegible(string $t): string
    {
        return match ($t) {
            'semestre' => 'Semestre',
            'trimestre' => 'Trimestre',
            'bimestre' => 'Bimestre',
            'modulo' => 'Módulo',
            'periodo_abierto', 'personalizado', 'personalizado_etiqueta' => 'Periodo institucional',
            default => $t !== '' ? ucfirst(str_replace('_', ' ', $t)) : '—',
        };
    }

    private function estatusInscripcionLegible(string $e): string
    {
        return match (strtolower($e)) {
            'activa', 'activo' => 'Activa',
            'cancelada', 'cancelado' => 'Cancelada',
            'baja' => 'Baja',
            default => $e !== '' ? ucfirst($e) : '—',
        };
    }

    private function estadoMatriculaLegible(string $e): string
    {
        return match (strtolower($e)) {
            'activa' => 'Activa',
            'inactiva' => 'Inactiva',
            'egresado', 'egresada' => 'Egresado',
            'baja' => 'Baja',
            default => $e !== '' ? ucfirst($e) : '—',
        };
    }

    private function labelEstatusTrayectoria(string $e): string
    {
        return match ($e) {
            'sin_materias' => 'Sin materias cursadas registradas',
            'cumple_plan' => 'Cumple trayectoria del plan',
            'consolidada' => 'Consolidado con rezagos académicos',
            'con_pendientes' => 'Hay materias no acreditadas',
            default => $e !== '' ? str_replace('_', ' ', ucfirst($e)) : '—',
        };
    }

    private function generoLegible(string $g): ?string
    {
        if ($g === '') {
            return null;
        }

        return match (strtoupper($g)) {
            'H', 'M' => $g === 'H' ? 'Hombre' : 'Mujer',
            default => ucfirst(strtolower($g)),
        };
    }

    private function estatusAlumnoLegible(string $s): string
    {
        return match (strtolower($s)) {
            'activo', 'activa' => 'Activo',
            'inactivo' => 'Inactivo',
            'egresado' => 'Egresado',
            default => $s !== '' ? ucfirst($s) : 'Activo',
        };
    }
}
