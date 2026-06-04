<?php

declare(strict_types=1);

namespace App\Services\Importacion;

use App\Models\Institucion;
use App\Models\Materia;
use App\Models\NivelAcademico;
use App\Models\OfertaAcademica;
use App\Models\PlanEstudio;
use App\Models\PlanMateria;
use App\Models\ProgramaEstudio;
use App\Models\Region;
use App\Models\Sede;
use App\Models\Subsistema;
use App\Support\Importacion\SiseesLegacyReadGuard;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;

final class SiseesCatalogosImportService
{
    private const ORIGEN = 'import_sisees_legacy';

    public const MOTIVO_INACTIVO = 'inactivo';

    public const MOTIVO_DUPLICADO = 'duplicado';

    public const MOTIVO_RELACION_FALTANTE = 'relacion_faltante';

    public const MOTIVO_PROGRAMA_NO_RESUELTO = 'programa_no_resuelto';

    public const MOTIVO_PLAN_NO_RESUELTO = 'plan_no_resuelto';

    public const MOTIVO_MATERIA_NO_RESUELTA = 'materia_no_resuelta';

    public const MOTIVO_NIVEL_NO_RESUELTO = 'nivel_academico_no_resuelto';

    public const MOTIVO_INSTITUCION_NO_RESUELTA = 'institucion_no_resuelta';

    public const MOTIVO_MODALIDAD_NO_RESUELTA = 'modalidad_no_resuelta';

    public const MOTIVO_COLUMNAS_FALTANTES = 'columnas_faltantes';

    public const MOTIVO_REGLA_NEGOCIO = 'regla_negocio';

    public const MOTIVO_DUPLICADO_NATURAL = 'duplicado_natural';

    public const MOTIVO_SEDE_NO_RESUELTA = 'sede_no_resuelta';

    /** @var list<array<string, mixed>> */
    private array $clavesMateriaGeneradas = [];

    /** @var int candidatos de oferta que quedarían sin sede_id (debe ser 0 antes de confirm) */
    private int $ofertasInsertSinSede = 0;
    private array $resumenes = [];

    /** @var array<int, true> programa_estudios legacy importable (activo + nivel) */
    private array $programasImportables = [];

    /** @var array<int, true> plan_estudios legacy importable */
    private array $planesImportables = [];

    private ?int $planCatalogoMateriaId = null;

    /** @var array<string, Subsistema> */
    private array $subsistemas = [];

    /** @var array<int, array<string, mixed>> */
    private array $legacyInstitucion = [];

    /** @var array<int, array<string, mixed>> */
    private array $legacyOferta = [];

    /** @var array<int, array<string, mixed>> */
    private array $legacyPrograma = [];

    /** @var array<int, array<string, mixed>> */
    private array $legacyPlan = [];

    /** @var array<int, array<string, mixed>> */
    private array $legacyMateria = [];

    /** @var array<int, array<string, mixed>> */
    private array $legacyPeriodoPrograma = [];

    /** @var array<int, array<string, mixed>> */
    private array $legacyMateriaPeriodo = [];

    /** @var array<int, array<string, mixed>> */
    private array $legacyProgramaInstitucion = [];

    /** @var array<int, array<string, mixed>> */
    private array $legacyModalidad = [];

    /** @var array<int, list<int>> materia_id => plan_estudios_id[] */
    private array $planesPorMateriaLegacy = [];

    /** @var array<int, list<int>> programa_estudios_id => plan_estudios_id[] */
    private array $planesPorProgramaLegacy = [];

    /** @var array<string, string> clave normalizada nivel */
    private array $nivelClavePorOfertaLegacy = [];

    /** @var array<int, int> legacy institucion id simulado/creado */
    private array $mapInstitucionLegacy = [];

    /** @var array<int, int> legacy sede id */
    private array $mapSedeLegacy = [];

    /** @var array<int, int> */
    private array $mapProgramaLegacy = [];

    /** @var array<int, int> */
    private array $mapPlanLegacy = [];

    /** @var array<int, int> legacy materia -> sices materia id (primer plan) */
    private array $mapMateriaLegacy = [];

    public function __construct(
        private readonly SiseesLegacyReadGuard $legacy = new SiseesLegacyReadGuard,
        private readonly SiseesCatalogosImportReportWriter $reportWriter = new SiseesCatalogosImportReportWriter,
        private readonly SiseesCatalogosImportRollbackService $rollbackService = new SiseesCatalogosImportRollbackService,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function ejecutar(bool $confirm, bool $rollbackImportacion = false): array
    {
        if ($rollbackImportacion) {
            return $this->rollbackService->ejecutar($confirm);
        }

        $reporte = $this->crearReporteBase($confirm);

        $this->legacy->assertDatabaseReachable();
        $this->escanearTablasLegacy($reporte);
        $this->cargarSubsistemasBase();
        $this->cargarDatosLegacyEnMemoria($reporte);
        $this->ejecutarPreflight($reporte);
        $this->analizarPreflightPlanMateriasYOfertas($reporte);

        $this->ejecutarPipeline(false, $reporte);
        $this->sincronizarResumenAlReporte($reporte);
        $this->actualizarPreflightConResultadoImport($reporte);
        $this->validarContabilidadReporte($reporte);
        $this->actualizarPreflightPostSimulacion($reporte);
        $this->validarErroresBloqueantes($reporte);

        if ($confirm) {
            if (($reporte['errores_bloqueantes'] ?? []) !== []) {
                $reporte['transaccion'] = [
                    'estado' => 'abortada_preflight',
                    'mensaje' => 'No se escribió nada: corrija errores bloqueantes y ejecute dry-run.',
                ];
                $reporte['reportes'] = $this->reportWriter->escribir($reporte);
                throw new RuntimeException(
                    'Importación abortada antes de escribir: '.implode(' ', $reporte['errores_bloqueantes']),
                );
            }

            $reporte['transaccion'] = ['estado' => 'iniciada'];

            try {
                DB::transaction(function () use (&$reporte): void {
                    $this->reiniciarEstadoImportacion($reporte);
                    $this->ejecutarPipeline(true, $reporte);
                    $this->sincronizarResumenAlReporte($reporte);
                    $this->validarContabilidadReporte($reporte);
                    $this->validarErroresBloqueantes($reporte);

                    if (($reporte['errores_criticos'] ?? []) !== [] || ($reporte['errores_bloqueantes'] ?? []) !== []) {
                        throw new RuntimeException(
                            'Validación post-importación falló dentro de la transacción.',
                        );
                    }
                });
                $reporte['transaccion']['estado'] = 'confirmada';
            } catch (\Throwable $e) {
                $reporte['transaccion'] = [
                    'estado' => 'rollback_por_error',
                    'error' => $e->getMessage(),
                    'mensaje' => 'Importación abortada: rollback completo aplicado. No quedó importación parcial.',
                ];
                $reporte['reportes'] = $this->reportWriter->escribir($reporte);
                throw new RuntimeException(
                    'Importación abortada (rollback). '.$e->getMessage(),
                    previous: $e,
                );
            }
        } else {
            $reporte['transaccion'] = ['estado' => 'dry-run'];
        }

        $reporte['claves_materia_generadas'] = $this->clavesMateriaGeneradas;
        $reporte['reportes'] = $this->reportWriter->escribir($reporte);

        return $reporte;
    }

    /**
     * @param  array<string, mixed>  $reporte
     */
    private function ejecutarPipeline(bool $confirm, array &$reporte): void
    {
        $this->procesarNiveles($confirm, $reporte);
        $this->procesarInstituciones($confirm, $reporte);
        $this->procesarSedes($confirm, $reporte);
        $this->procesarProgramas($confirm, $reporte);
        $this->reconstruirProgramasImportables();
        $this->procesarPlanes($confirm, $reporte);
        $this->reconstruirPlanesImportables();
        $this->procesarMaterias($confirm, $reporte);
        $this->procesarPlanMaterias($confirm, $reporte);
        $this->procesarOfertas($confirm, $reporte);
    }

    /**
     * @param  array<string, mixed>  $reporte
     */
    private function reiniciarEstadoImportacion(array &$reporte): void
    {
        $this->clavesMateriaGeneradas = [];
        $this->ofertasInsertSinSede = 0;
        $this->resumenes = [];
        foreach (config('sisees_catalogos.entidades_resumen', []) as $entidad) {
            $this->resumenes[$entidad] = SiseesCatalogosEntidadResumen::crear((string) $entidad);
        }
        $this->programasImportables = [];
        $this->planesImportables = [];
        $this->planCatalogoMateriaId = null;
        $this->mapInstitucionLegacy = [];
        $this->mapSedeLegacy = [];
        $this->mapProgramaLegacy = [];
        $this->mapPlanLegacy = [];
        $this->mapMateriaLegacy = [];
        $reporte['errores_criticos'] = [];
        $reporte['errores_bloqueantes'] = [];
        $reporte['totales']['errores_criticos'] = 0;
    }

    /**
     * @return array<string, mixed>
     */
    private function crearReporteBase(bool $confirm): array
    {
        $this->resumenes = [];
        $resumen = [];
        foreach (config('sisees_catalogos.entidades_resumen', []) as $entidad) {
            $this->resumenes[$entidad] = SiseesCatalogosEntidadResumen::crear((string) $entidad);
            $resumen[$entidad] = $this->resumenes[$entidad]->toArray();
        }

        return [
            'modo' => $confirm ? 'confirm' : 'dry-run',
            'generado_en' => now()->toIso8601String(),
            'origen' => $this->origenConexion(),
            'tablas_legacy' => [],
            'preflight' => [],
            'resumen' => $resumen,
            'advertencias' => [],
            'errores' => [],
            'errores_criticos' => [],
            'errores_bloqueantes' => [],
            'transaccion' => ['estado' => 'pendiente'],
            'claves_materia_generadas' => [],
            'totales' => [
                'advertencias' => 0,
                'errores_criticos' => 0,
                'errores_bloqueantes' => 0,
            ],
        ];
    }

    private function ent(string $clave): SiseesCatalogosEntidadResumen
    {
        if (! isset($this->resumenes[$clave])) {
            $this->resumenes[$clave] = SiseesCatalogosEntidadResumen::crear($clave);
        }

        return $this->resumenes[$clave];
    }

    /**
     * @param  array<string, mixed>  $reporte
     */
    private function sincronizarResumenAlReporte(array &$reporte): void
    {
        foreach ($this->resumenes as $clave => $resumen) {
            $reporte['resumen'][$clave] = $resumen->toArray();
        }
    }

    /**
     * @param  array<string, mixed>  $reporte
     */
    private function actualizarPreflightConResultadoImport(array &$reporte): void
    {
        $planes = $this->ent('planes_estudio');
        $huerfanos = $reporte['preflight']['planes_huérfanos_legacy'] ?? [];
        if ($huerfanos === []) {
            return;
        }

        $arr = $planes->toArray();
        $motivos = $arr['omitidos_por_motivo'] ?? [];
        $omitProg = (int) ($motivos[self::MOTIVO_PROGRAMA_NO_RESUELTO] ?? 0);
        $esperado = (int) ($huerfanos['planes_huérfanos_activos'] ?? 0) + (int) ($huerfanos['planes_programa_inactivo'] ?? 0);

        $reporte['preflight']['planes_huérfanos_legacy']['resultado_import'] = [
            'planes_leidos' => $planes->leidos,
            'planes_insertar' => $planes->insertar,
            'planes_omitidos_total' => $planes->omitidos,
            'omitidos_por_motivo' => $motivos,
            'omitidos_programa_no_resuelto' => $omitProg,
            'clasificacion_correcta' => $omitProg === $esperado,
        ];
    }

    /**
     * @param  array<string, mixed>  $reporte
     */
    private function analizarPreflightPlanMateriasYOfertas(array &$reporte): void
    {
        $tablaMp = (string) config('sisees_catalogos.tables.materia_periodo');
        $conClaveVacia = 0;
        $clavesGeneradasEstimadas = 0;
        $duplicadasLlaveNatural = 0;
        $vistosNatural = [];

        foreach ($this->legacyMateriaPeriodo as $mpId => $mp) {
            if (! $this->statusActivo($mp['status'] ?? null)) {
                continue;
            }
            $claveInfo = $this->resolverClaveMateriaPlanImport($mp, (int) ($mp['materia_id'] ?? 0), (int) $mpId);
            if ($claveInfo['generada']) {
                $conClaveVacia++;
                $clavesGeneradasEstimadas++;
            }

            $periodoId = (int) ($mp['periodo_programa_id'] ?? 0);
            $periodo = $this->legacyPeriodoPrograma[$periodoId] ?? null;
            if ($periodo === null) {
                continue;
            }
            $planLegacyId = (int) ($periodo['plan_estudios_id'] ?? 0);
            $tipo = $this->tipoPeriodoCurricularDesdeLegacy($periodo, $planLegacyId);
            $num = max(1, (int) ($periodo['numero_periodo'] ?? $mp['periodo'] ?? 1));
            $natural = $planLegacyId.'|'.$claveInfo['clave'].'|'.$tipo.'|'.$num;
            if (isset($vistosNatural[$natural])) {
                $duplicadasLlaveNatural++;
            }
            $vistosNatural[$natural] = true;
        }

        $reporte['preflight']['plan_materias_con_clave_vacia'] = $conClaveVacia;
        $reporte['preflight']['plan_materias_claves_tecnicas_estimadas'] = $clavesGeneradasEstimadas;
        $reporte['preflight']['plan_materias_duplicadas_por_llave_natural'] = $duplicadasLlaveNatural;
        $reporte['preflight']['plan_materias_tabla_legacy'] = $tablaMp;
    }

    /**
     * @param  array<string, mixed>  $reporte
     */
    private function actualizarPreflightPostSimulacion(array &$reporte): void
    {
        $ofertas = $this->ent('ofertas_academicas');
        $arr = $ofertas->toArray();
        $motivos = $arr['omitidos_por_motivo'] ?? [];
        $pmArr = $this->ent('plan_materias')->toArray();

        $reporte['preflight']['ofertas_academicas_sin_sede'] = (int) ($motivos[self::MOTIVO_SEDE_NO_RESUELTA] ?? 0);
        $reporte['preflight']['ofertas_academicas_con_sede_resuelta'] = $ofertas->insertar + $ofertas->actualizar;
        $reporte['preflight']['ofertas_academicas_omitidas_sede_no_resuelta'] = (int) ($motivos[self::MOTIVO_SEDE_NO_RESUELTA] ?? 0);
        $reporte['preflight']['plan_materias_omitidos_duplicado_natural'] = (int) ($pmArr['omitidos_por_motivo'][self::MOTIVO_DUPLICADO_NATURAL] ?? 0);
        $reporte['preflight']['plan_materias_claves_generadas_en_simulacion'] = count($this->clavesMateriaGeneradas);
    }

    /**
     * @param  array<string, mixed>  $reporte
     */
    private function validarErroresBloqueantes(array &$reporte): void
    {
        $bloqueantes = [];

        if ($this->ofertasInsertSinSede > 0) {
            $bloqueantes[] = sprintf(
                'ofertas_academicas: %d candidato(s) a insertar tendrían sede_id null (prohibido).',
                $this->ofertasInsertSinSede,
            );
        }

        foreach ($reporte['errores_criticos'] ?? [] as $err) {
            $bloqueantes[] = $err;
        }

        $reporte['errores_bloqueantes'] = array_values(array_unique($bloqueantes));
        $reporte['totales']['errores_bloqueantes'] = count($reporte['errores_bloqueantes']);
    }

    /**
     * @param  array<string, mixed>  $row
     * @return array{clave: string, generada: bool, original: string|null}
     */
    private function resolverClaveMateriaPlanImport(array $mp, int $materiaLegacyId, int $mpId): array
    {
        $raw = trim((string) ($mp['clave_materia'] ?? ''));
        $norm = strtolower($raw);
        $invalidas = ['', '-', '--', '—', 'n/a', 'na', 's/n', 'sn', '.', '*'];

        if (in_array($norm, $invalidas, true) || strlen($raw) <= 1) {
            return [
                'clave' => 'SINCLAVE-MAT-'.$materiaLegacyId.'-MP-'.$mpId,
                'generada' => true,
                'original' => $raw === '' ? null : $raw,
            ];
        }

        return [
            'clave' => mb_substr($raw, 0, 40),
            'generada' => false,
            'original' => $raw,
        ];
    }

    /**
     * @param  array<string, mixed>  $reporte
     */
    private function validarContabilidadReporte(array &$reporte): void
    {
        foreach ($this->resumenes as $resumen) {
            foreach ($resumen->validarContabilidad() as $err) {
                $reporte['errores_criticos'][] = $err;
            }
        }

        $reporte['totales']['advertencias'] = count($reporte['advertencias'] ?? []);
        $reporte['totales']['errores_criticos'] = count($reporte['errores_criticos'] ?? []);
    }

    /**
     * @param  array<string, mixed>  $reporte
     */
    private function escanearTablasLegacy(array &$reporte): void
    {
        $tables = config('sisees_catalogos.tables', []);
        foreach ($tables as $clave => $tabla) {
            $tabla = (string) $tabla;
            $reporte['tablas_legacy'][$clave] = [
                'tabla' => $tabla,
                'existe' => $this->legacy->hasTable($tabla),
                'registros' => $this->legacy->countRows($tabla),
                'columnas' => $this->legacy->columnListing($tabla),
            ];
        }
    }

    private function cargarSubsistemasBase(): void
    {
        foreach (['UPN', 'NORMAL'] as $clave) {
            $sub = Subsistema::query()->where('clave', $clave)->first();
            if ($sub === null) {
                throw new RuntimeException("Subsistema «{$clave}» no existe. Ejecute php artisan db:seed primero.");
            }
            $this->subsistemas[$clave] = $sub;
        }
    }

    /**
     * @param  array<string, mixed>  $reporte
     */
    private function cargarDatosLegacyEnMemoria(array &$reporte): void
    {
        $t = config('sisees_catalogos.tables');

        $this->legacyInstitucion = $this->indexarPorId($this->legacy->selectAll((string) $t['institucion']));
        $this->legacyOferta = $this->indexarPorId($this->legacy->selectAll((string) $t['oferta_educativa']));
        $this->legacyPrograma = $this->indexarPorId($this->legacy->selectAll((string) $t['programa_estudios']));
        $this->legacyPlan = $this->indexarPorId($this->legacy->selectAll((string) $t['plan_estudios']));
        $this->legacyMateria = $this->indexarPorId($this->legacy->selectAll((string) $t['materia']));
        $this->legacyPeriodoPrograma = $this->indexarPorId($this->legacy->selectAll((string) $t['periodo_programa_estudios']));
        $this->legacyMateriaPeriodo = $this->indexarPorId($this->legacy->selectAll((string) $t['materia_periodo']));
        $this->legacyProgramaInstitucion = $this->indexarPorId($this->legacy->selectAll((string) $t['programa_estudios_institucion']));
        $this->legacyModalidad = $this->indexarPorId($this->legacy->selectAll((string) $t['modalidad']));

        foreach ($this->legacyPlan as $planId => $row) {
            $progId = (int) ($row['programa_estudios_id'] ?? 0);
            if ($progId > 0) {
                $this->planesPorProgramaLegacy[$progId][] = $planId;
            }
        }

        foreach ($this->legacyMateriaPeriodo as $mp) {
            if (! $this->statusActivo($mp['status'] ?? null)) {
                continue;
            }
            $periodoId = (int) ($mp['periodo_programa_id'] ?? 0);
            $materiaId = (int) ($mp['materia_id'] ?? 0);
            $periodo = $this->legacyPeriodoPrograma[$periodoId] ?? null;
            if ($periodo === null || $materiaId <= 0) {
                continue;
            }
            $planId = (int) ($periodo['plan_estudios_id'] ?? 0);
            if ($planId > 0) {
                $this->planesPorMateriaLegacy[$materiaId][$planId] = $planId;
            }
        }
        foreach ($this->planesPorMateriaLegacy as $mid => $planes) {
            $this->planesPorMateriaLegacy[$mid] = array_values($planes);
        }
    }

    /**
     * @param  array<string, mixed>  $reporte
     */
    private function ejecutarPreflight(array &$reporte): void
    {
        $pf = [
            'conteos_por_status' => [],
            'integridad_referencial' => [],
            'bloquear_confirm' => false,
        ];

        $tablas = [
            'institucion' => $this->legacyInstitucion,
            'oferta_educativa' => $this->legacyOferta,
            'programa_estudios' => $this->legacyPrograma,
            'plan_estudios' => $this->legacyPlan,
            'materia' => $this->legacyMateria,
            'periodo_programa_estudios' => $this->legacyPeriodoPrograma,
            'materia_periodo' => $this->legacyMateriaPeriodo,
            'programa_estudios_institucion' => $this->legacyProgramaInstitucion,
            'modalidad' => $this->legacyModalidad,
        ];

        foreach ($tablas as $nombre => $filas) {
            $activos = 0;
            $inactivos = 0;
            foreach ($filas as $row) {
                if ($this->statusActivo($row['status'] ?? null)) {
                    $activos++;
                } else {
                    $inactivos++;
                }
            }
            $pf['conteos_por_status'][$nombre] = [
                'total' => count($filas),
                'activos' => $activos,
                'inactivos' => $inactivos,
            ];
        }

        $progIds = array_map('intval', array_keys($this->legacyPrograma));
        $progIdMin = $progIds !== [] ? min($progIds) : 0;
        $progIdMax = $progIds !== [] ? max($progIds) : 0;

        $planesProgInexistente = [];
        $planesProgramaInactivo = [];
        $progHuerfanosMin = null;
        $progHuerfanosMax = null;

        foreach ($this->legacyPlan as $planId => $row) {
            if (! $this->statusActivo($row['status'] ?? null)) {
                continue;
            }
            $progId = (int) ($row['programa_estudios_id'] ?? 0);
            if ($progId > 0 && ! isset($this->legacyPrograma[$progId])) {
                $planesProgInexistente[] = [
                    'plan_id' => $planId,
                    'programa_estudios_id' => $progId,
                    'tipo' => 'huérfano_real',
                ];
                $progHuerfanosMin = $progHuerfanosMin === null ? $progId : min($progHuerfanosMin, $progId);
                $progHuerfanosMax = $progHuerfanosMax === null ? $progId : max($progHuerfanosMax, $progId);

                continue;
            }
            if ($progId > 0 && isset($this->legacyPrograma[$progId]) && ! $this->statusActivo($this->legacyPrograma[$progId]['status'] ?? null)) {
                $planesProgramaInactivo[] = [
                    'plan_id' => $planId,
                    'programa_estudios_id' => $progId,
                    'tipo' => 'programa_inactivo',
                ];
            }
        }

        $planesActivosTotal = (int) ($pf['conteos_por_status']['plan_estudios']['activos'] ?? count($this->legacyPlan));
        $planesImportablesEstimados = $planesActivosTotal - count($planesProgInexistente) - count($planesProgramaInactivo);

        $mpMateriaInexistente = [];
        $mpPeriodoInexistente = [];
        foreach ($this->legacyMateriaPeriodo as $mpId => $mp) {
            $mid = (int) ($mp['materia_id'] ?? 0);
            $pid = (int) ($mp['periodo_programa_id'] ?? 0);
            if ($mid > 0 && ! isset($this->legacyMateria[$mid])) {
                $mpMateriaInexistente[] = ['materia_periodo_id' => $mpId, 'materia_id' => $mid];
            }
            if ($pid > 0 && ! isset($this->legacyPeriodoPrograma[$pid])) {
                $mpPeriodoInexistente[] = ['materia_periodo_id' => $mpId, 'periodo_programa_id' => $pid];
            }
        }

        $periodoPlanInexistente = [];
        foreach ($this->legacyPeriodoPrograma as $ppId => $pp) {
            $planId = (int) ($pp['plan_estudios_id'] ?? 0);
            if ($planId > 0 && ! isset($this->legacyPlan[$planId])) {
                $periodoPlanInexistente[] = ['periodo_programa_id' => $ppId, 'plan_estudios_id' => $planId];
            }
        }

        $peiRefsInvalidas = ['institucion' => [], 'programa' => [], 'modalidad' => []];
        foreach ($this->legacyProgramaInstitucion as $peiId => $pei) {
            $instId = (int) ($pei['institucion_id'] ?? 0);
            $progId = (int) ($pei['programa_estudios_id'] ?? 0);
            $modId = (int) ($pei['modalidad_id'] ?? 0);
            if ($instId > 0 && ! isset($this->legacyInstitucion[$instId])) {
                $peiRefsInvalidas['institucion'][] = ['pei_id' => $peiId, 'institucion_id' => $instId];
            }
            if ($progId > 0 && ! isset($this->legacyPrograma[$progId])) {
                $peiRefsInvalidas['programa'][] = ['pei_id' => $peiId, 'programa_estudios_id' => $progId];
            }
            if ($modId > 0 && ! isset($this->legacyModalidad[$modId])) {
                $peiRefsInvalidas['modalidad'][] = ['pei_id' => $peiId, 'modalidad_id' => $modId];
            }
        }

        $mpTotal = count($this->legacyMateriaPeriodo);
        $mpValidas = $mpTotal - count($mpMateriaInexistente) - count($mpPeriodoInexistente);

        $pf['planes_huérfanos_legacy'] = [
            'descripcion' => 'Planes activos cuyo programa_estudios_id no existe en programa_estudios (huérfanos reales del dump). No se importan ni se crean programas padre.',
            'programa_estudios_catalogo' => [
                'total_registros' => count($this->legacyPrograma),
                'id_min' => $progIdMin,
                'id_max' => $progIdMax,
                'activos' => (int) ($pf['conteos_por_status']['programa_estudios']['activos'] ?? 0),
                'inactivos' => (int) ($pf['conteos_por_status']['programa_estudios']['inactivos'] ?? 0),
            ],
            'plan_estudios_activos_total' => $planesActivosTotal,
            'planes_huérfanos_activos' => count($planesProgInexistente),
            'planes_programa_inactivo' => count($planesProgramaInactivo),
            'planes_importables_estimados' => max(0, $planesImportablesEstimados),
            'programa_estudios_id_huérfanos_rango' => [
                'desde' => $progHuerfanosMin,
                'hasta' => $progHuerfanosMax,
            ],
            'motivo_omision_importador' => self::MOTIVO_PROGRAMA_NO_RESUELTO,
            'accion' => 'excluidos_del_import',
            'bloquea_importacion' => false,
            'muestras_planes_huérfanos' => array_slice($planesProgInexistente, 0, 15),
            'muestras_planes_programa_inactivo' => $planesProgramaInactivo,
        ];

        $pf['integridad_referencial'] = [
            'planes_programa_estudios_id_inexistente' => [
                'invalidos' => count($planesProgInexistente),
                'validos' => max(0, $planesActivosTotal - count($planesProgInexistente) - count($planesProgramaInactivo)),
                'huérfanos_reales' => count($planesProgInexistente),
                'programa_inactivo' => count($planesProgramaInactivo),
                'muestras' => array_slice($planesProgInexistente, 0, 20),
            ],
            'materia_periodo_materia_id_inexistente' => [
                'invalidos' => count($mpMateriaInexistente),
                'muestras' => array_slice($mpMateriaInexistente, 0, 20),
            ],
            'materia_periodo_periodo_programa_id_inexistente' => [
                'invalidos' => count($mpPeriodoInexistente),
                'muestras' => array_slice($mpPeriodoInexistente, 0, 20),
            ],
            'periodo_programa_plan_estudios_id_inexistente' => [
                'invalidos' => count($periodoPlanInexistente),
                'muestras' => array_slice($periodoPlanInexistente, 0, 20),
            ],
            'programa_estudios_institucion_referencias' => [
                'institucion_id_invalidos' => count($peiRefsInvalidas['institucion']),
                'programa_estudios_id_invalidos' => count($peiRefsInvalidas['programa']),
                'modalidad_id_invalidos' => count($peiRefsInvalidas['modalidad']),
                'muestras' => $peiRefsInvalidas,
            ],
            'materia_periodo_relaciones_resumidas' => [
                'total' => $mpTotal,
                'referencias_validas_estimadas' => max(0, $mpValidas),
                'referencias_invalidas_estimadas' => count($mpMateriaInexistente) + count($mpPeriodoInexistente),
            ],
        ];

        $pf['permite_importacion_parcial'] = true;
        $pf['bloquear_confirm'] = false;

        if (count($planesProgInexistente) > 0) {
            $rango = $progHuerfanosMin !== null && $progHuerfanosMax !== null
                ? "programa_estudios_id {$progHuerfanosMin}–{$progHuerfanosMax}"
                : 'programa_estudios_id fuera de catálogo';
            $reporte['advertencias'][] = sprintf(
                'Preflight: %d plan(es) activos huérfanos reales (%s; catálogo programa_estudios solo IDs %d–%d). Se omiten con motivo programa_no_resuelto; no se crean programas padre.',
                count($planesProgInexistente),
                $rango,
                $progIdMin,
                $progIdMax,
            );
        }
        if (count($planesProgramaInactivo) > 0) {
            $reporte['advertencias'][] = sprintf(
                'Preflight: %d plan(es) activos con programa_estudios inactivo en legacy (también programa_no_resuelto).',
                count($planesProgramaInactivo),
            );
        }
        if ($planesImportablesEstimados > 0) {
            $reporte['advertencias'][] = sprintf(
                'Preflight: la importación puede continuar con hasta %d plan(es) de estudio válidos (activos + programa importable).',
                $planesImportablesEstimados,
            );
        }

        $reporte['preflight'] = $pf;
    }

    private function reconstruirProgramasImportables(): void
    {
        $this->programasImportables = [];
        foreach ($this->legacyPrograma as $id => $row) {
            if ($this->programaLegacyEsImportable((int) $id)) {
                $this->programasImportables[(int) $id] = true;
            }
        }
    }

    private function reconstruirPlanesImportables(): void
    {
        $this->planesImportables = [];
        foreach ($this->legacyPlan as $id => $row) {
            if ($this->planLegacyEsImportable((int) $id)) {
                $this->planesImportables[(int) $id] = true;
            }
        }
    }

    private function programaLegacyEsImportable(int $progId): bool
    {
        if ($progId <= 0 || ! isset($this->legacyPrograma[$progId])) {
            return false;
        }
        $row = $this->legacyPrograma[$progId];
        if (! $this->statusActivo($row['status'] ?? null)) {
            return false;
        }

        return $this->nivelAcademicoResueltoParaPrograma($progId, $row);
    }

    /**
     * @param  array<string, mixed>  $row
     */
    private function nivelAcademicoResueltoParaPrograma(int $progId, array $row): bool
    {
        $ofertaId = (int) ($row['oferta_educativa_id'] ?? 0);
        $nivelClave = $this->nivelClavePorOfertaLegacy[$ofertaId] ?? 'LIC';

        return NivelAcademico::query()->where('clave', $nivelClave)->exists();
    }

    private function planLegacyEsImportable(int $planId): bool
    {
        if (! isset($this->legacyPlan[$planId])) {
            return false;
        }
        $row = $this->legacyPlan[$planId];
        if (! $this->statusActivo($row['status'] ?? null)) {
            return false;
        }
        $progId = (int) ($row['programa_estudios_id'] ?? 0);

        return isset($this->programasImportables[$progId]);
    }

    private function motivoProgramaNoResuelto(int $planId, int $progLegacy): string
    {
        if ($progLegacy <= 0) {
            return 'programa_estudios_id vacío o cero';
        }
        if (! isset($this->legacyPrograma[$progLegacy])) {
            $max = max(array_map('intval', array_keys($this->legacyPrograma)) ?: [0]);

            return "huérfano real: programa_estudios_id {$progLegacy} no existe en legacy (catálogo programa_estudios IDs 1–{$max})";
        }
        if (! $this->statusActivo($this->legacyPrograma[$progLegacy]['status'] ?? null)) {
            return "programa_estudios_id {$progLegacy} inactivo en legacy (no importable)";
        }

        return "programa_estudios_id {$progLegacy} sin nivel académico resuelto en SICES v2";
    }

    private function resolverPlanCatalogoMateria(bool $confirm): int
    {
        if ($this->planCatalogoMateriaId !== null) {
            return $this->planCatalogoMateriaId;
        }

        foreach ($this->mapPlanLegacy as $planId) {
            if ($planId > 0) {
                $this->planCatalogoMateriaId = $planId;

                return $planId;
            }
        }

        $existente = PlanEstudio::query()
            ->where('clave', 'CAT-SISEES-MAESTRO')
            ->first();

        if ($existente !== null) {
            $this->planCatalogoMateriaId = (int) $existente->id;

            return $this->planCatalogoMateriaId;
        }

        if ($confirm) {
            $prog = ProgramaEstudio::query()->first();
            $model = PlanEstudio::query()->create([
                'programa_estudio_id' => $prog?->id ?? 1,
                'subsistema_id' => $this->subsistemas['NORMAL']->id,
                'clave' => 'CAT-SISEES-MAESTRO',
                'nombre' => 'Catálogo maestro materias SISEES',
                'activo' => true,
                'metadata' => ['origen' => self::ORIGEN, 'catalogo_maestro_materias' => true],
            ]);
            $this->planCatalogoMateriaId = (int) $model->id;

            return $this->planCatalogoMateriaId;
        }

        $this->planCatalogoMateriaId = -1;

        return -1;
    }

    /**
     * @param  array<string, mixed>  $reporte
     */
    private function procesarNiveles(bool $confirm, array &$reporte): void
    {
        $tabla = (string) config('sisees_catalogos.tables.oferta_educativa');
        $r = $this->ent('niveles_academicos');
        $r->tablaLegacy = $tabla;

        $vistos = [];

        foreach ($this->legacyOferta as $id => $row) {
            $r->contarLeido();
            if (! $this->statusActivo($row['status'] ?? null)) {
                $r->omitir(self::MOTIVO_INACTIVO, $id, 'oferta_educativa inactiva');

                continue;
            }
            $nombre = trim((string) ($row['nombre_oferta_educativa'] ?? ''));
            if ($nombre === '') {
                $r->omitir(self::MOTIVO_COLUMNAS_FALTANTES, $id, 'nombre_oferta_educativa vacío');

                continue;
            }

            $clave = $this->claveNivelDesdeOferta($nombre, $id);
            $norm = $this->normalizar($nombre);
            if (isset($vistos[$norm])) {
                $this->nivelClavePorOfertaLegacy[$id] = $vistos[$norm];
                $r->omitir(self::MOTIVO_DUPLICADO, $id, "nombre normalizado duplicado de oferta {$vistos[$norm]}");

                continue;
            }
            $vistos[$norm] = $clave;
            $this->nivelClavePorOfertaLegacy[$id] = $clave;

            $existente = NivelAcademico::query()
                ->where('metadata->legacy_sisees_id', (string) $id)
                ->orWhere('clave', $clave)
                ->first();

            if ($existente !== null) {
                $r->contarActualizar();
                if ($confirm) {
                    $existente->update([
                        'nombre' => $nombre,
                        'activo' => true,
                        'metadata' => $this->metaLegacy($id, $tabla, $row),
                    ]);
                }

                continue;
            }

            $r->contarInsertar();
            if ($confirm) {
                NivelAcademico::query()->create([
                    'clave' => $clave,
                    'nombre' => $nombre,
                    'tipo' => 'superior',
                    'orden' => count($vistos),
                    'activo' => true,
                    'metadata' => $this->metaLegacy($id, $tabla, $row),
                ]);
            }
        }

        foreach ($this->legacyPrograma as $progId => $prog) {
            $ofertaId = (int) ($prog['oferta_educativa_id'] ?? 0);
            if ($ofertaId > 0 && isset($this->legacyOferta[$ofertaId])) {
                $nombre = (string) ($this->legacyOferta[$ofertaId]['nombre_oferta_educativa'] ?? '');
                $this->nivelClavePorOfertaLegacy[$ofertaId] = $this->nivelClavePorOfertaLegacy[$ofertaId]
                    ?? $this->claveNivelDesdeOferta($nombre, $ofertaId);
            }
        }
    }

    /**
     * @param  array<string, mixed>  $reporte
     */
    private function procesarInstituciones(bool $confirm, array &$reporte): void
    {
        $tabla = (string) config('sisees_catalogos.tables.institucion');
        $r = $this->ent('instituciones');
        $r->tablaLegacy = $tabla;
        $tipoPrincipal = (int) config('sisees_catalogos.tipo_institucion_principal', 1);

        foreach ($this->legacyInstitucion as $id => $row) {
            if (! $this->esInstitucionPrincipal($row)) {
                continue;
            }

            $r->contarLeido();
            if (! $this->statusActivo($row['status'] ?? null)) {
                $r->omitir(self::MOTIVO_INACTIVO, $id, 'institución principal inactiva');

                continue;
            }

            $nombre = trim((string) ($row['nombre'] ?? ''));
            if ($nombre === '') {
                $r->omitir(self::MOTIVO_COLUMNAS_FALTANTES, $id, 'nombre vacío');

                continue;
            }

            $clave = $this->claveInstitucion($row, $id);
            $subsistema = $this->resolverSubsistema($row);
            $region = $this->obtenerRegion($subsistema, $confirm);

            $existente = $this->buscarPorLegacy(Institucion::class, $id)
                ?? Institucion::query()->where('clave', $clave)->first();

            $payload = [
                'subsistema_id' => $subsistema->id,
                'region_id' => $region->id,
                'clave' => $clave,
                'nombre' => mb_strtoupper($nombre, 'UTF-8'),
                'nombre_corto' => $row['siglas'] ?? null,
                'email_contacto' => $row['correo_electronico'] ?? null,
                'telefono_contacto' => $row['telefono'] ?? null,
                'activo' => true,
                'metadata' => $this->metaInstitucion($id, $tabla, $row, $tipoPrincipal),
            ];

            if ($existente !== null) {
                $r->contarActualizar();
                if ($confirm) {
                    $existente->update($payload);
                    $this->mapInstitucionLegacy[$id] = (int) $existente->id;
                } else {
                    $this->mapInstitucionLegacy[$id] = (int) $existente->id;
                }

                continue;
            }

            $r->contarInsertar();
            if ($confirm) {
                $payload['metadata'] = $this->marcarMetadataImport($payload['metadata'], true);
                $model = Institucion::query()->create($payload);
                $this->mapInstitucionLegacy[$id] = (int) $model->id;
            } else {
                $this->mapInstitucionLegacy[$id] = -1 * $id;
            }
        }

        if ($r->leidos === 0 && $this->legacyInstitucion !== []) {
            $reporte['advertencias'][] = 'No se detectaron instituciones principales (tipo_institucion=1). Revise el dump.';
        }
    }

    /**
     * @param  array<string, mixed>  $reporte
     */
    private function procesarSedes(bool $confirm, array &$reporte): void
    {
        $tabla = (string) config('sisees_catalogos.tables.institucion');
        $r = $this->ent('sedes');
        $r->tablaLegacy = $tabla.' (tipo sede/subsede)';

        foreach ($this->legacyInstitucion as $id => $row) {
            if ($this->esInstitucionPrincipal($row)) {
                continue;
            }
            if (! $this->esSede($row)) {
                continue;
            }

            $r->contarLeido();
            if (! $this->statusActivo($row['status'] ?? null)) {
                $r->omitir(self::MOTIVO_INACTIVO, $id, 'sede inactiva');

                continue;
            }

            $padreId = (int) ($row['institucion_id'] ?? 0);
            if ($padreId <= 0 || ! isset($this->legacyInstitucion[$padreId])) {
                $r->omitir(self::MOTIVO_INSTITUCION_NO_RESUELTA, $id, "institución padre {$padreId} no existe en legacy");
                $this->advertir($reporte, "Sede legacy {$id}: institución padre {$padreId} no encontrada.");

                continue;
            }

            $institucionId = $this->mapInstitucionLegacy[$padreId] ?? null;
            if ($institucionId === null) {
                $r->omitir(self::MOTIVO_INSTITUCION_NO_RESUELTA, $id, "institución padre {$padreId} no resuelta en SICES v2");
                $this->advertir($reporte, "Sede legacy {$id}: padre {$padreId} no resuelto en SICES v2.");

                continue;
            }

            if ($institucionId < 0 && ! $confirm) {
                $institucionId = abs($institucionId);
            }

            $nombre = trim((string) ($row['nombre'] ?? ''));
            if ($nombre === '') {
                $r->omitir(self::MOTIVO_COLUMNAS_FALTANTES, $id, 'nombre vacío');

                continue;
            }

            $clave = (string) ($row['clave_sede'] ?? $row['clave_escuela'] ?? 'SISEES-SEDE-'.$id);

            $instModel = Institucion::query()->find($institucionId > 0 ? $institucionId : null);
            $institucionIdFinal = $institucionId > 0 ? $institucionId : (int) ($instModel?->id ?? 0);
            if ($institucionIdFinal <= 0) {
                $r->omitir(self::MOTIVO_INSTITUCION_NO_RESUELTA, $id, 'institución padre sin id SICES v2');
                continue;
            }

            $regionId = $instModel?->region_id;
            $existente = $this->buscarSedeParaImportacion($id, $institucionIdFinal, $clave);

            $payload = [
                'institucion_id' => $institucionIdFinal,
                'region_id' => $regionId,
                'clave' => $clave,
                'cct' => $row['clave_escuela'] ?? null,
                'nombre' => mb_strtoupper($nombre, 'UTF-8'),
                'nombre_corto' => $row['siglas'] ?? null,
                'tipo_sede' => 'subsede_sisees',
                'codigo_postal' => $row['codigo_postal'] ?? null,
                'domicilio' => $this->domicilioInstitucion($row),
                'activo' => true,
                'legacy_kcve_subsede' => $id,
                'legacy_rcve_institucion' => $padreId,
                'metadata' => array_merge($this->metaInstitucion($id, $tabla, $row, (int) config('sisees_catalogos.tipo_institucion_sede', 2)), [
                    'legacy_institucion_padre_id' => $padreId,
                ]),
            ];

            if ($existente !== null) {
                $r->contarActualizar();
                if ($confirm) {
                    $this->liberarLegacyKcveSubsedeConflicto($id, (int) $existente->id);
                    $existente->update($payload);
                    $this->mapSedeLegacy[$id] = (int) $existente->id;
                } else {
                    $this->mapSedeLegacy[$id] = (int) $existente->id;
                }

                continue;
            }

            $r->contarInsertar();
            if ($confirm) {
                $this->liberarLegacyKcveSubsedeConflicto($id, 0);
                $model = Sede::query()->updateOrCreate(
                    ['institucion_id' => $institucionIdFinal, 'clave' => $clave],
                    $payload,
                );
                $model->update([
                    'metadata' => $this->marcarMetadataImport(
                        array_merge($model->metadata ?? [], $payload['metadata']),
                        $model->wasRecentlyCreated,
                    ),
                ]);
                $this->mapSedeLegacy[$id] = (int) $model->id;
            } else {
                $this->mapSedeLegacy[$id] = -1 * $id;
            }
        }
    }

    /**
     * @param  array<string, mixed>  $reporte
     */
    private function procesarProgramas(bool $confirm, array &$reporte): void
    {
        $tabla = (string) config('sisees_catalogos.tables.programa_estudios');
        $r = $this->ent('programas_estudio');
        $r->tablaLegacy = $tabla;

        foreach ($this->legacyPrograma as $id => $row) {
            $r->contarLeido();
            if (! $this->statusActivo($row['status'] ?? null)) {
                $r->omitir(self::MOTIVO_INACTIVO, $id, 'programa_estudios inactivo');
                $this->mapProgramaLegacy[$id] = -1 * $id;

                continue;
            }

            $nombre = trim((string) ($row['nombre_programa'] ?? ''));
            if ($nombre === '') {
                $r->omitir(self::MOTIVO_COLUMNAS_FALTANTES, $id, 'nombre_programa vacío');

                continue;
            }

            $ofertaId = (int) ($row['oferta_educativa_id'] ?? 0);
            $nivelClave = $this->nivelClavePorOfertaLegacy[$ofertaId] ?? 'LIC';
            $nivel = NivelAcademico::query()->where('clave', $nivelClave)->first();
            if ($nivel === null) {
                $r->omitir(self::MOTIVO_NIVEL_NO_RESUELTO, $id, "nivel «{$nivelClave}» (oferta {$ofertaId}) no existe en SICES v2");
                $this->mapProgramaLegacy[$id] = -1 * $id;
                $this->advertir($reporte, "Programa {$id}: nivel «{$nivelClave}» (oferta {$ofertaId}) no resuelto.");

                continue;
            }

            $subsistema = $this->subsistemas['NORMAL'];
            $clave = 'PROG-'.$id;

            $existente = $this->buscarPorLegacy(ProgramaEstudio::class, $id);

            $payload = [
                'nivel_academico_id' => $nivel->id,
                'subsistema_id' => $subsistema->id,
                'clave' => $clave,
                'nombre' => $nombre,
                'activo' => true,
                'metadata' => $this->metaLegacy($id, $tabla, $row),
            ];

            if ($existente !== null) {
                $r->contarActualizar();
                if ($confirm) {
                    $existente->update($payload);
                    $this->mapProgramaLegacy[$id] = (int) $existente->id;
                } else {
                    $this->mapProgramaLegacy[$id] = (int) $existente->id;
                }

                continue;
            }

            $r->contarInsertar();
            if ($confirm) {
                $payload['metadata'] = $this->marcarMetadataImport($payload['metadata'], true);
                $model = ProgramaEstudio::query()->create($payload);
                $this->mapProgramaLegacy[$id] = (int) $model->id;
            } else {
                $this->mapProgramaLegacy[$id] = -1 * $id;
            }
        }
    }

    /**
     * @param  array<string, mixed>  $reporte
     */
    private function procesarPlanes(bool $confirm, array &$reporte): void
    {
        $tabla = (string) config('sisees_catalogos.tables.plan_estudios');
        $r = $this->ent('planes_estudio');
        $r->tablaLegacy = $tabla;

        foreach ($this->legacyPlan as $id => $row) {
            $r->contarLeido();
            if (! $this->statusActivo($row['status'] ?? null)) {
                $r->omitir(self::MOTIVO_INACTIVO, $id, 'plan_estudios inactivo');

                continue;
            }

            $progLegacy = (int) ($row['programa_estudios_id'] ?? 0);
            if (! $this->programaLegacyEsImportable($progLegacy)) {
                $detalle = $this->motivoProgramaNoResuelto($id, $progLegacy);
                $r->omitir(self::MOTIVO_PROGRAMA_NO_RESUELTO, $id, $detalle);

                continue;
            }

            $nombre = trim((string) ($row['nombre'] ?? 'Plan '.$id));
            $programaId = $this->mapProgramaLegacy[$progLegacy];
            $programa = $confirm && $programaId > 0
                ? ProgramaEstudio::query()->find($programaId)
                : ProgramaEstudio::query()->where('metadata->legacy_sisees_id', (string) $progLegacy)->first();

            $subsistemaId = $programa?->subsistema_id ?? $this->subsistemas['NORMAL']->id;

            $existente = $this->buscarPorLegacy(PlanEstudio::class, $id);

            $payload = [
                'programa_estudio_id' => $programaId > 0 ? $programaId : ($programa?->id ?? 1),
                'subsistema_id' => $subsistemaId,
                'clave' => 'PLAN-'.$id,
                'nombre' => $nombre,
                'activo' => true,
                'metadata' => array_merge($this->metaLegacy($id, $tabla, $row), [
                    'creditos_carrera' => $row['creditos_carrera'] ?? null,
                    'periodos' => $row['periodos'] ?? null,
                    'numero_maximo_periodos' => $row['numero_maximo_periodos'] ?? null,
                    'tipo_periodo' => $row['tipo_periodo'] ?? null,
                    'minima_calificacion_aprobatoria' => $row['minima_calificacion_aprobatoria'] ?? null,
                    'porcentaje_minimo_asistencia' => $row['porcentaje_minimo_asistencia'] ?? null,
                ]),
            ];

            if ($existente !== null) {
                $r->contarActualizar();
                if ($confirm) {
                    $existente->update($payload);
                    $this->mapPlanLegacy[$id] = (int) $existente->id;
                } else {
                    $this->mapPlanLegacy[$id] = (int) $existente->id;
                }

                continue;
            }

            $r->contarInsertar();
            if ($confirm) {
                $payload['metadata'] = $this->marcarMetadataImport($payload['metadata'], true);
                $model = PlanEstudio::query()->create($payload);
                $this->mapPlanLegacy[$id] = (int) $model->id;
            } else {
                $this->mapPlanLegacy[$id] = -1 * $id;
            }
        }
    }

    /**
     * @param  array<string, mixed>  $reporte
     */
    private function procesarMaterias(bool $confirm, array &$reporte): void
    {
        $tabla = (string) config('sisees_catalogos.tables.materia');
        $r = $this->ent('materias');
        $r->tablaLegacy = $tabla;

        $planCatalogoId = $this->resolverPlanCatalogoMateria($confirm);
        $vistosNombre = [];

        foreach ($this->legacyMateria as $id => $row) {
            $r->contarLeido();
            if (! $this->statusActivo($row['status'] ?? null)) {
                $r->omitir(self::MOTIVO_INACTIVO, $id, 'materia inactiva');

                continue;
            }

            $nombre = trim((string) ($row['nombre'] ?? ''));
            if ($nombre === '') {
                $r->omitir(self::MOTIVO_COLUMNAS_FALTANTES, $id, 'nombre vacío');

                continue;
            }

            $norm = $this->normalizar($nombre);
            if (isset($vistosNombre[$norm])) {
                $r->omitir(self::MOTIVO_DUPLICADO, $id, "nombre normalizado duplicado de materia legacy {$vistosNombre[$norm]}");

                continue;
            }
            $vistosNombre[$norm] = $id;

            $planes = $this->planesPorMateriaLegacy[$id] ?? [];
            $planLegacyId = 0;
            foreach ($planes as $plId) {
                if (isset($this->planesImportables[$plId])) {
                    $planLegacyId = $plId;
                    break;
                }
            }

            $planId = $planLegacyId > 0 && isset($this->mapPlanLegacy[$planLegacyId])
                ? $this->mapPlanLegacy[$planLegacyId]
                : $planCatalogoId;

            $clave = 'MAT-'.$id;

            $existente = $this->buscarPorLegacy(Materia::class, $id);

            $payload = [
                'plan_estudio_id' => $planId > 0 ? $planId : 1,
                'clave' => $clave,
                'nombre' => $nombre,
                'creditos' => 0,
                'semestre' => 0,
                'estatus' => 'activa',
                'metadata' => array_merge($this->metaLegacy($id, $tabla, $row), [
                    'optativa' => $this->optativaBool($row['optativa'] ?? null),
                    'planes_legacy_vinculados' => $planes,
                    'catalogo_maestro' => $planLegacyId === 0,
                ]),
            ];

            if ($existente !== null) {
                $r->contarActualizar();
                if ($confirm) {
                    $existente->update($payload);
                    $this->mapMateriaLegacy[$id] = (int) $existente->id;
                } else {
                    $this->mapMateriaLegacy[$id] = (int) $existente->id;
                }

                continue;
            }

            $r->contarInsertar();
            if ($confirm) {
                $payload['metadata'] = $this->marcarMetadataImport($payload['metadata'], true);
                $model = Materia::query()->create($payload);
                $this->mapMateriaLegacy[$id] = (int) $model->id;
            } else {
                $this->mapMateriaLegacy[$id] = -1 * $id;
            }
        }
    }

    /**
     * @param  array<string, mixed>  $reporte
     */
    private function procesarPlanMaterias(bool $confirm, array &$reporte): void
    {
        $tabla = (string) config('sisees_catalogos.tables.materia_periodo');
        $r = $this->ent('plan_materias');
        $r->tablaLegacy = $tabla.' + periodo_programa_estudios';

        $vistos = [];

        foreach ($this->legacyMateriaPeriodo as $mpId => $mp) {
            $r->contarLeido();
            if (! $this->statusActivo($mp['status'] ?? null)) {
                $r->omitir(self::MOTIVO_INACTIVO, $mpId, 'materia_periodo inactiva');

                continue;
            }

            $periodoId = (int) ($mp['periodo_programa_id'] ?? 0);
            $materiaLegacyId = (int) ($mp['materia_id'] ?? 0);
            $periodo = $this->legacyPeriodoPrograma[$periodoId] ?? null;

            if ($periodo === null) {
                $r->omitir(self::MOTIVO_RELACION_FALTANTE, $mpId, "periodo_programa_id {$periodoId} no existe en legacy");

                continue;
            }

            if (! $this->statusActivo($periodo['status'] ?? null)) {
                $r->omitir(self::MOTIVO_INACTIVO, $mpId, "periodo_programa_estudios {$periodoId} inactivo");

                continue;
            }

            $planLegacyId = (int) ($periodo['plan_estudios_id'] ?? 0);
            if ($planLegacyId <= 0 || ! isset($this->legacyPlan[$planLegacyId])) {
                $r->omitir(self::MOTIVO_RELACION_FALTANTE, $mpId, "plan_estudios_id {$planLegacyId} inexistente en legacy");

                continue;
            }

            if (! $this->planLegacyEsImportable($planLegacyId)) {
                $r->omitir(self::MOTIVO_PLAN_NO_RESUELTO, $mpId, "plan_estudios {$planLegacyId} no importable (programa padre no resuelto o inactivo)");

                continue;
            }

            if ($materiaLegacyId <= 0 || ! isset($this->legacyMateria[$materiaLegacyId])) {
                $r->omitir(self::MOTIVO_RELACION_FALTANTE, $mpId, "materia_id {$materiaLegacyId} no existe en legacy");

                continue;
            }

            if (! isset($this->mapMateriaLegacy[$materiaLegacyId])) {
                $r->omitir(self::MOTIVO_MATERIA_NO_RESUELTA, $mpId, "materia {$materiaLegacyId} omitida o no importable en catálogo maestro");

                continue;
            }

            $numeroPeriodo = (int) ($periodo['numero_periodo'] ?? $mp['periodo'] ?? 0);
            $numeroPeriodoCurricular = max(1, min(99, $numeroPeriodo > 0 ? $numeroPeriodo : 1));
            $tipoPeriodo = $this->tipoPeriodoCurricularDesdeLegacy($periodo, $planLegacyId);
            $claveInfo = $this->resolverClaveMateriaPlanImport($mp, $materiaLegacyId, $mpId);
            $claveMateria = $claveInfo['clave'];

            if ($claveInfo['generada'] && count($this->clavesMateriaGeneradas) < 50) {
                $this->clavesMateriaGeneradas[] = [
                    'materia_periodo_id' => $mpId,
                    'materia_legacy_id' => $materiaLegacyId,
                    'clave_generada' => $claveMateria,
                    'legacy_clave_materia_original' => $claveInfo['original'],
                ];
            }

            $dedupe = $planLegacyId.'|'.$materiaLegacyId.'|'.$tipoPeriodo.'|'.$numeroPeriodoCurricular;
            if (isset($vistos[$dedupe])) {
                $r->omitir(self::MOTIVO_DUPLICADO, $mpId, 'combinación plan+materia+periodo duplicada en legacy');

                continue;
            }
            $vistos[$dedupe] = true;

            $planId = $this->mapPlanLegacy[$planLegacyId];
            $materiaId = $this->mapMateriaLegacy[$materiaLegacyId];
            $materiaRow = $this->legacyMateria[$materiaLegacyId] ?? [];
            $nombreMateria = (string) ($materiaRow['nombre'] ?? $claveMateria);
            $planEstudioId = $planId > 0 ? $planId : 1;

            $existente = $this->buscarPlanMateriaPorLegacy($mpId, $tabla);

            if ($existente === null) {
                $ocupanteNatural = $this->buscarPlanMateriaPorLlaveNatural(
                    $planEstudioId,
                    $claveMateria,
                    $tipoPeriodo,
                    $numeroPeriodoCurricular,
                );
                if ($ocupanteNatural !== null && ! $this->esMismoLegacyPlanMateria($ocupanteNatural, $mpId, $tabla)) {
                    $r->omitir(
                        self::MOTIVO_DUPLICADO_NATURAL,
                        $mpId,
                        "llave natural ocupada por plan_materia id {$ocupanteNatural->id} (legacy distinto)",
                    );

                    continue;
                }
                $existente = $ocupanteNatural;
            }

            $metaBase = array_merge($this->metaLegacy($mpId, $tabla, $mp), [
                'legacy_periodo_programa_id' => $periodoId,
                'legacy_materia_id' => $materiaLegacyId,
                'legacy_clave_materia_original' => $claveInfo['original'],
                'clave_generada_por_importador' => $claveInfo['generada'],
                'horas' => $mp['horas'] ?? null,
                'materia_padre_id' => $mp['materia_padre_id'] ?? null,
                'np' => $mp['np'] ?? null,
                'periodo' => $mp['periodo'] ?? null,
                'posible_recurse_materia' => $mp['posible_recurse_materia'] ?? null,
                'recurse_produce_baja' => $mp['recurse_produce_baja'] ?? null,
                'recurse_repite_periodo' => $mp['recurse_repite_periodo'] ?? null,
            ]);

            $payload = [
                'plan_estudio_id' => $planEstudioId,
                'materia_id' => $materiaId > 0 ? $materiaId : null,
                'clave_materia' => $claveMateria,
                'nombre_materia' => $nombreMateria,
                'semestre' => $numeroPeriodoCurricular,
                'tipo_periodo_curricular' => $tipoPeriodo,
                'numero_periodo_curricular' => $numeroPeriodoCurricular,
                'creditos' => (int) ($mp['creditos'] ?? 0),
                'obligatoria' => ! $this->optativaBool($materiaRow['optativa'] ?? null),
                'estatus' => 'activa',
                'metadata' => $metaBase,
            ];

            if ($existente !== null) {
                $r->contarActualizar();
                if ($confirm) {
                    $payload['metadata'] = $this->marcarMetadataImport($metaBase, false);
                    $existente->update($payload);
                }

                continue;
            }

            $r->contarInsertar();
            if ($confirm) {
                $payload['metadata'] = $this->marcarMetadataImport($metaBase, true);
                PlanMateria::query()->updateOrCreate(
                    [
                        'plan_estudio_id' => $planEstudioId,
                        'clave_materia' => $claveMateria,
                        'tipo_periodo_curricular' => $tipoPeriodo,
                        'numero_periodo_curricular' => $numeroPeriodoCurricular,
                    ],
                    $payload,
                );
            }
        }
    }

    /**
     * @param  array<string, mixed>  $reporte
     */
    private function procesarOfertas(bool $confirm, array &$reporte): void
    {
        $tabla = (string) config('sisees_catalogos.tables.programa_estudios_institucion');
        $r = $this->ent('ofertas_academicas');
        $r->tablaLegacy = $tabla;
        $vistos = [];

        $registrosLegacy = 0;
        $candidatos = 0;

        foreach ($this->legacyProgramaInstitucion as $peiId => $pei) {
            if (! $this->statusActivo($pei['status'] ?? null)) {
                continue;
            }

            $registrosLegacy++;
            $instLegacyId = (int) ($pei['institucion_id'] ?? 0);
            $progLegacyId = (int) ($pei['programa_estudios_id'] ?? 0);
            $modalidadId = (int) ($pei['modalidad_id'] ?? 0);

            if ($modalidadId > 0 && ! isset($this->legacyModalidad[$modalidadId])) {
                $this->advertir($reporte, "Oferta PEI {$peiId}: modalidad_id {$modalidadId} inexistente en legacy.");
            }

            $modalidadNombre = (string) ($this->legacyModalidad[$modalidadId]['nombre_modalidad'] ?? '');
            $modalidadSep = $this->modalidadSep($modalidadNombre);

            $planesActivos = [];
            foreach ($this->planesPorProgramaLegacy[$progLegacyId] ?? [] as $planLegacyId) {
                if ($this->planLegacyEsImportable((int) $planLegacyId)) {
                    $planesActivos[] = (int) $planLegacyId;
                }
            }

            $listaPlanes = $planesActivos !== [] ? $planesActivos : [0];

            $instRow = $this->legacyInstitucion[$instLegacyId] ?? null;
            if ($instRow === null) {
                foreach ($listaPlanes as $planLegacyId) {
                    $candidatos++;
                    $r->omitir(self::MOTIVO_INSTITUCION_NO_RESUELTA, $peiId, "institución legacy {$instLegacyId} no existe en dump");
                }

                continue;
            }

            if (! $this->statusActivo($instRow['status'] ?? null)) {
                foreach ($listaPlanes as $planLegacyId) {
                    $candidatos++;
                    $r->omitir(self::MOTIVO_INACTIVO, $peiId, "institución legacy {$instLegacyId} inactiva (no importable)");
                }

                continue;
            }

            foreach ($listaPlanes as $planLegacyId) {
                $candidatos++;

                if ($progLegacyId <= 0 || ! $this->programaLegacyEsImportable($progLegacyId)) {
                    $detalle = $this->motivoProgramaNoResuelto($peiId, $progLegacyId);
                    $r->omitir(self::MOTIVO_PROGRAMA_NO_RESUELTO, $peiId, $detalle);
                    $this->advertir($reporte, "Oferta PEI {$peiId}: {$detalle}.");

                    continue;
                }

                if ($planLegacyId > 0 && ! $this->planLegacyEsImportable($planLegacyId)) {
                    $r->omitir(self::MOTIVO_PLAN_NO_RESUELTO, $peiId, "plan_estudios {$planLegacyId} no importable para programa {$progLegacyId}");

                    continue;
                }

                [$institucionId, $sedeId] = $this->resolverInstitucionSedeParaOferta($instLegacyId, $confirm);
                if ($institucionId === null || $institucionId <= 0) {
                    $r->omitir(self::MOTIVO_INSTITUCION_NO_RESUELTA, $peiId, "institución legacy {$instLegacyId} no resuelta");

                    continue;
                }

                if ($sedeId === null || $sedeId <= 0) {
                    $r->omitir(self::MOTIVO_SEDE_NO_RESUELTA, $peiId, "sede no resuelta para institución legacy {$instLegacyId}");

                    continue;
                }

                $dedupe = $institucionId.'|'.$sedeId.'|'.$progLegacyId.'|'.$planLegacyId;
                if (isset($vistos[$dedupe])) {
                    $r->omitir(self::MOTIVO_DUPLICADO, $peiId, 'oferta duplicada institución+programa+plan');

                    continue;
                }
                $vistos[$dedupe] = true;

                $legacyOfertaId = $peiId.'-'.$planLegacyId;
                $clave = trim((string) ($pei['clave_escuela'] ?? ''));
                if ($clave === '') {
                    $clave = 'OFERTA-'.$legacyOfertaId;
                }

                $programaId = $this->mapProgramaLegacy[$progLegacyId];
                $planId = $planLegacyId > 0 ? $this->mapPlanLegacy[$planLegacyId] : null;
                $programaIdDestino = $programaId > 0 ? $programaId : 1;
                $planIdDestino = $planId !== null && $planId > 0 ? $planId : null;

                $busqueda = $this->buscarOfertaParaImportacion(
                    $legacyOfertaId,
                    $tabla,
                    $peiId,
                    $institucionId,
                    $sedeId,
                    $programaIdDestino,
                    $planIdDestino,
                    $modalidadSep,
                    $clave,
                );
                $existente = $busqueda['model'];
                $detectadoPor = $busqueda['detectado_por'];

                $metaOferta = array_merge($this->metaLegacy($legacyOfertaId, $tabla, $pei), [
                    'modalidad_sisees' => $modalidadNombre,
                    'modalidad_id_legacy' => $modalidadId,
                    'turno_legacy' => null,
                    'clave_escuela' => $pei['clave_escuela'] ?? null,
                    'programa_estudios_institucion_id' => $peiId,
                    'legacy_institucion_id' => $instLegacyId,
                ]);

                $payload = [
                    'institucion_id' => $institucionId,
                    'sede_id' => $sedeId,
                    'programa_estudio_id' => $programaIdDestino,
                    'plan_estudio_id' => $planIdDestino,
                    'ciclo_escolar_id' => null,
                    'clave' => $clave,
                    'modalidad' => $modalidadSep,
                    'activo' => true,
                    'metadata' => $metaOferta,
                ];

                if ($existente !== null) {
                    $r->contarActualizar();
                    if ($confirm) {
                        $metaActualizada = array_merge($existente->metadata ?? [], $metaOferta, [
                            'legacy_sisees_id' => (string) $legacyOfertaId,
                            'legacy_sisees_tabla' => $tabla,
                            'detectado_por' => $detectadoPor,
                        ]);
                        $payload['metadata'] = $this->marcarMetadataImport($metaActualizada, false);
                        $existente->update($payload);
                    }

                    continue;
                }

                $muestraInsertar = [
                    'legacy_id' => $legacyOfertaId,
                    'programa_estudios_institucion_id' => $peiId,
                    'institucion_id_legacy' => $instLegacyId,
                    'sede_id_resuelta' => $sedeId,
                    'programa_estudios_id_legacy' => $progLegacyId,
                    'programa_estudio_id_destino' => $programaIdDestino,
                    'plan_estudio_id_destino' => $planIdDestino,
                    'plan_estudios_id_legacy' => $planLegacyId > 0 ? $planLegacyId : null,
                    'clave' => $clave,
                    'modalidad' => $modalidadSep,
                    'motivo_no_detectada_como_existente' => 'ningún criterio legacy ni llave natural encontró coincidencia en BD',
                ];
                $r->contarInsertarConMuestra($muestraInsertar);
                if ($confirm) {
                    $payload['metadata'] = $this->marcarMetadataImport($metaOferta, true);
                    OfertaAcademica::query()->create($payload);
                }
            }
        }

        $r->registrosLegacyLeidos = $registrosLegacy;
        $r->candidatosGenerados = $candidatos;
        $r->leidos = $registrosLegacy;
    }

    /**
     * @param  array<string, mixed>  $row
     */
    private function esInstitucionPrincipal(array $row): bool
    {
        $tipo = (int) ($row['tipo_institucion'] ?? 0);
        $padre = (int) ($row['institucion_id'] ?? 0);

        return $tipo === (int) config('sisees_catalogos.tipo_institucion_principal', 1)
            || ($padre <= 0 && $tipo !== (int) config('sisees_catalogos.tipo_institucion_sede', 2));
    }

    /**
     * @param  array<string, mixed>  $row
     */
    private function esSede(array $row): bool
    {
        $tipo = (int) ($row['tipo_institucion'] ?? 0);
        $padre = (int) ($row['institucion_id'] ?? 0);

        return $tipo === (int) config('sisees_catalogos.tipo_institucion_sede', 2)
            || ($padre > 0 && $padre !== (int) ($row['id'] ?? 0));
    }

    /**
     * @return array{model: ?OfertaAcademica, detectado_por: ?string}
     */
    private function buscarOfertaParaImportacion(
        string $legacyOfertaId,
        string $tabla,
        int $peiId,
        int $institucionId,
        int $sedeId,
        int $programaEstudioId,
        ?int $planEstudioId,
        string $modalidad,
        string $clave,
    ): array {
        $porLegacyId = OfertaAcademica::query()
            ->where('metadata->legacy_sisees_id', $legacyOfertaId)
            ->first();
        if ($porLegacyId !== null) {
            return ['model' => $porLegacyId, 'detectado_por' => 'metadata.legacy_sisees_id'];
        }

        $porMetaImport = OfertaAcademica::query()
            ->where(function ($q): void {
                $q->where('metadata->origen', self::ORIGEN)
                    ->orWhere('metadata->origin', self::ORIGEN);
            })
            ->where('metadata->legacy_sisees_tabla', $tabla)
            ->where('metadata->legacy_sisees_id', $legacyOfertaId)
            ->first();
        if ($porMetaImport !== null) {
            return ['model' => $porMetaImport, 'detectado_por' => 'metadata.origen+legacy_sisees_tabla+legacy_sisees_id'];
        }

        foreach ([(string) $peiId, $legacyOfertaId] as $legacyAlt) {
            $alt = OfertaAcademica::query()
                ->where('metadata->legacy_sisees_id', $legacyAlt)
                ->first();
            if ($alt !== null) {
                return ['model' => $alt, 'detectado_por' => 'metadata.legacy_sisees_id_alternativo'];
            }
        }

        $candidatosPei = OfertaAcademica::query()
            ->where('metadata->programa_estudios_institucion_id', $peiId)
            ->where(function ($q): void {
                $q->where('metadata->origen', self::ORIGEN)
                    ->orWhere('metadata->origin', self::ORIGEN);
            })
            ->get();

        foreach ($candidatosPei as $candidato) {
            if ($this->ofertaCoincidePlan($candidato, $planEstudioId)) {
                return ['model' => $candidato, 'detectado_por' => 'metadata.programa_estudios_institucion_id+plan'];
            }
        }

        $natural = OfertaAcademica::query()
            ->where('institucion_id', $institucionId)
            ->where('sede_id', $sedeId)
            ->where('programa_estudio_id', $programaEstudioId)
            ->where('modalidad', $modalidad)
            ->where('clave', $clave)
            ->whereNull('ciclo_escolar_id');

        if ($planEstudioId !== null) {
            $natural->where('plan_estudio_id', $planEstudioId);
        } else {
            $natural->whereNull('plan_estudio_id');
        }

        $porNatural = $natural->first();
        if ($porNatural !== null) {
            return ['model' => $porNatural, 'detectado_por' => 'llave_natural'];
        }

        return ['model' => null, 'detectado_por' => null];
    }

    private function ofertaCoincidePlan(OfertaAcademica $oferta, ?int $planEstudioId): bool
    {
        if ($planEstudioId === null) {
            return $oferta->plan_estudio_id === null;
        }

        return (int) $oferta->plan_estudio_id === $planEstudioId;
    }

    /**
     * @return array{0: int|null, 1: int|null} institucion_id, sede_id
     */
    private function resolverInstitucionSedeParaOferta(int $instLegacyId, bool $confirm): array
    {
        $row = $this->legacyInstitucion[$instLegacyId] ?? null;
        if ($row === null) {
            return [null, null];
        }

        if ($this->esSede($row)) {
            $padreLegacy = (int) ($row['institucion_id'] ?? 0);
            $institucionId = $this->resolverIdInstitucionSices($padreLegacy);
            $sedeId = $this->resolverIdSedeLegacy($instLegacyId, $institucionId, $confirm);

            return [$institucionId, $sedeId];
        }

        $institucionId = $this->resolverIdInstitucionSices($instLegacyId);
        $sedeId = $this->resolverSedePrincipalInstitucion($institucionId, $instLegacyId, $row, $confirm);

        return [$institucionId, $sedeId];
    }

    private function resolverIdInstitucionSices(int $legacyId): ?int
    {
        $mapped = $this->mapInstitucionLegacy[$legacyId] ?? null;
        if ($mapped === null) {
            return null;
        }

        return $mapped > 0 ? $mapped : abs($mapped);
    }

    private function resolverIdSedeLegacy(int $legacySedeId, ?int $institucionId, bool $confirm): ?int
    {
        $mapped = $this->mapSedeLegacy[$legacySedeId] ?? null;
        if ($mapped !== null && $mapped > 0) {
            return $mapped;
        }

        $sede = $this->buscarSedeParaImportacion(
            $legacySedeId,
            $institucionId ?? 0,
            (string) ($this->legacyInstitucion[$legacySedeId]['clave_sede'] ?? $this->legacyInstitucion[$legacySedeId]['clave_escuela'] ?? ''),
        );
        if ($sede !== null) {
            return (int) $sede->id;
        }

        if ($confirm) {
            return null;
        }

        if ($mapped !== null && $mapped < 0) {
            return abs($mapped);
        }

        return null;
    }

    /**
     * @param  array<string, mixed>  $rowInstitucion
     */
    private function resolverSedePrincipalInstitucion(?int $institucionId, int $instLegacyId, array $rowInstitucion, bool $confirm): ?int
    {
        if ($institucionId === null || $institucionId <= 0) {
            return null;
        }

        $sede = Sede::query()
            ->where('institucion_id', $institucionId)
            ->where(function ($q) use ($instLegacyId): void {
                $q->where('metadata->legacy_sisees_id', (string) $instLegacyId)
                    ->orWhere('legacy_kcve_subsede', $instLegacyId);
            })
            ->first();

        if ($sede === null) {
            $sede = Sede::query()
                ->where('institucion_id', $institucionId)
                ->where('activo', true)
                ->orderBy('id')
                ->first();
        }

        if ($sede !== null) {
            return (int) $sede->id;
        }

        if (! $confirm) {
            return max(1, $instLegacyId);
        }

        $inst = Institucion::query()->find($institucionId);
        $clave = (string) ($rowInstitucion['clave_sede'] ?? $rowInstitucion['clave_escuela'] ?? 'SEDE-PRIN-'.$instLegacyId);
        $nombre = trim((string) ($rowInstitucion['nombre'] ?? $inst?->nombre ?? 'Sede principal'));

        $creada = Sede::query()->create([
            'institucion_id' => $institucionId,
            'region_id' => $inst?->region_id,
            'clave' => $clave,
            'nombre' => mb_strtoupper($nombre, 'UTF-8'),
            'tipo_sede' => 'principal_sisees_import',
            'activo' => true,
            'metadata' => $this->marcarMetadataImport([
                'origen' => self::ORIGEN,
                'legacy_sisees_id' => (string) $instLegacyId,
                'legacy_sisees_tabla' => (string) config('sisees_catalogos.tables.institucion'),
                'sede_principal_generada' => true,
            ], true),
        ]);

        return (int) $creada->id;
    }

    /**
     * @param  array<string, mixed>  $metadata
     * @return array<string, mixed>
     */
    private function marcarMetadataImport(array $metadata, bool $esCreacion): array
    {
        if ($esCreacion) {
            $metadata['import_creado_en_import'] = true;
            unset($metadata['import_solo_actualizado']);
        } else {
            $metadata['import_solo_actualizado'] = true;
        }

        return $metadata;
    }

    private function buscarPlanMateriaPorLegacy(int $mpId, string $tabla): ?PlanMateria
    {
        return PlanMateria::query()
            ->where('metadata->legacy_sisees_tabla', $tabla)
            ->where('metadata->legacy_sisees_id', (string) $mpId)
            ->first();
    }

    private function buscarPlanMateriaPorLlaveNatural(
        int $planEstudioId,
        string $claveMateria,
        string $tipoPeriodo,
        int $numeroPeriodoCurricular,
    ): ?PlanMateria {
        return PlanMateria::query()
            ->where('plan_estudio_id', $planEstudioId)
            ->where('clave_materia', $claveMateria)
            ->where('tipo_periodo_curricular', $tipoPeriodo)
            ->where('numero_periodo_curricular', $numeroPeriodoCurricular)
            ->first();
    }

    private function esMismoLegacyPlanMateria(PlanMateria $model, int $mpId, string $tabla): bool
    {
        $meta = $model->metadata ?? [];

        return (string) ($meta['legacy_sisees_id'] ?? '') === (string) $mpId
            && (string) ($meta['legacy_sisees_tabla'] ?? '') === $tabla;
    }

    /**
     * @return array{0: int|null, 1: int|null} institucion_id, sede_id (legacy helper sedes)
     */
    private function resolverInstitucionSede(int $instLegacyId): array
    {
        $row = $this->legacyInstitucion[$instLegacyId] ?? null;
        if ($row === null) {
            return [null, null];
        }

        if ($this->esSede($row)) {
            $padreLegacy = (int) ($row['institucion_id'] ?? 0);

            return [
                $this->mapInstitucionLegacy[$padreLegacy] ?? null,
                $this->mapSedeLegacy[$instLegacyId] ?? null,
            ];
        }

        return [
            $this->mapInstitucionLegacy[$instLegacyId] ?? null,
            null,
        ];
    }

    /**
     * @param  array<string, mixed>  $row
     */
    private function resolverSubsistema(array $row): Subsistema
    {
        $map = config('sisees_catalogos.institucion_subsistema_clave', []);
        foreach (['clave_institucion', 'clave_escuela'] as $col) {
            if (! isset($row[$col])) {
                continue;
            }
            $k = (int) $row[$col];
            if (isset($map[$k])) {
                return $this->subsistemas[$map[$k]];
            }
        }

        return $this->subsistemas['NORMAL'];
    }

    private function obtenerRegion(Subsistema $subsistema, bool $confirm): Region
    {
        $clave = 'REG-'.$subsistema->clave.'-SISEES';

        $region = Region::query()
            ->where('subsistema_id', $subsistema->id)
            ->where('clave', $clave)
            ->first();

        if ($region !== null) {
            return $region;
        }

        if (! $confirm) {
            return new Region([
                'subsistema_id' => $subsistema->id,
                'clave' => $clave,
                'nombre' => 'Región importación SISEES',
                'activo' => true,
            ]);
        }

        return Region::query()->create([
            'subsistema_id' => $subsistema->id,
            'clave' => $clave,
            'nombre' => 'Región importación SISEES',
            'activo' => true,
        ]);
    }

    private function claveInstitucion(array $row, int $id): string
    {
        foreach (['clave_institucion', 'clave_escuela'] as $col) {
            if (! empty($row[$col])) {
                return (string) $row[$col];
            }
        }

        return 'INST-'.$id;
    }

    private function claveNivelDesdeOferta(string $nombre, int $ofertaId): string
    {
        $norm = $this->normalizar($nombre);
        foreach (config('sisees_catalogos.nivel_clave_por_palabra', []) as $palabra => $clave) {
            if (str_contains($norm, $this->normalizar((string) $palabra))) {
                return (string) $clave;
            }
        }

        return 'NIV-'.$ofertaId;
    }

    private function modalidadSep(?string $nombreModalidad): string
    {
        $n = $this->normalizar($nombreModalidad ?? '');
        if (str_contains($n, 'linea') || str_contains($n, 'distancia') || str_contains($n, 'virtual')) {
            return 'no_escolarizada';
        }
        if (str_contains($n, 'mixt') || str_contains($n, 'semipres')) {
            return 'mixta';
        }

        return 'escolarizada';
    }

    /**
     * @param  array<string, mixed>  $row
     */
    private function domicilioInstitucion(array $row): ?string
    {
        $partes = array_filter([
            $row['calle'] ?? null,
            $row['colonia'] ?? null,
            $row['localidad'] ?? null,
        ]);

        return $partes === [] ? null : implode(', ', $partes);
    }

    /**
     * @param  array<string, mixed>  $row
     */
    private function metaInstitucion(int $id, string $tabla, array $row, int $tipoInstitucion): array
    {
        return array_merge($this->metaLegacy($id, $tabla, $row), [
            'tipo_institucion' => $tipoInstitucion,
            'clave_escuela' => $row['clave_escuela'] ?? null,
            'clave_institucion' => $row['clave_institucion'] ?? null,
            'clave_sede' => $row['clave_sede'] ?? null,
            'siglas' => $row['siglas'] ?? null,
            'nombre_director_rector' => $row['nombre_director_rector'] ?? null,
            'dependencia_administrativa' => $row['dependencia_administrativa'] ?? null,
            'sostenimiento' => $row['sostenimiento'] ?? null,
            'servicio' => $row['servicio'] ?? null,
            'estado_id' => $row['estado_id'] ?? null,
            'municipio_id' => $row['municipio_id'] ?? null,
        ]);
    }

    /**
     * @param  array<string, mixed>  $row
     */
    private function metaLegacy(int|string $legacyId, string $tabla, array $row): array
    {
        return [
            'origen' => self::ORIGEN,
            'origin' => self::ORIGEN,
            'legacy_sisees_id' => (string) $legacyId,
            'legacy_sisees_tabla' => $tabla,
            'importado_en' => now()->toIso8601String(),
            'legacy_status' => $row['status'] ?? null,
        ];
    }

    private function statusActivo(mixed $status): bool
    {
        if ($status === null) {
            return true;
        }
        if (is_bool($status)) {
            return $status;
        }
        if (is_resource($status) || (is_string($status) && strlen($status) === 1)) {
            return ord((string) $status) === 1 || $status === "\x01";
        }
        if (is_numeric($status)) {
            return (int) $status === 1;
        }
        $s = strtoupper(trim((string) $status));

        return in_array($s, ['1', 'A', 'ACTIVO', 'ACTIVA', 'TRUE', 'S', 'SI'], true);
    }

    private function optativaBool(mixed $optativa): bool
    {
        if (is_bool($optativa)) {
            return $optativa;
        }
        if (is_numeric($optativa)) {
            return (int) $optativa === 1;
        }

        return in_array(strtoupper(trim((string) $optativa)), ['1', 'S', 'SI', 'TRUE', 'A'], true);
    }

    private function normalizar(string $texto): string
    {
        $t = Str::ascii(mb_strtolower(trim($texto), 'UTF-8'));

        return preg_replace('/\s+/', ' ', $t) ?? $t;
    }

    /**
     * @param  array<string, mixed>  $periodo
     */
    private function tipoPeriodoCurricularDesdeLegacy(array $periodo, int $planLegacyId): string
    {
        $plan = $this->legacyPlan[$planLegacyId] ?? [];
        $tipo = strtolower(trim((string) ($periodo['tipo_periodo'] ?? $plan['tipo_periodo'] ?? 'semestre')));
        $map = [
            'trimestre' => 'trimestre',
            'cuatrimestre' => 'cuatrimestre',
            'semestre' => 'semestre',
            'anual' => 'anual',
            'modulo' => 'modulo',
            'módulo' => 'modulo',
        ];

        return $map[$tipo] ?? 'semestre';
    }

    /**
     * Resuelve sede sin violar sedes_institucion_id_clave_unique:
     * prioridad institución+clave, luego legacy_kcve_subsede, luego metadata.
     */
    private function buscarSedeParaImportacion(int $legacyId, int $institucionId, string $clave): ?Sede
    {
        if ($institucionId > 0 && $clave !== '') {
            $porClave = Sede::query()
                ->where('institucion_id', $institucionId)
                ->where('clave', $clave)
                ->first();
            if ($porClave !== null) {
                return $porClave;
            }
        }

        $porKcve = Sede::query()->where('legacy_kcve_subsede', $legacyId)->first();
        if ($porKcve !== null) {
            return $porKcve;
        }

        $porMeta = $this->buscarPorLegacy(Sede::class, $legacyId);

        return $porMeta instanceof Sede ? $porMeta : null;
    }

    /**
     * Evita violación de unique en legacy_kcve_subsede al reasignar la subsede SISEES.
     */
    private function liberarLegacyKcveSubsedeConflicto(int $legacyKcve, int $exceptoSedeId): void
    {
        $query = Sede::query()->where('legacy_kcve_subsede', $legacyKcve);
        if ($exceptoSedeId > 0) {
            $query->where('id', '!=', $exceptoSedeId);
        }
        $query->update(['legacy_kcve_subsede' => null]);
    }

    /**
     * @param  class-string<Model>  $modelClass
     */
    private function buscarPorLegacy(string $modelClass, int|string $legacyId): ?Model
    {
        /** @var Model|null $found */
        $found = $modelClass::query()
            ->where('metadata->legacy_sisees_id', (string) $legacyId)
            ->first();

        return $found;
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function indexarPorId(\Illuminate\Support\Collection $rows): array
    {
        $out = [];
        foreach ($rows as $row) {
            $arr = (array) $row;
            $id = (int) ($arr['id'] ?? 0);
            if ($id > 0) {
                $out[$id] = $arr;
            }
        }

        return $out;
    }

    /**
     * @return array{connection: string, host: string, database: string}
     */
    private function origenConexion(): array
    {
        $cfg = config('database.connections.mysql_sisees_legacy', []);

        return [
            'connection' => 'mysql_sisees_legacy',
            'host' => (string) ($cfg['host'] ?? ''),
            'database' => (string) ($cfg['database'] ?? ''),
        ];
    }

    /**
     * @param  array<string, mixed>  $reporte
     */
    private function advertir(array &$reporte, string $mensaje): void
    {
        $max = 40;
        if (count($reporte['advertencias'] ?? []) >= $max) {
            return;
        }
        if (! in_array($mensaje, $reporte['advertencias'], true)) {
            $reporte['advertencias'][] = $mensaje;
        }
    }
}
