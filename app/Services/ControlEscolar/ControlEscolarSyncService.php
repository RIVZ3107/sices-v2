<?php

declare(strict_types=1);

namespace App\Services\ControlEscolar;

use App\Contracts\ControlEscolar\ControlEscolarSourceAdapterInterface;
use App\Data\ControlEscolar\ControlEscolarAlumnoData;
use App\Data\ControlEscolar\ControlEscolarMateriaData;
use App\Data\ControlEscolar\ControlEscolarSyncResult;
use App\Data\ControlEscolar\ControlEscolarTrayectoriaData;
use App\Enums\Certificacion\EstadoFirma;
use App\Models\Alumno;
use App\Models\DocumentoAcademico;
use App\Models\MateriaCursada;
use App\Models\Matricula;
use App\Models\Sede;
use App\Models\TrayectoriaAcademica;
use App\Services\Certificacion\AuditoriaService;
use App\Services\Certificacion\DocumentoMateriaSnapshotService;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ControlEscolarSyncService
{
    public function __construct(
        protected ControlEscolarSourceAdapterInterface $source,
        protected ControlEscolarDecDataValidator $decValidator,
        protected DocumentoMateriaSnapshotService $snapshotService,
        protected AuditoriaService $auditoria,
    ) {}

    public function importarPorCurp(string $curp): ControlEscolarSyncResult
    {
        $dato = $this->source->buscarAlumnoPorCurp($curp);
        if ($dato === null) {
            return new ControlEscolarSyncResult(false, 'No se encontró alumno en Control Escolar para la CURP indicada.');
        }

        if ($dato->matricula === null || $dato->matricula === '') {
            return new ControlEscolarSyncResult(false, 'El registro en Control Escolar no incluye matrícula.');
        }

        return $this->importarPorMatricula($dato->matricula, $dato);
    }

    public function importarPorMatricula(string $matricula, ?ControlEscolarAlumnoData $alumnoPrecargado = null): ControlEscolarSyncResult
    {
        $alumnoCe = $alumnoPrecargado ?? $this->source->buscarAlumnoPorMatricula($matricula);
        if ($alumnoCe === null) {
            return new ControlEscolarSyncResult(false, 'No se encontró matrícula en Control Escolar.');
        }

        return DB::transaction(function () use ($matricula, $alumnoCe): ControlEscolarSyncResult {
            [$alumno, $createdAlumno] = $this->resolverAlumno($alumnoCe);
            [$matriculaModel, $createdMatricula] = $this->resolverMatricula($alumno, $matricula, $alumnoCe);

            $materiasCe = $this->source->obtenerMateriasPorMatricula($matricula);
            $materiasCount = $this->sincronizarMaterias($matriculaModel, $materiasCe);

            $trayectoriaCe = $this->source->obtenerTrayectoriaPorMatricula($matricula);
            if ($trayectoriaCe !== null) {
                $this->sincronizarTrayectoria($matriculaModel, $trayectoriaCe);
            }

            $this->marcarSincronizacion($alumno, $matriculaModel, $alumnoCe);

            $this->auditoria->registrar(
                'control_escolar.importacion',
                Matricula::class,
                $matriculaModel->id,
                [
                    'matricula' => $matricula,
                    'materias' => $materiasCount,
                    'origen' => 'control_escolar',
                ],
            );

            return new ControlEscolarSyncResult(
                success: true,
                message: 'Importación desde Control Escolar completada.',
                alumno: $alumno,
                matricula: $matriculaModel,
                materiasImportadas: $materiasCount,
                createdAlumno: $createdAlumno,
                createdMatricula: $createdMatricula,
            );
        });
    }

    /**
     * @param  array<string, mixed>  $opciones
     */
    public function crearDocumentoDesdeControlEscolar(string $matricula, array $opciones = []): ControlEscolarSyncResult
    {
        $sync = $this->importarPorMatricula($matricula);
        if (! $sync->success || $sync->matricula === null) {
            return $sync;
        }

        if ($this->documentoCongeladoExiste($sync->matricula)) {
            return new ControlEscolarSyncResult(
                success: false,
                message: 'Existe un documento firmado o en firma; no se crea otro desde Control Escolar.',
                alumno: $sync->alumno,
                matricula: $sync->matricula,
                skippedFrozenDocument: true,
            );
        }

        $matriculaModel = $sync->matricula->loadMissing('ofertaAcademica.institucion');
        $errores = $this->decValidator->validarMatricula($matriculaModel);
        if ($errores !== []) {
            throw ValidationException::withMessages(['dec_validacion' => $errores]);
        }

        $sede = $this->resolverSedeDesdeCct($matriculaModel, $opciones);
        $institucionId = $sede?->institucion_id ?? $matriculaModel->ofertaAcademica?->institucion_id;
        $regionId = $matriculaModel->ofertaAcademica?->institucion?->region_id;

        $documento = DocumentoAcademico::query()->firstOrCreate(
            [
                'matricula_id' => $matriculaModel->id,
                'tipo_documento' => $opciones['tipo_documento'] ?? 'certificado',
                'estado_workflow' => 'borrador',
            ],
            [
                'alumno_id' => $matriculaModel->alumno_id,
                'oferta_academica_id' => $matriculaModel->oferta_academica_id,
                'ciclo_escolar_id' => $matriculaModel->ciclo_escolar_id,
                'subsistema_id' => $matriculaModel->subsistema_id,
                'region_id' => $regionId,
                'institucion_id' => $institucionId,
                'sede_id' => $sede?->id ?? $matriculaModel->ofertaAcademica?->sede_id,
                'tipo_certificacion' => $opciones['tipo_certificacion'] ?? 'total',
                'metadata' => [
                    'origen' => 'control_escolar',
                    'fecha_ultima_sincronizacion' => now()->toIso8601String(),
                ],
            ],
        );

        if ($this->documentoEstaCongelado($documento)) {
            return new ControlEscolarSyncResult(
                success: true,
                message: 'Documento existente en estado no editable; importación académica aplicada sin sobrescribir snapshot.',
                alumno: $sync->alumno,
                matricula: $sync->matricula,
                documento: $documento,
                materiasImportadas: $sync->materiasImportadas,
                skippedFrozenDocument: true,
            );
        }

        $this->snapshotService->forzarRegeneracion($documento->fresh());

        return new ControlEscolarSyncResult(
            success: true,
            message: 'Documento académico preparado desde Control Escolar (sin firma).',
            alumno: $sync->alumno,
            matricula: $sync->matricula,
            documento: $documento->fresh(),
            materiasImportadas: $sync->materiasImportadas,
            createdAlumno: $sync->createdAlumno,
            createdMatricula: $sync->createdMatricula,
        );
    }

    /**
     * @return array{0: Alumno, 1: bool}
     */
    protected function resolverAlumno(ControlEscolarAlumnoData $dato): array
    {
        $existente = Alumno::query()->where('curp', $dato->curp)->first();
        if ($existente !== null) {
            $existente->fill([
                'nombre' => $dato->nombre,
                'primer_apellido' => $dato->primerApellido,
                'segundo_apellido' => $dato->segundoApellido,
            ]);
            $meta = is_array($existente->metadata) ? $existente->metadata : [];
            $existente->metadata = array_merge($meta, [
                'control_escolar' => ['raw' => $dato->raw, 'synced_at' => now()->toIso8601String()],
            ]);
            $existente->save();

            return [$existente, false];
        }

        $alumno = Alumno::query()->create([
            'curp' => $dato->curp,
            'nombre' => $dato->nombre,
            'primer_apellido' => $dato->primerApellido,
            'segundo_apellido' => $dato->segundoApellido,
            'rfc' => $dato->rfc,
            'metadata' => [
                'control_escolar' => ['raw' => $dato->raw, 'synced_at' => now()->toIso8601String()],
            ],
        ]);

        return [$alumno, true];
    }

    /**
     * @return array{0: Matricula, 1: bool}
     */
    protected function resolverMatricula(Alumno $alumno, string $matricula, ControlEscolarAlumnoData $dato): array
    {
        $existente = Matricula::query()
            ->where('alumno_id', $alumno->id)
            ->where('matricula', $matricula)
            ->first();

        if ($existente !== null) {
            $meta = is_array($existente->metadata) ? $existente->metadata : [];
            $existente->metadata = array_merge($meta, [
                'control_escolar' => ['raw' => $dato->raw, 'synced_at' => now()->toIso8601String()],
            ]);
            $existente->save();

            return [$existente, false];
        }

        if ($alumno->matriculaActiva()->exists()) {
            throw ValidationException::withMessages([
                'matricula' => ['El alumno ya tiene matrícula activa en SICES v2; no se crea otra automáticamente desde Control Escolar.'],
            ]);
        }

        throw ValidationException::withMessages([
            'matricula' => [
                'No existe matrícula en SICES v2 para '.$matricula.'. Complete oferta/ciclo en SICES o extienda el mapeo Control Escolar → oferta_academica.',
            ],
        ]);
    }

    /**
     * @param  list<ControlEscolarMateriaData>  $materiasCe
     */
    protected function sincronizarMaterias(Matricula $matricula, array $materiasCe): int
    {
        $count = 0;
        foreach ($materiasCe as $materiaCe) {
            if ($materiaCe->semestre === null && $materiaCe->periodo === null) {
                continue;
            }

            $attrs = [
                'matricula_id' => $matricula->id,
                'clave' => $materiaCe->clave,
                'semestre' => $materiaCe->semestre,
                'periodo' => $materiaCe->periodo,
            ];

            MateriaCursada::query()->updateOrCreate(
                $attrs,
                [
                    'alumno_id' => $matricula->alumno_id,
                    'ciclo_escolar_id' => $matricula->ciclo_escolar_id,
                    'nombre' => $materiaCe->nombre,
                    'calificacion' => $materiaCe->calificacion,
                    'tipo_periodo_curricular' => $materiaCe->tipoPeriodoCurricular ?? 'semestre',
                    'numero_periodo_curricular' => $materiaCe->numeroPeriodoCurricular,
                    'creditos' => $materiaCe->creditos !== null ? (int) round($materiaCe->creditos) : null,
                    'estatus_acreditacion' => $materiaCe->estatusAcreditacion,
                    'metadata' => ['control_escolar' => $materiaCe->raw],
                ],
            );
            $count++;
        }

        return $count;
    }

    protected function sincronizarTrayectoria(Matricula $matricula, ControlEscolarTrayectoriaData $trayectoriaCe): void
    {
        TrayectoriaAcademica::query()->updateOrCreate(
            ['matricula_id' => $matricula->id],
            [
                'alumno_id' => $matricula->alumno_id,
                'promedio' => $trayectoriaCe->promedioGeneral,
                'promedio_aprovechamiento' => $trayectoriaCe->promedioGeneral,
                'creditos_obtenidos' => $trayectoriaCe->creditosAcumulados !== null
                    ? (int) round($trayectoriaCe->creditosAcumulados)
                    : null,
                'total_materias' => $trayectoriaCe->totalMaterias,
                'materias_acreditadas' => $trayectoriaCe->materiasAcreditadas,
                'estatus_trayectoria' => $trayectoriaCe->estatusTrayectoria,
                'metadata' => ['control_escolar' => $trayectoriaCe->raw],
            ],
        );
    }

    protected function marcarSincronizacion(Alumno $alumno, Matricula $matricula, ControlEscolarAlumnoData $dato): void
    {
        $stamp = now()->toIso8601String();
        foreach ([$alumno, $matricula] as $model) {
            $meta = is_array($model->metadata) ? $model->metadata : [];
            $model->metadata = array_merge($meta, [
                'fecha_ultima_sincronizacion' => $stamp,
                'origen_datos' => 'control_escolar',
            ]);
            $model->save();
        }
    }

    protected function resolverSedeDesdeCct(Matricula $matricula, array $opciones): ?Sede
    {
        $cct = $opciones['sede_cct'] ?? null;
        if ($cct === null || $cct === '') {
            return $matricula->ofertaAcademica?->sede;
        }

        return Sede::query()->where('clave', $cct)->first();
    }

    protected function documentoCongeladoExiste(Matricula $matricula): bool
    {
        return DocumentoAcademico::query()
            ->where('matricula_id', $matricula->id)
            ->whereIn('estado_firma', [
                EstadoFirma::FIRMADO->value,
                EstadoFirma::FIRMANDO->value,
                EstadoFirma::ERROR_FIRMA->value,
            ])
            ->exists();
    }

    protected function documentoEstaCongelado(DocumentoAcademico $documento): bool
    {
        return in_array($documento->estado_firma, [
            EstadoFirma::FIRMADO->value,
            EstadoFirma::FIRMANDO->value,
        ], true);
    }
}
