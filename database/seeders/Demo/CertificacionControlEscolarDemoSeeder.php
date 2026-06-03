<?php

declare(strict_types=1);

namespace Database\Seeders\Demo;

use App\Models\Alumno;
use App\Models\CargaAcademica;
use App\Models\CicloEscolar;
use App\Models\DocumentoAcademico;
use App\Models\DocumentoObservacion;
use App\Models\ImportacionHistoricaMaterias;
use App\Models\InscripcionPeriodo;
use App\Models\Institucion;
use App\Models\Materia;
use App\Models\MateriaCursada;
use App\Models\Matricula;
use App\Models\NivelAcademico;
use App\Models\OfertaAcademica;
use App\Models\PeriodoEscolar;
use App\Models\PlanEstudio;
use App\Models\PlanMateria;
use App\Models\ProgramaEstudio;
use App\Models\Sede;
use App\Models\Subsistema;
use App\Models\TrayectoriaAcademica;
use App\Models\User;
use App\Enums\Certificacion\TipoCertificacion;
use App\Services\Certificacion\CertificacionImportacionLegacyNormativaGate;
use App\Services\ControlEscolar\ResetDemoControlEscolarService;
use Database\Seeders\Concerns\GuardsDemoSeeders;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Sintéticos Control Escolar: ≥50 expedientes usando instituciones/sedes legacy reales ya sembradas.
 */
final class CertificacionControlEscolarDemoSeeder extends Seeder
{
    use GuardsDemoSeeders;

    private CicloEscolar $ciclo;

    private PeriodoEscolar $periodo;

    private PlanEstudio $planNormal;

    private PlanEstudio $planUpn;

    private ProgramaEstudio $progNormal;

    private ProgramaEstudio $progUpn;

    /** @var array<int, array{materia: Materia, plan_materia: PlanMateria}> */
    private array $materiasNorm = [];

    /** @var array<int, array{materia: Materia, plan_materia: PlanMateria}> */
    private array $materiasUpn = [];

    /** @var array<string, array<int, OfertaAcademica>> */
    private array $mapaOfertas = [];

    private OfertaAcademica $ofertaEjemploNormal;

    private User $usuarioControl;

    private int $contadorMatricula = 1;

    /** Coincide con instituciones/subsedes legacy ya cargadas; no crea sedes. */
    /** @var list<array{name: string, patterns: string[]}> */
    private const CATALOGO_SEDES_DEMO = [
        ['name' => 'U.P.N. UNIDAD 151 TOLUCA', 'patterns' => ['%151 TOLUCA%', '%UNIDAD 151%']],
        ['name' => 'U.P.N. UNIDAD 152 ATIZAPÁN', 'patterns' => ['%152 ATIZ%', '%152 ATIZAP%']],
        ['name' => 'U.P.N. UNIDAD 153 ECATEPEC', 'patterns' => ['%153 ECATEPEC%', '%153 ECATE%']],
        ['name' => 'REGIONAL ACAMBAY', 'patterns' => ['%REGIONAL ACAMBAY%']],
        ['name' => 'REGIONAL IXTLAHUACA', 'patterns' => ['%REGIONAL IXTLAHUACA%']],
        ['name' => 'REGIONAL JILOTEPEC', 'patterns' => ['%REGIONAL JILOTEPEC%']],
        ['name' => 'REGIONAL TEJUPILCO', 'patterns' => ['%REGIONAL TEJUPILCO%']],
        ['name' => 'REGIONAL TULTEPEC', 'patterns' => ['%REGIONAL TULTEPEC%']],
        ['name' => 'REGIONAL NEZAHUALCÓYOTL', 'patterns' => ['%REGIONAL NEZAHUALC%', '%REGIONAL NEZAHUALCO%']],
        ['name' => 'REGIONAL NICOLÁS ROMERO', 'patterns' => ['%REGIONAL NICOLÁS ROMERO%', '%REGIONAL NICOLAS ROMERO%']],
        ['name' => 'ESCUELA NORMAL SUPERIOR DEL VALLE DE TOLUCA', 'patterns' => ['%NORMAL SUPERIOR%DE TOLUCA%', '%VALLE DE TOLUCA%']],
        ['name' => 'ESCUELA NORMAL SUPERIOR DEL VALLE DE MÉXICO', 'patterns' => ['%NORMAL SUPERIOR%DE MÉXICO%', '%NORMAL SUPERIOR%DE MEXICO%']],
        ['name' => 'ESCUELA NORMAL RURAL “LÁZARO CÁRDENAS DEL RÍO”', 'patterns' => ['%LÁZARO CÁRDENAS%', '%LAZARO CARDENAS%']],
    ];

    public function run(): void
    {
        $this->ensureDemoSeedersAllowed();

        $normal = Subsistema::query()->where('clave', 'NORMAL')->first();
        $upn = Subsistema::query()->where('clave', 'UPN')->first();

        if ($normal === null || $upn === null) {
            throw new \RuntimeException('Ejecutar SubsistemasSeeder antes: se requiere NORMAL y UPN.');
        }

        $sedes = $this->sedesDesdeCatalogoLegacy();
        foreach ($sedes as $s) {
            $s->loadMissing('institucion.subsistema');
        }

        $nivelLic = NivelAcademico::query()->firstOrCreate(
            ['clave' => 'LIC'],
            ['nombre' => 'Licenciatura', 'tipo' => 'superior', 'orden' => 1, 'activo' => true]
        );

        [$this->progNormal, $this->progUpn] = $this->asegurarProgramasPlanes($normal, $upn, $nivelLic);
        [$this->ciclo, $this->periodo] = $this->asegurarCicloYPeriodo();
        $this->materiasNorm = $this->crearMateriasEnPlanNormal($this->planNormal->id);
        $this->materiasUpn = $this->crearMateriasEnPlanUpn($this->planUpn->id);
        $this->usuarioControl = User::query()->where('email', 'control.escolar@sices.local')->firstOrFail();

        $this->sincronizarAlcanceOperador($sedes);
        $this->mapaOfertas = $this->asegurarOfertas($sedes);
        $primeraNormal = reset($this->mapaOfertas['NORMAL']);
        $this->ofertaEjemploNormal = $primeraNormal instanceof OfertaAcademica
            ? $primeraNormal
            : throw new \RuntimeException('Demo Control Escolar: no existe oferta NORMAL generada.');

        $escenarios = array_merge(
            array_fill(0, 10, 'listo_certificar'),
            array_fill(0, 8, 'sin_matricula'),
            array_fill(0, 7, 'matricula_sin_inscripcion'),
            array_fill(0, 7, 'inscrito_sin_carga'),
            array_fill(0, 6, 'carga_sin_calificaciones'),
            array_fill(0, 4, 'importacion_errores'),
            array_fill(0, 3, 'documento_observaciones'),
            array_fill(0, 3, 'solicitud_revision'),
            array_fill(0, 2, 'legacy_fuera_plan'),
        );

        foreach ($escenarios as $idx => $caso) {
            $sede = $sedes[$idx % count($sedes)];
            $subsistemaActual = $sede->institucion?->subsistema
                ?: throw new \RuntimeException('Sede '.$sede->id.' sin subsistema en institución '.$sede->institucion_id);
            $claveSubs = strtoupper((string) $subsistemaActual->clave);
            $oferta = $this->mapaOfertas[$claveSubs][$sede->id]
                ?? throw new \RuntimeException('Sin oferta demo para sede='.$sede->id.' subsistema='.$claveSubs);
            $alumno = $this->crearAlumnoBase($idx + 1, $caso, $subsistemaActual);
            $this->ejecutarCasoEscenario($caso, $alumno, $oferta, $claveSubs);
        }

        $this->sanearMatriculasDemoUnicaActivaPorAlumno();
    }

    /**
     * @return array{0: CicloEscolar, 1: PeriodoEscolar}
     */
    private function asegurarCicloYPeriodo(): array
    {
        $ciclo = CicloEscolar::query()->updateOrCreate(
            ['clave' => 'SXCE-DEMO-CICLO-2026'],
            [
                'nombre' => 'Ciclo demo Control Escolar 2026',
                'fecha_inicio' => '2026-08-01',
                'fecha_fin' => '2027-07-31',
                'es_actual' => true,
                'activo' => true,
                'metadata' => ResetDemoControlEscolarService::metadata(),
            ],
        );

        $periodo = PeriodoEscolar::query()->updateOrCreate(
            ['clave' => 'SXCE-DEMO-PER-O01'],
            [
                'ciclo_escolar_id' => $ciclo->id,
                'nombre' => 'Periodo ordinario demo (otoño 2026)',
                'fecha_inicio' => '2026-08-01',
                'fecha_fin' => '2026-12-20',
                'estatus' => 'activo',
                'metadata' => ResetDemoControlEscolarService::metadata(),
            ],
        );

        return [$ciclo, $periodo];
    }

    /**
     * @return array{0: ProgramaEstudio, 1: ProgramaEstudio}
     */
    private function asegurarProgramasPlanes(Subsistema $normal, Subsistema $upn, NivelAcademico $nivel): array
    {
        $progNormal = ProgramaEstudio::query()->updateOrCreate(
            ['clave' => 'SXCE-DEMO-PRO-NORM-LIC'],
            [
                'nivel_academico_id' => $nivel->id,
                'subsistema_id' => $normal->id,
                'nombre' => 'Licenciatura en Educación Demo (Normal Planes 2022)',
                'area_conocimiento' => 'Educación',
                'creditos_minimos' => 240,
                'duracion_periodos' => 8,
                'activo' => true,
                'metadata' => ResetDemoControlEscolarService::metadata(['normativa' => 'normal_planes_2022']),
            ],
        );

        $progUpn = ProgramaEstudio::query()->updateOrCreate(
            ['clave' => 'SXCE-DEMO-PRO-UPN-LIC'],
            [
                'nivel_academico_id' => $nivel->id,
                'subsistema_id' => $upn->id,
                'nombre' => 'Licenciatura en Pedagogía Demo (UPN operativa)',
                'area_conocimiento' => 'Pedagogía',
                'creditos_minimos' => 288,
                'duracion_periodos' => 9,
                'activo' => true,
                'metadata' => ResetDemoControlEscolarService::metadata(),
            ],
        );

        $planNormal = PlanEstudio::query()->updateOrCreate(
            ['clave' => 'SXCE-DEMO-PL-NORM-2022'],
            [
                'programa_estudio_id' => $progNormal->id,
                'subsistema_id' => $normal->id,
                'nombre' => 'Plan demo Normal 2022',
                'anio_aprobacion' => 2022,
                'vigencia_inicio' => '2022-08-01',
                'activo' => true,
                'metadata' => ResetDemoControlEscolarService::metadata(),
            ],
        );

        $planUpn = PlanEstudio::query()->updateOrCreate(
            ['clave' => 'SXCE-DEMO-PL-UPN-2025'],
            [
                'programa_estudio_id' => $progUpn->id,
                'subsistema_id' => $upn->id,
                'nombre' => 'Plan demo UPN Licenciatura 2025',
                'anio_aprobacion' => 2025,
                'vigencia_inicio' => '2025-08-01',
                'activo' => true,
                'metadata' => ResetDemoControlEscolarService::metadata(),
            ],
        );

        $this->planNormal = $planNormal;
        $this->planUpn = $planUpn;

        return [$progNormal, $progUpn];
    }

    /** @param  list<Sede>  $sedes */
    private function sincronizarAlcanceOperador(array $sedes): void
    {
        $instIds = collect($sedes)->pluck('institucion_id')->unique()->all();
        $sedeIds = collect($sedes)->pluck('id')->unique()->all();
        $regionIds = Institucion::query()->whereIn('id', $instIds)->whereNotNull('region_id')->pluck('region_id')->unique()->filter()->values()->all();

        $this->usuarioControl->instituciones()->syncWithoutDetaching($instIds);
        $this->usuarioControl->sedes()->syncWithoutDetaching($sedeIds);
        if ($regionIds !== []) {
            $this->usuarioControl->regiones()->syncWithoutDetaching($regionIds);
        }
    }

    /** @param  list<Sede>  $sedes  @return array<string, array<int, OfertaAcademica>> */
    private function asegurarOfertas(array $sedes): array
    {
        /** @var array<string, array<int, OfertaAcademica>> $map */
        $map = ['NORMAL' => [], 'UPN' => []];

        foreach ($sedes as $sede) {
            $inst = Institucion::query()->with('subsistema')->findOrFail((int) $sede->institucion_id);
            $claveSubs = strtoupper((string) $inst->subsistema?->clave);
            if ($claveSubs !== 'NORMAL' && $claveSubs !== 'UPN') {
                throw new \RuntimeException('Subsistema institucional inesperado en sede '.$sede->id.': '.$claveSubs);
            }

            [$programa, $plan] = $claveSubs === 'UPN'
                ? [$this->progUpn, $this->planUpn]
                : [$this->progNormal, $this->planNormal];

            $claveOferta = 'SXCE-OFF'.$sede->id.'-'.$claveSubs.'-'.$this->ciclo->id;

            $metadata = ResetDemoControlEscolarService::metadata(['subsistema_oferta' => $claveSubs]);
            if ($claveSubs === 'UPN') {
                $metadata['modalidad_upn'] = \App\Services\Certificacion\UpnLicenciaturaRulesService::MOD_PRESENCIAL;
            }

            $oferta = OfertaAcademica::withTrashed()->updateOrCreate(
                [
                    'institucion_id' => $inst->id,
                    'sede_id' => $sede->id,
                    'programa_estudio_id' => $programa->id,
                    'plan_estudio_id' => $plan->id,
                    'ciclo_escolar_id' => $this->ciclo->id,
                    'clave' => $claveOferta,
                ],
                [
                    'modalidad' => 'escolarizada',
                    'capacidad' => 320,
                    'activo' => true,
                    'metadata' => $metadata,
                ],
            );
            if ($oferta->trashed()) {
                $oferta->restore();
            }
            $map[$claveSubs][$sede->id] = $oferta;
        }

        return $map;
    }

    /** @return list<Sede> */
    private function sedesDesdeCatalogoLegacy(): array
    {
        /** @var list<Sede> $out */
        $out = [];
        foreach (self::CATALOGO_SEDES_DEMO as $regla) {
            $sede = null;
            foreach ($regla['patterns'] as $like) {
                $sede = Sede::query()
                    ->where('activo', true)
                    ->where('nombre', 'like', $like)
                    ->orderByDesc('legacy_kcve_subsede')
                    ->first();
                if ($sede !== null) {
                    break;
                }
            }
            if ($sede === null) {
                throw new \RuntimeException(
                    'Demo Control Escolar: falta en catálogo la sede ['.$regla['name'].']. Ejecute seeders de instituciones/subsedes legacy.'
                );
            }
            $out[] = $sede;
        }

        return $out;
    }

    private function crearAlumnoBase(int $secuencial, string $scenario, Subsistema $subsistema): Alumno
    {
        $curp = substr(strtoupper(hash('sha256', 'sxcedemo_curp_'.$secuencial.'_'.$subsistema->clave)), 0, 18);

        return Alumno::query()->updateOrCreate(
            ['curp' => $curp],
            [
                'nombre' => 'DemoSynthetic',
                'primer_apellido' => $subsistema->clave,
                'segundo_apellido' => 'Case'.sprintf('%03d', $secuencial),
                'fecha_nacimiento' => sprintf('1998-%02d-%02d', (($secuencial % 12) + 1), (($secuencial % 27) + 1)),
                'genero' => ($secuencial % 2) === 0 ? 'M' : 'F',
                'nacionalidad' => 'MEX',
                'estatus' => 'activo',
                'metadata' => ResetDemoControlEscolarService::metadata([
                    'synthetic_seq' => $secuencial,
                    'scenario' => $scenario,
                    'scenario_subsistema_sede_rotation' => $subsistema->clave,
                ]),
            ]
        );
    }

    private function ejecutarCasoEscenario(string $caso, Alumno $alumno, OfertaAcademica $oferta, string $subsistemaClave): void
    {
        $esUpn = $subsistemaClave === 'UPN';

        switch ($caso) {
            case 'sin_matricula':
                // Matrícula inactiva (baja): sin vigencia operativa pero con vínculo a oferta para alcance territorial del dashboard.
                $matBaja = $this->crearMatricula($alumno, $oferta, $esUpn);
                $metaPrev = (array) ($matBaja->metadata ?? []);
                $matBaja->forceFill([
                    'estado' => 'baja',
                    'metadata' => array_merge($metaPrev, ResetDemoControlEscolarService::metadata(['variacion' => 'sin_matricula_activa'])),
                ])->saveQuietly();
                break;

            case 'legacy_fuera_plan':
                // Caso sólo válido contra plan Normal (reglas de matrícula y legado institucional).
                $ofertaLegacy = $this->ofertaEjemploNormal->fresh(['institucion', 'sede']);
                $mat = $this->crearMatricula($alumno, $ofertaLegacy, false);
                $ins = $this->crearInscripcion($mat);
                $this->crearCargaYCalificaciones($alumno, $mat, $ins, false, false);
                $this->adjuntarMateriaSinPlanFueraLegacy($alumno, $mat, $ins, 'NMLX-'.$alumno->id);
                $imp = ImportacionHistoricaMaterias::query()->create([
                    'user_id' => $this->usuarioControl->id,
                    'matricula_id' => $mat->id,
                    'ciclo_escolar_id' => $this->ciclo->id,
                    'estado' => 'pre_validada',
                    'filas_payload' => [['clave' => 'NMLEG01', 'nombre' => 'Asignatura sintética controlada']],
                    'validacion_payload' => ['tiene_bloqueos' => false],
                    'reconciliacion_payload' => [],
                    'metadata' => ResetDemoControlEscolarService::metadata(['caso_demo' => 'legacy_import']),
                ]);
                CertificacionImportacionLegacyNormativaGate::marcarMatriculaPorImportLegacy(
                    Matricula::query()->findOrFail($mat->id),
                    'Demo: historial importado pendiente_validacion_normativa (sintético)',
                    (int) $imp->id,
                    (int) $this->usuarioControl->id,
                );
                break;

            case 'matricula_sin_inscripcion':
                $this->crearMatricula($alumno, $oferta, $esUpn);
                break;

            case 'inscrito_sin_carga':
                $mat = $this->crearMatricula($alumno, $oferta, $esUpn);
                $this->crearInscripcion($mat);
                break;

            case 'carga_sin_calificaciones':
                $mat = $this->crearMatricula($alumno, $oferta, $esUpn);
                $ins = $this->crearInscripcion($mat);
                $this->crearCargaYCalificaciones($alumno, $mat, $ins, $esUpn, false);
                break;

            case 'importacion_errores':
                $mat = $this->crearMatricula($alumno, $oferta, $esUpn);
                $ins = $this->crearInscripcion($mat);
                $this->crearCargaYCalificaciones($alumno, $mat, $ins, $esUpn, true);
                ImportacionHistoricaMaterias::query()->updateOrCreate(
                    [
                        'matricula_id' => $mat->id,
                        'estado' => 'error',
                    ],
                    [
                        'user_id' => $this->usuarioControl->id,
                        'ciclo_escolar_id' => $this->ciclo->id,
                        'filas_payload' => [['clave' => 'ERR001', 'nombre' => 'Fila sintética con error de conciliación']],
                        'validacion_payload' => [
                            'tiene_bloqueos' => true,
                            'errores' => ['Formato sintético: el registro fuera del plan institucional.'],
                        ],
                        'reconciliacion_payload' => ['estado' => 'pendiente_conciliacion'],
                        'metadata' => ResetDemoControlEscolarService::metadata(['caso_demo' => 'importacion_errores']),
                    ],
                );
                break;

            case 'documento_observaciones':
                $mat = $this->crearMatricula($alumno, $oferta, $esUpn);
                $ins = $this->crearInscripcion($mat);
                $this->crearCargaYCalificaciones($alumno, $mat, $ins, $esUpn, true);
                $inst = Institucion::query()->findOrFail((int) $oferta->institucion_id);
                $sede = Sede::query()->findOrFail((int) $oferta->sede_id);
                $this->crearDocumento($alumno, $mat, $oferta, $inst, $sede, 'en_revision', true);
                TrayectoriaAcademica::query()->updateOrCreate(
                    ['matricula_id' => $mat->id],
                    [
                        'alumno_id' => $alumno->id,
                        'promedio' => $esUpn ? 7 : 9.42,
                        'creditos_obtenidos' => 24,
                        'creditos_totales' => 24,
                        'materias_aprobadas' => 4,
                        'materias_reprobadas' => 0,
                        'estado' => 'consolidada',
                        'metadata' => ResetDemoControlEscolarService::metadata(),
                    ],
                );
                break;

            case 'solicitud_revision':
                $mat = $this->crearMatricula($alumno, $oferta, $esUpn);
                $ins = $this->crearInscripcion($mat);
                $this->crearCargaYCalificaciones($alumno, $mat, $ins, $esUpn, true);
                $inst = Institucion::query()->findOrFail((int) $oferta->institucion_id);
                $sede = Sede::query()->findOrFail((int) $oferta->sede_id);
                $this->crearDocumento($alumno, $mat, $oferta, $inst, $sede, 'en_revision', false);
                TrayectoriaAcademica::query()->updateOrCreate(
                    ['matricula_id' => $mat->id],
                    [
                        'alumno_id' => $alumno->id,
                        'promedio' => $esUpn ? 10 : 9.61,
                        'creditos_obtenidos' => 28,
                        'creditos_totales' => 28,
                        'materias_aprobadas' => 4,
                        'materias_reprobadas' => 0,
                        'estado' => 'consolidada',
                        'metadata' => ResetDemoControlEscolarService::metadata(),
                    ],
                );
                break;

            default:
                $mat = $this->crearMatricula($alumno, $oferta, $esUpn);
                $ins = $this->crearInscripcion($mat);
                $this->crearCargaYCalificaciones($alumno, $mat, $ins, $esUpn, true);
                TrayectoriaAcademica::query()->updateOrCreate(
                    ['matricula_id' => $mat->id],
                    [
                        'alumno_id' => $alumno->id,
                        'promedio' => $esUpn ? 10 : 9.71,
                        'creditos_obtenidos' => 28,
                        'creditos_totales' => 28,
                        'materias_aprobadas' => 4,
                        'materias_reprobadas' => 0,
                        'estado' => 'lista_certificacion',
                        'metadata' => ResetDemoControlEscolarService::metadata(),
                    ],
                );
                break;
        }
    }

    private function crearMatricula(Alumno $alumno, OfertaAcademica $oferta, bool $esUpn): Matricula
    {
        $claveMat = sprintf('DMT-%s-%05d', $esUpn ? 'U' : 'N', $this->contadorMatricula++);
        $metaMat = ResetDemoControlEscolarService::metadata([
            'protocolo' => $esUpn ? 'upn_sin_generador_sep' : 'normal_controlado_institucional',
        ]);

        return Matricula::query()->updateOrCreate(
            ['matricula' => $claveMat],
            [
                'alumno_id' => $alumno->id,
                'oferta_academica_id' => $oferta->id,
                'ciclo_escolar_id' => $this->ciclo->id,
                'estado' => 'activa',
                'fecha_ingreso' => '2026-08-10',
                'metadata' => $metaMat,
            ],
        );
    }

    private function crearInscripcion(Matricula $mat): InscripcionPeriodo
    {
        return InscripcionPeriodo::query()->updateOrCreate(
            [
                'matricula_id' => $mat->id,
                'ciclo_escolar_id' => $this->ciclo->id,
                'periodo_escolar_id' => $this->periodo->id,
                'tipo_periodo_curricular' => 'semestre',
                'numero_periodo_curricular' => 1,
            ],
            [
                'semestre' => 1,
                'tipo_periodo_curricular' => 'semestre',
                'numero_periodo_curricular' => 1,
                'etiqueta_periodo_curricular' => '1.er semestre demo',
                'estatus' => 'activa',
                'fecha_inscripcion' => '2026-08-11',
                'metadata' => ResetDemoControlEscolarService::metadata(),
            ],
        );
    }

    /**
     * @param  array<int, array{materia: Materia, plan_materia: PlanMateria}>  $bloque
     */
    private function crearCargaYCalificaciones(Alumno $alumno, Matricula $mat, InscripcionPeriodo $ins, bool $esUpn, bool $conCalif): void
    {
        $bloque = $esUpn ? $this->materiasUpn : $this->materiasNorm;
        foreach ($bloque as $idx => $fila) {
            $planMateriaId = $fila['plan_materia']->id;
            $carga = CargaAcademica::query()->updateOrCreate(
                ['inscripcion_periodo_id' => $ins->id, 'plan_materia_id' => $planMateriaId],
                [
                    'materia_id' => $fila['materia']->id,
                    'estatus' => 'activa',
                    'metadata' => ResetDemoControlEscolarService::metadata(['orden_demo' => $idx]),
                ],
            );

            if ($conCalif) {
                [$califFinal, $textoOpcional] = $this->valorCalificacionDemo($esUpn, $idx);
            } else {
                $califFinal = null;
                $textoOpcional = null;
            }

            MateriaCursada::query()->updateOrCreate(
                [
                    'alumno_id' => $alumno->id,
                    'matricula_id' => $mat->id,
                    'carga_academica_id' => $carga->id,
                ],
                [
                    'inscripcion_periodo_id' => $ins->id,
                    'plan_materia_id' => $planMateriaId,
                    'materia_id' => $fila['materia']->id,
                    'ciclo_escolar_id' => $this->ciclo->id,
                    'clave' => $fila['materia']->clave,
                    'nombre' => $fila['materia']->nombre,
                    'calificacion' => $califFinal,
                    'calificacion_final' => $califFinal,
                    'calificacion_texto' => $textoOpcional,
                    'tipo_periodo_curricular' => 'semestre',
                    'numero_periodo_curricular' => 1,
                    'etiqueta_periodo_curricular' => '1.er sem',
                    'periodo' => 'DEMO-O1',
                    'creditos' => (int) $fila['materia']->creditos,
                    'semestre' => 1,
                    'orden' => $idx + 1,
                    'estado' => 'final',
                    'estatus_acreditacion' => $conCalif ? 'acreditada' : 'pendiente',
                    'metadata' => ResetDemoControlEscolarService::metadata(),
                ],
            );
        }
    }

    /** @return array{0: ?float, 1: ?string} */
    private function valorCalificacionDemo(bool $esUpn, int $idx): array
    {
        if ($esUpn) {
            $valor = ([7, 8, 6, 10])[$idx % 4];
            return [(float) $valor, null];
        }

        $dec = ([8.0, 9.25, 7.83, 8.71])[$idx % 4];

        return [$dec, null];
    }

    private function adjuntarMateriaSinPlanFueraLegacy(Alumno $alumno, Matricula $mat, InscripcionPeriodo $ins, string $claveUnica): void
    {
        MateriaCursada::query()->updateOrCreate(
            [
                'alumno_id' => $alumno->id,
                'matricula_id' => $mat->id,
                'ciclo_escolar_id' => $this->ciclo->id,
                'clave' => $claveUnica,
                'periodo' => 'LEG-CTRL',
                'tipo_periodo_curricular' => 'semestre',
                'numero_periodo_curricular' => 1,
                'plan_materia_id' => null,
                'carga_academica_id' => null,
            ],
            [
                'inscripcion_periodo_id' => $ins->id,
                'materia_id' => null,
                'nombre' => 'Asignatura histórica sintética fuera de plan (solo demo)',
                'creditos' => 4,
                'semestre' => 1,
                'calificacion' => 9.50,
                'calificacion_final' => 9.50,
                'estado' => 'final',
                'estatus_acreditacion' => 'pendiente_revision',
                'metadata' => [
                    'origen' => CertificacionImportacionLegacyNormativaGate::META_ORIGEN_LEGACY,
                    'demo_dataset' => ResetDemoControlEscolarService::DATASET,
                    'scenario' => 'legacy_control_demo',
                ],
            ],
        );
    }

    private function crearDocumento(
        Alumno $alumno,
        Matricula $mat,
        OfertaAcademica $oferta,
        Institucion $institucion,
        Sede $sede,
        string $workflow,
        bool $observaciones
    ): DocumentoAcademico {
        $doc = DocumentoAcademico::query()->updateOrCreate(
            ['matricula_id' => $mat->id, 'tipo_documento' => 'certificado'],
            [
                'alumno_id' => $alumno->id,
                'oferta_academica_id' => $oferta->id,
                'ciclo_escolar_id' => $this->ciclo->id,
                'subsistema_id' => $institucion->subsistema_id,
                'institucion_id' => $institucion->id,
                'sede_id' => $sede->id,
                'region_id' => $institucion->region_id,
                'tipo_certificacion' => TipoCertificacion::TERMINO->value,
                'folio_interno' => 'SXCE-DEMO-'.$mat->id,
                'estado_workflow' => $workflow,
                'estado_cadena' => 'no_generada',
                'estado_xml' => 'no_generado',
                'estado_firma' => 'no_firmado',
                'estado_sep' => 'no_enviado',
                'estado_pdf' => 'no_generado',
                'fecha_solicitud' => now(),
                'created_by' => $this->usuarioControl->id,
                'metadata' => ResetDemoControlEscolarService::metadata(),
            ],
        );

        if ($observaciones) {
            DocumentoObservacion::query()->updateOrCreate(
                ['documento_academico_id' => $doc->id, 'estado' => 'pendiente'],
                [
                    'tipo' => 'academica',
                    'seccion' => 'calificaciones',
                    'observacion' => 'Atender revisión sintética: conciliación de promedio y créditos (demo_control_escolar).',
                    'prioridad' => 'alta',
                    'creada_por' => $this->usuarioControl->id,
                    'metadata' => ResetDemoControlEscolarService::metadata(['scenario' => 'documento_observaciones']),
                ],
            );
        }

        return $doc;
    }

    /** @return array<int, array{materia: Materia, plan_materia: PlanMateria}> */
    private function crearMateriasEnPlanNormal(int $planId): array
    {
        $bloque = [
            ['clave' => 'DEN101', 'nombre' => 'Didáctica de la Normalidad', 'cred' => 6],
            ['clave' => 'DEN102', 'nombre' => 'Práctica docente inicial', 'cred' => 6],
            ['clave' => 'DEN103', 'nombre' => 'Evaluación formativa institucional', 'cred' => 6],
            ['clave' => 'DEN104', 'nombre' => 'Planeación pedagógica del aula demo', 'cred' => 6],
        ];

        return $this->materializarPlan($planId, $bloque);
    }

    /** @return array<int, array{materia: Materia, plan_materia: PlanMateria}> */
    private function crearMateriasEnPlanUpn(int $planId): array
    {
        $bloque = [
            ['clave' => 'DEP101', 'nombre' => 'Fundamentos de la pedagogía UPN (demo)', 'cred' => 6],
            ['clave' => 'DEP102', 'nombre' => 'Práctica comunitaria I (demo)', 'cred' => 6],
            ['clave' => 'DEP103', 'nombre' => 'Metodologías dialógicas demo', 'cred' => 6],
            ['clave' => 'DEP104', 'nombre' => 'Evaluación educativa contemporánea (demo)', 'cred' => 6],
        ];

        return $this->materializarPlan($planId, $bloque);
    }

    /**
     * @param  list<array{clave: string, nombre: string, cred: int}>  $bloque
     * @return array<int, array{materia: Materia, plan_materia: PlanMateria}>
     */
    private function materializarPlan(int $planId, array $bloque): array
    {
        $out = [];
        foreach ($bloque as $orden => $row) {
            $materia = Materia::query()->updateOrCreate(
                ['plan_estudio_id' => $planId, 'clave' => $row['clave']],
                [
                    'nombre' => $row['nombre'],
                    'creditos' => $row['cred'],
                    'semestre' => 1,
                    'orden' => $orden + 1,
                    'tipo' => 'obligatoria',
                    'estatus' => 'activa',
                    'metadata' => ResetDemoControlEscolarService::metadata(),
                ]
            );

            $pm = PlanMateria::query()->updateOrCreate(
                ['plan_estudio_id' => $planId, 'materia_id' => $materia->id],
                [
                    'clave_materia' => $row['clave'],
                    'nombre_materia' => $row['nombre'],
                    'semestre' => 1,
                    'orden' => $orden + 1,
                    'tipo_periodo_curricular' => 'semestre',
                    'numero_periodo_curricular' => 1,
                    'etiqueta_periodo_curricular' => '1.er sem demo',
                    'creditos' => $row['cred'],
                    'obligatoria' => true,
                    'estatus' => 'activa',
                    'metadata' => ResetDemoControlEscolarService::metadata(),
                ],
            );

            $out[] = ['materia' => $materia, 'plan_materia' => $pm];
        }

        return $out;
    }

    private function sanearMatriculasDemoUnicaActivaPorAlumno(): void
    {
        $activos = ['activa', 'suspendida'];
        $ids = DB::table('matriculas')
            ->whereNull('deleted_at')
            ->whereIn('estado', $activos)
            ->groupBy('alumno_id')
            ->havingRaw('COUNT(*) > 1')
            ->pluck('alumno_id');

        foreach ($ids as $aid) {
            if (! Alumno::withTrashed()->whereKey((int) $aid)->where('metadata->origen', ResetDemoControlEscolarService::ORIGEN)->exists()) {
                continue;
            }

            Matricula::withTrashed()
                ->whereNull('deleted_at')
                ->where('alumno_id', $aid)
                ->where('matricula', 'like', 'DMT-%')
                ->whereIn('estado', $activos)
                ->orderBy('id')
                ->skip(1)
                ->take(PHP_INT_MAX)
                ->get()
                ->each(static fn (Matricula $m) => $m->forceFill(['estado' => 'baja'])->saveQuietly());
        }
    }
}
