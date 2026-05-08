<?php

declare(strict_types=1);

namespace App\Services\Certificacion;

use App\Models\ImportacionHistoricaMaterias;
use App\Models\Matricula;
use App\Models\MateriaCursada;
use App\Models\PlanMateria;
use App\Support\Certificacion\PeriodoCurricularDecMapper;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ImportacionHistoricaMateriasService
{
    public function __construct(
        protected TrayectoriaAcademicaService $trayectoria,
        protected AuditoriaService $auditoria,
        protected AcademicRulesResolver $academicRules,
    ) {}

    /**
     * @param  list<array<string,mixed>>  $rows
     * @return array{
     *   faltantes:list<string>,
     *   extra:list<string>,
     *   claves_inexistentes:list<string>,
     *   periodo_curricular_incorrecto:list<string>,
     *   tiene_bloqueos:bool
     * }
     */
    public function validarRowsContraPlan(Matricula $matricula, array $rows): array
    {
        $planId = $matricula->ofertaAcademica?->plan_estudio_id;
        if ($planId === null) {
            return [
                'faltantes' => [],
                'extra' => [],
                'claves_inexistentes' => [],
                'periodo_curricular_incorrecto' => [],
                'tiene_bloqueos' => false,
            ];
        }

        $planFilas = PlanMateria::query()
            ->where('plan_estudio_id', $planId)
            ->where('estatus', 'activa')
            ->get(['clave_materia', 'tipo_periodo_curricular', 'numero_periodo_curricular', 'semestre']);

        $planCombinacionesPorClave = [];
        foreach ($planFilas as $p) {
            PeriodoCurricularDecMapper::aplicarDefaultsPlanMateria($p);
            $tipo = (string) $p->tipo_periodo_curricular;
            $num = (int) $p->numero_periodo_curricular;
            $planCombinacionesPorClave[$p->clave_materia][] = strtolower($tipo).'|'.$num;
        }

        $clavesPlan = array_keys($planCombinacionesPorClave);
        $clavesRowSig = [];

        $clavesInexistentes = [];
        $periodoIncorrecto = [];
        foreach ($rows as $row) {
            $clave = trim((string) ($row['clave'] ?? ''));
            if ($clave === '') {
                continue;
            }
            [$tipo, $numero] = $this->resolverPeriodoDesdeFila($row);
            $sigRow = strtolower($tipo).'|'.$numero;

            $clavesRowSig[] = $clave;
            if (! isset($planCombinacionesPorClave[$clave])) {
                $clavesInexistentes[] = $clave;
                continue;
            }
            $permitidas = $planCombinacionesPorClave[$clave];
            if (! in_array($sigRow, $permitidas, true)) {
                $periodoIncorrecto[] = $clave.':'.$sigRow.' (importación) vs '.implode(', ', $permitidas);
            }
        }

        $clavesNorm = array_values(array_unique($clavesRowSig));
        $faltantes = array_values(array_diff($clavesPlan, $clavesNorm));
        $extra = array_values(array_diff($clavesNorm, $clavesPlan));

        $tiene = $faltantes !== [] || $extra !== []
            || array_values(array_unique($clavesInexistentes)) !== []
            || array_values(array_unique($periodoIncorrecto)) !== [];

        return [
            'faltantes' => array_values(array_unique($faltantes)),
            'extra' => array_values(array_unique($extra)),
            'claves_inexistentes' => array_values(array_unique($clavesInexistentes)),
            'periodo_curricular_incorrecto' => array_values(array_unique($periodoIncorrecto)),
            'tiene_bloqueos' => $tiene,
        ];
    }

    /**
     * Une validación planeada contra el plan con sugerencias de `plan_materia_id`.
     *
     * @param  list<array<string,mixed>>  $rows
     * @return array{
     *   validacion: array<string,mixed>,
     *   reconciliacion: array<string,mixed>
     * }
     */
    public function prevalidarYConciliar(Matricula $matricula, array $rows): array
    {
        $validacion = $this->validarRowsContraPlan($matricula, $rows);

        $planId = $matricula->ofertaAcademica?->plan_estudio_id;
        $filasConciliadas = [];
        foreach ($rows as $idx => $row) {
            $clave = trim((string) ($row['clave'] ?? ''));
            [$tipo, $numero] = $this->resolverPeriodoDesdeFila($row);
            $planMateriaId = null;
            if ($planId !== null && $clave !== '') {
                $pm = PlanMateria::query()
                    ->where('plan_estudio_id', $planId)
                    ->where('clave_materia', $clave)
                    ->where('tipo_periodo_curricular', $tipo)
                    ->where('numero_periodo_curricular', $numero)
                    ->where('estatus', 'activa')
                    ->first();
                $planMateriaId = $pm?->id;
            }

            $filasConciliadas[] = [
                'indice' => $idx,
                'clave' => $clave,
                'tipo_periodo_curricular' => $tipo,
                'numero_periodo_curricular' => $numero,
                'plan_materia_id' => $planMateriaId,
                'coincide_plan' => $planMateriaId !== null,
            ];
        }

        return [
            'validacion' => $validacion,
            'reconciliacion' => [
                'filas' => $filasConciliadas,
                'sin_plan_materia' => collect($filasConciliadas)
                    ->filter(fn (array $f) => $f['clave'] !== '' && ! $f['coincide_plan'])
                    ->values()
                    ->all(),
            ],
        ];
    }

    /**
     * Persiste materias cursadas después de revisión/conciliación.
     *
     * @param  list<array<string,mixed>>  $filasEjecución  Filas definidas tras `prevalidarYConciliar`
     */
    public function aplicarImportacionConfirmada(
        ImportacionHistoricaMaterias $importacion,
        array $originalRows,
        array $filasEjecución,
        ?int $actorId,
        bool $forzarSinPlanMateria = false,
        ?string $motivoForzarLegacy = null,
    ): array {
        $importacion->loadMissing('matricula');
        $matricula = $importacion->matricula;
        if ($matricula === null) {
            throw ValidationException::withMessages(['matricula_id' => ['Matrícula no encontrada para la importación.']]);
        }

        if ($this->trayectoria->matriculaBloqueadaParaRecalculo($matricula)) {
            throw ValidationException::withMessages([
                'matricula_id' => ['No se permite importación con matrícula bloqueada por documento aprobado o firmado.'],
            ]);
        }

        if ($importacion->estado !== 'pre_validada') {
            throw ValidationException::withMessages([
                'estado' => ['La importación debe estar en estado pre_validada antes de confirmar.'],
            ]);
        }

        if ($forzarSinPlanMateria) {
            $m = trim((string) ($motivoForzarLegacy ?? ''));
            if (strlen($m) < 20) {
                throw ValidationException::withMessages([
                    'motivo_forzar_sin_plan' => ['Motivo institucional obligatorio (mínimo 20 caracteres) para importación legacy sin plan.'],
                ]);
            }
        }

        $bloqueantes = [];
        foreach ($filasEjecución as $f) {
            if ($f['coincide_plan'] ?? false) {
                continue;
            }
            if (! $forzarSinPlanMateria) {
                $bloqueantes[] = 'Sin plan_materia resuelto para clave '.$f['clave'].' en periodo declarado.';
                continue;
            }
            $idx = (int) ($f['indice'] ?? -1);
            $row = isset($originalRows[$idx]) && is_array($originalRows[$idx]) ? $originalRows[$idx] : [];
            $nombreFallback = trim((string) ($row['nombre'] ?? ''));
            if ($nombreFallback === '') {
                $bloqueantes[] = 'Sin plan ni nombre de materia (modo legacy) para clave '.$f['clave'].'.';
                continue;
            }
            $msgDec = $this->errorDecImportacionLegacyFila($row);
            if ($msgDec !== null) {
                $bloqueantes[] = $msgDec.' (clave '.($f['clave'] ?? '').')';
            }
        }
        if ($bloqueantes !== []) {
            throw ValidationException::withMessages(['filas_ejecucion' => $bloqueantes]);
        }

        $creados = 0;
        $huboInsercionLegacy = false;

        DB::transaction(function () use ($importacion, $matricula, $originalRows, $filasEjecución, &$creados, &$huboInsercionLegacy, $actorId, $forzarSinPlanMateria, $motivoForzarLegacy): void {
            $alumnoId = $matricula->alumno_id;
            foreach ($filasEjecución as $fila) {
                $idx = (int) ($fila['indice'] ?? -1);
                if ($idx < 0 || ! isset($originalRows[$idx])) {
                    continue;
                }
                $row = $originalRows[$idx];

                $planMateria = null;
                if (! empty($fila['plan_materia_id'])) {
                    $planMateria = PlanMateria::query()->find($fila['plan_materia_id']);
                }

                $claveRaw = trim((string) ($row['clave'] ?? ''));
                if ($claveRaw === '' && $planMateria === null) {
                    continue;
                }

                if ($planMateria instanceof PlanMateria) {
                    $decPlan = PeriodoCurricularDecMapper::semestreDecDesdePlanMateria($planMateria);
                    if ($decPlan === null) {
                        throw ValidationException::withMessages([
                            'plan_materia_id' => [
                                'El plan materia '.$planMateria->clave_materia
                                .' no define mapeo DEC claro (`semestre` para SEP no semestral o número institucional en semestre académico).',
                            ],
                        ]);
                    }

                    $data = [
                        'alumno_id' => $alumnoId,
                        'matricula_id' => $matricula->id,
                        'ciclo_escolar_id' => $importacion->ciclo_escolar_id,
                        'plan_materia_id' => $planMateria->id,
                        'materia_id' => $planMateria->materia_id,
                        'clave' => $planMateria->clave_materia,
                        'nombre' => $planMateria->nombre_materia,
                        'periodo' => $row['periodo'] ?? $importacion->metadata['periodo_libre_default'] ?? null,
                        'semestre' => $decPlan,
                        'tipo_periodo_curricular' => $planMateria->tipo_periodo_curricular,
                        'numero_periodo_curricular' => $planMateria->numero_periodo_curricular,
                        'etiqueta_periodo_curricular' => $planMateria->etiqueta_periodo_curricular,
                        'orden' => $planMateria->orden,
                        'creditos' => $planMateria->creditos,
                        'calificacion' => $this->valorCalificacion($row),
                        'calificacion_final' => $row['calificacion_final'] ?? null,
                        'calificacion_texto' => $row['calificacion_texto'] ?? null,
                        'tipo' => $row['tipo'] ?? null,
                        'tipo_evaluacion' => $row['tipo_evaluacion'] ?? null,
                        'estado' => $row['estado'] ?? 'acreditada',
                        'estatus_acreditacion' => $row['estatus_acreditacion'] ?? $row['estado'] ?? null,
                        'metadata' => array_merge(
                            (array) ($row['metadata'] ?? []),
                            ['fuente_importacion_historica_id' => $importacion->id],
                        ),
                    ];
                } elseif ($forzarSinPlanMateria) {
                    $decRow = $this->resolverSemestreDecImportacionLegacy($row);
                    [$tipoPeriodo, $numeroPeriodo] = $this->resolverPeriodoDesdeFila($row);
                    $data = [
                        'alumno_id' => $alumnoId,
                        'matricula_id' => $matricula->id,
                        'ciclo_escolar_id' => $importacion->ciclo_escolar_id,
                        'plan_materia_id' => null,
                        'materia_id' => isset($row['materia_id']) ? (int) $row['materia_id'] : null,
                        'clave' => $claveRaw,
                        'nombre' => trim((string) ($row['nombre'] ?? '')),
                        'periodo' => $row['periodo'] ?? null,
                        'semestre' => $decRow,
                        'tipo_periodo_curricular' => $tipoPeriodo,
                        'numero_periodo_curricular' => $numeroPeriodo,
                        'etiqueta_periodo_curricular' => $row['etiqueta_periodo_curricular'] ?? null,
                        'orden' => isset($row['orden']) ? (int) $row['orden'] : null,
                        'creditos' => isset($row['creditos']) ? (int) $row['creditos'] : null,
                        'calificacion' => $this->valorCalificacion($row),
                        'calificacion_final' => $row['calificacion_final'] ?? null,
                        'calificacion_texto' => $row['calificacion_texto'] ?? null,
                        'tipo' => $row['tipo'] ?? null,
                        'tipo_evaluacion' => $row['tipo_evaluacion'] ?? null,
                        'estado' => $row['estado'] ?? 'acreditada',
                        'estatus_acreditacion' => $row['estatus_acreditacion'] ?? $row['estado'] ?? null,
                        'metadata' => array_merge(
                            (array) ($row['metadata'] ?? []),
                            [
                                'origen' => CertificacionImportacionLegacyNormativaGate::META_ORIGEN_LEGACY,
                                'fuente_importacion_historica_id' => $importacion->id,
                                'legacy_motivo_responsable_institucional' => trim((string) ($motivoForzarLegacy ?? '')),
                            ],
                        ),
                    ];

                    if (trim((string) $data['nombre']) === '') {
                        continue;
                    }
                    $huboInsercionLegacy = true;
                } else {
                    continue;
                }

                if ($this->existeDuplicadoPorClaveYCiclo($matricula->id, (int) $importacion->ciclo_escolar_id, $data['clave'], $data['periodo'] ?? '')) {
                    continue;
                }

                $this->academicRules->forMatricula($matricula)->validarCapturaCalificacion($matricula, [
                    'calificacion' => $data['calificacion'] ?? null,
                    'calificacion_final' => $data['calificacion_final'] ?? null,
                    'calificacion_texto' => $data['calificacion_texto'] ?? null,
                ]);

                /** @var MateriaCursada $creado */
                $creado = MateriaCursada::query()->create($data);
                $creados++;

                if (($data['metadata']['origen'] ?? null) === CertificacionImportacionLegacyNormativaGate::META_ORIGEN_LEGACY) {
                    $this->auditoria->registrar(
                        'importacion_legacy.materia_cursada_creada',
                        MateriaCursada::class,
                        $creado->id,
                        [
                            'importacion_id' => $importacion->id,
                            'clave' => $data['clave'],
                            'semestre_dec' => $data['semestre'],
                            'periodo' => $data['periodo'],
                        ],
                        $actorId,
                    );
                }
            }

            ImportacionHistoricaMaterias::query()->whereKey($importacion->id)->update([
                'estado' => 'confirmada',
                'metadata' => array_merge((array) ($importacion->metadata ?? []), [
                    'confirmacion' => [
                        'forzar_sin_plan_materia' => $forzarSinPlanMateria,
                        'motivo_forzar_sin_plan' => $forzarSinPlanMateria ? trim((string) ($motivoForzarLegacy ?? '')) : null,
                        'insertados_legacy' => $huboInsercionLegacy,
                        'fecha' => now()->toIso8601String(),
                    ],
                ]),
            ]);

            $this->auditoria->registrar(
                'importacion_materias_historicas.confirmada',
                ImportacionHistoricaMaterias::class,
                $importacion->id,
                ['creados' => $creados],
                $actorId,
            );
        });

        if ($huboInsercionLegacy && trim((string) ($motivoForzarLegacy ?? '')) !== '') {
            $matricula->refresh();
            CertificacionImportacionLegacyNormativaGate::marcarMatriculaPorImportLegacy(
                $matricula,
                trim((string) $motivoForzarLegacy),
                $importacion->id,
                $actorId,
            );
        }

        $this->trayectoria->sincronizarDesdeMaterias($matricula->fresh(), $actorId);

        return ['insertados' => $creados];
    }

    /** @return list<array<string,mixed>> */
    public function filasEjecucionPorDefecto(ImportacionHistoricaMaterias $importacion): array
    {
        $payload = $importacion->reconciliacion_payload;
        $filas = is_array($payload) ? ($payload['filas'] ?? []) : [];

        return is_array($filas) ? array_values($filas) : [];
    }

    /** @param array<string,mixed> $row */
    private function errorDecImportacionLegacyFila(array $row): ?string
    {
        [$tipo, $num] = $this->resolverPeriodoDesdeFila($row);
        if ($tipo === 'semestre') {
            if (
                (isset($row['semestre_dec']) && (int) $row['semestre_dec'] > 0)
                || (isset($row['semestre']) && (int) $row['semestre'] > 0)
                || $num > 0
            ) {
                return null;
            }

            return 'Periodo semestral sin dato DEC: indique semestre_dec, semestre académico o número de periodo > 0';
        }

        $d = isset($row['semestre_dec']) ? (int) $row['semestre_dec'] : 0;
        if ($d <= 0 && isset($row['semestre'])) {
            $d = (int) $row['semestre'];
        }
        if ($d <= 0) {
            return 'Periodo no semestral requiere semestre_dec o semestre institucional explícito para DEC (no se deduce del número de periodo)';
        }

        return null;
    }

    /**
     * @param array<string,mixed> $row
     *
     * @throws ValidationException
     */
    private function resolverSemestreDecImportacionLegacy(array $row): int
    {
        [$tipo, $num] = $this->resolverPeriodoDesdeFila($row);
        if ($tipo === 'semestre') {
            if (isset($row['semestre_dec']) && (int) $row['semestre_dec'] > 0) {
                return (int) $row['semestre_dec'];
            }
            if (isset($row['semestre']) && (int) $row['semestre'] > 0) {
                return (int) $row['semestre'];
            }
            if ($num > 0) {
                return $num;
            }

            throw ValidationException::withMessages([
                'filas_payload' => ['Fila legacy semestral sin mapeo DEC (semestre_dec / semestre / número periodo).'],
            ]);
        }

        $d = isset($row['semestre_dec']) ? (int) $row['semestre_dec'] : 0;
        if ($d <= 0 && isset($row['semestre'])) {
            $d = (int) $row['semestre'];
        }
        if ($d <= 0) {
            throw ValidationException::withMessages([
                'filas_payload' => ['Periodo no semestral requiere semestre_dec u homólogo institucional para el XML DEC.'],
            ]);
        }

        return $d;
    }

    public function existeDuplicadoPorClaveYCiclo(int $matriculaId, int $cicloId, string $clave, mixed $periodo): bool
    {
        $q = MateriaCursada::query()
            ->where('matricula_id', $matriculaId)
            ->where('ciclo_escolar_id', $cicloId)
            ->where('clave', $clave);

        if ($periodo === null || $periodo === '') {
            $q->where(function ($scope): void {
                $scope->whereNull('periodo')->orWhere('periodo', '');
            });
        } else {
            $q->where('periodo', $periodo);
        }

        return $q->exists();
    }

    /**
     * @param  array<string,mixed>  $row
     * @return array{0: string, 1: int}
     */
    public function resolverPeriodoDesdeFila(array $row): array
    {
        $tipo = strtolower(trim((string) (
            $row['tipo_periodo_curricular']
            ?? $row['tipo_periodo']
            ?? 'semestre'
        )));
        if ($tipo === '') {
            $tipo = 'semestre';
        }
        $num = (int) (
            $row['numero_periodo_curricular']
            ?? $row['semestre']
            ?? $row['periodo_curricular']
            ?? 0
        );

        return [$tipo, $num];
    }

    /** @param  array<string,mixed>  $row */
    private function valorCalificacion(array $row): mixed
    {
        if (isset($row['calificacion']) && $row['calificacion'] !== '' && $row['calificacion'] !== null) {
            return $row['calificacion'];
        }
        if (isset($row['calificacion_final']) && $row['calificacion_final'] !== '' && $row['calificacion_final'] !== null) {
            return $row['calificacion_final'];
        }

        return null;
    }
}
