<?php

declare(strict_types=1);

namespace App\Services\Diagnostico;

use App\Models\User;
use App\Services\Demo\DemoDataAuditService;
use App\Services\Demo\DemoDataCatalogClassifier;
use App\Support\Diagnostico\TableSchemaHelper;
use Illuminate\Support\Facades\DB;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

final class DiagnosticoBaseService
{
    /** @var list<string> */
    public const TABLAS_PRIORITARIAS = [
        'users', 'roles', 'permissions', 'menus',
        'subsistemas', 'regiones', 'instituciones', 'sedes', 'niveles_academicos',
        'ciclos_escolares', 'programas_estudio', 'planes_estudio', 'ofertas_academicas',
        'materias', 'plan_materias', 'periodos_escolares',
        'estatus_academicos', 'estatus_matricula', 'escalas_calificacion',
        'alumnos', 'matriculas', 'inscripciones_periodo',
        'cargas_academicas', 'materias_cursadas', 'trayectorias_academicas',
        'documentos_academicos', 'documento_observaciones', 'folios', 'url_short_tokens',
        'documento_payloads', 'documento_firmas', 'documento_versiones',
        'cadena_original_generadas', 'integraciones_logs',
        'entidades_federativas', 'municipios',
    ];

    public function __construct(
        private readonly TableSchemaHelper $schema = new TableSchemaHelper,
        private readonly DemoDataAuditService $demoAudit = new DemoDataAuditService,
        private readonly DemoDataCatalogClassifier $demoClassifier = new DemoDataCatalogClassifier,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function ejecutar(): array
    {
        return [
            'generado_en' => now()->toIso8601String(),
            'conexion' => [
                'driver' => DB::connection()->getDriverName(),
                'database' => DB::connection()->getDatabaseName(),
            ],
            'tablas' => $this->diagnosticarTablas(),
            'catalogos' => $this->diagnosticarCatalogos(),
            'operacion_academica' => $this->diagnosticarOperacionAcademica(),
            'usuarios' => $this->diagnosticarUsuarios(),
            'permisos_menus' => $this->diagnosticarPermisosMenus(),
            'limpieza_demo' => $this->demoAudit->auditar(),
            'demo_clasificacion' => $this->demoClassifier->clasificar(),
            'ciclos_periodos' => $this->diagnosticarCiclosPeriodos(),
            'catalogos_control_escolar' => $this->diagnosticarCatalogosControlEscolar(),
            'recomendaciones' => $this->generarRecomendaciones(),
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function diagnosticarTablas(): array
    {
        $importantNulls = ['subsistema_id', 'institucion_id', 'sede_id', 'alumno_id', 'matricula_id', 'programa_estudio_id', 'plan_estudio_id', 'oferta_academica_id', 'clave', 'curp', 'email'];

        $out = [];
        foreach (self::TABLAS_PRIORITARIAS as $table) {
            $exists = $this->schema->exists($table);
            $cols = $exists ? $this->schema->columns($table) : [];
            $last = $exists ? $this->schema->lastRows($table, 5, ['id', 'clave', 'nombre', 'name', 'email', 'label', 'route', 'created_at']) : [];
            $nulls = [];
            if ($exists) {
                foreach ($importantNulls as $col) {
                    $n = $this->schema->countNullsForColumn($table, $col);
                    if ($n !== null && $n['nulls'] > 0) {
                        $nulls[] = $n;
                    }
                }
            }

            $out[] = [
                'tabla' => $table,
                'existe' => $exists,
                'total_registros' => $exists ? $this->schema->countAll($table) : 0,
                'soft_deleted' => $exists ? $this->schema->countSoftDeleted($table) : null,
                'columnas' => $cols,
                'primary_keys' => $exists ? $this->schema->primaryKeys($table) : [],
                'foreign_keys' => $exists ? $this->schema->foreignKeys($table) : [],
                'tamano_bytes' => $exists ? $this->schema->approximateSizeBytes($table) : null,
                'ultimos_registros' => array_map(static fn ($r) => (array) $r, $last),
                'campos_demo_detectados' => $this->schema->detectDemoFieldsInRows($last),
                'registros_demo_heuristica' => $exists ? $this->schema->countDemoLikeRows($table) : 0,
                'nulls_importantes' => $nulls,
            ];
        }

        return $out;
    }

    /**
     * @return array<string, mixed>
     */
    private function diagnosticarCatalogos(): array
    {
        return [
            'subsistemas' => $this->listarTablaCompleta('subsistemas'),
            'instituciones' => $this->listarConColumnasDisponibles('instituciones', ['id', 'clave', 'nombre', 'subsistema_id', 'region_id']),
            'sedes' => $this->diagnosticarSedes(),
            'programas_estudio' => $this->diagnosticarProgramas(),
            'planes_estudio' => $this->diagnosticarPlanes(),
            'materias' => $this->diagnosticarMaterias(),
            'ofertas_academicas' => $this->diagnosticarOfertas(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function listarTablaCompleta(string $table): array
    {
        if (! $this->schema->exists($table)) {
            return ['existe' => false, 'columnas' => [], 'registros' => []];
        }

        $cols = $this->schema->columns($table);
        $rows = DB::table($table)->select($cols)->limit(500)->get()->map(static fn ($r) => (array) $r)->all();

        return [
            'existe' => true,
            'columnas' => $cols,
            'total' => $this->schema->countAll($table),
            'registros' => $rows,
            'demo_heuristica' => $this->schema->countDemoLikeRows($table),
        ];
    }

    /**
     * @param  list<string>  $preferred
     * @return array<string, mixed>
     */
    private function listarConColumnasDisponibles(string $table, array $preferred): array
    {
        if (! $this->schema->exists($table)) {
            return ['existe' => false, 'columnas' => [], 'registros' => []];
        }

        $select = $this->schema->resolveSelectColumns($table, $preferred);
        $rows = DB::table($table)->select($select)->limit(500)->get()->map(static fn ($r) => (array) $r)->all();

        return [
            'existe' => true,
            'columnas' => $this->schema->columns($table),
            'columnas_listadas' => $select,
            'total' => $this->schema->countAll($table),
            'registros' => $rows,
            'demo_heuristica' => $this->schema->countDemoLikeRows($table),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function diagnosticarSedes(): array
    {
        $base = $this->listarConColumnasDisponibles('sedes', ['id', 'clave', 'cct', 'nombre', 'institucion_id', 'subsistema_id', 'region_id']);
        if (! ($base['existe'] ?? false)) {
            return $base;
        }

        $sinCct = 0;
        if ($this->schema->hasColumn('sedes', 'cct')) {
            $sinCct = (int) DB::table('sedes')->whereNull('cct')->orWhere('cct', '')->count();
        } elseif ($this->schema->hasColumn('sedes', 'clave')) {
            $sinCct = (int) DB::table('sedes')->whereNull('clave')->orWhere('clave', '')->count();
        }

        $sinInstitucion = $this->schema->hasColumn('sedes', 'institucion_id')
            ? (int) DB::table('sedes')->whereNull('institucion_id')->count()
            : null;

        $claveLegacy = $this->schema->hasColumn('sedes', 'clave')
            ? (int) DB::table('sedes')->where('clave', 'like', '%LEGACY%')->orWhere('clave', 'like', '%legacy%')->count()
            : 0;

        $base['sedes_sin_cct'] = $sinCct;
        $base['sedes_sin_institucion'] = $sinInstitucion;
        $base['sedes_clave_legacy'] = $claveLegacy;

        return $base;
    }

    /**
     * @return array<string, mixed>
     */
    private function diagnosticarProgramas(): array
    {
        $base = $this->listarTablaCompleta('programas_estudio');
        $base['tiene_subsistema_id'] = $this->schema->hasColumn('programas_estudio', 'subsistema_id');
        if ($base['tiene_subsistema_id']) {
            $base['sin_subsistema_id'] = (int) DB::table('programas_estudio')->whereNull('subsistema_id')->count();
        }

        return $base;
    }

    /**
     * @return array<string, mixed>
     */
    private function diagnosticarPlanes(): array
    {
        $base = $this->listarTablaCompleta('planes_estudio');
        $base['tiene_programa_estudio_id'] = $this->schema->hasColumn('planes_estudio', 'programa_estudio_id');
        if ($base['tiene_programa_estudio_id']) {
            $base['sin_programa_estudio_id'] = (int) DB::table('planes_estudio')->whereNull('programa_estudio_id')->count();
        }

        return $base;
    }

    /**
     * @return array<string, mixed>
     */
    private function diagnosticarMaterias(): array
    {
        $base = $this->listarTablaCompleta('materias');
        $ligadas = 0;
        if ($this->schema->exists('plan_materias') && $this->schema->hasColumn('materias', 'id')) {
            $ligadas = (int) DB::table('materias')
                ->whereIn('id', DB::table('plan_materias')->select('materia_id'))
                ->count();
        }
        $base['ligadas_plan_materias'] = $ligadas;
        $base['sin_plan_materia'] = max(0, ($base['total'] ?? 0) - $ligadas);

        return $base;
    }

    /**
     * @return array<string, mixed>
     */
    private function diagnosticarOfertas(): array
    {
        $preferred = ['id', 'clave', 'institucion_id', 'sede_id', 'programa_estudio_id', 'plan_estudio_id', 'subsistema_id', 'ciclo_escolar_id', 'metadata'];
        $base = $this->listarConColumnasDisponibles('ofertas_academicas', $preferred);

        $incompletas = 0;
        if ($this->schema->exists('ofertas_academicas')) {
            $puedeFiltrar = $this->schema->hasColumn('ofertas_academicas', 'sede_id')
                || $this->schema->hasColumn('ofertas_academicas', 'programa_estudio_id')
                || $this->schema->hasColumn('ofertas_academicas', 'plan_estudio_id');
            if ($puedeFiltrar) {
                $incompletas = (int) DB::table('ofertas_academicas')->where(function ($q): void {
                    if ($this->schema->hasColumn('ofertas_academicas', 'sede_id')) {
                        $q->orWhereNull('sede_id');
                    }
                    if ($this->schema->hasColumn('ofertas_academicas', 'programa_estudio_id')) {
                        $q->orWhereNull('programa_estudio_id');
                    }
                    if ($this->schema->hasColumn('ofertas_academicas', 'plan_estudio_id')) {
                        $q->orWhereNull('plan_estudio_id');
                    }
                })->count();
            }
        }

        $base['ofertas_incompletas'] = $incompletas;
        $base['ofertas_demo_heuristica'] = $this->schema->countDemoLikeRows('ofertas_academicas');

        return $base;
    }

    /**
     * @return array<string, mixed>
     */
    private function diagnosticarOperacionAcademica(): array
    {
        $totales = [
            'alumnos' => $this->schema->countAll('alumnos'),
            'matriculas' => $this->schema->countAll('matriculas'),
            'materias_cursadas' => $this->schema->countAll('materias_cursadas'),
            'trayectorias_academicas' => $this->schema->countAll('trayectorias_academicas'),
            'documentos_academicos' => $this->schema->countAll('documentos_academicos'),
            'documento_observaciones' => $this->schema->countAll('documento_observaciones'),
        ];

        return array_merge($totales, [
            'matriculas_sin_alumno' => $this->countOrphans('matriculas', 'alumno_id', 'alumnos'),
            'alumnos_sin_matricula' => $this->countAlumnosSinMatricula(),
            'documentos_sin_alumno' => $this->countOrphans('documentos_academicos', 'alumno_id', 'alumnos'),
            'documentos_sin_matricula' => $this->countOrphans('documentos_academicos', 'matricula_id', 'matriculas'),
            'trayectorias_sin_matricula' => $this->countOrphans('trayectorias_academicas', 'matricula_id', 'matriculas'),
            'documentos_activos_duplicados' => $this->detectarDocumentosDuplicadosActivos(),
        ]);
    }

    private function countOrphans(string $table, string $fkColumn, string $parentTable): ?int
    {
        if (! $this->schema->hasColumn($table, $fkColumn) || ! $this->schema->exists($parentTable)) {
            return null;
        }

        return (int) DB::table($table)
            ->whereNotNull($fkColumn)
            ->whereNotIn($fkColumn, DB::table($parentTable)->select('id'))
            ->count();
    }

    private function countAlumnosSinMatricula(): ?int
    {
        if (! $this->schema->exists('alumnos') || ! $this->schema->exists('matriculas') || ! $this->schema->hasColumn('matriculas', 'alumno_id')) {
            return null;
        }

        return (int) DB::table('alumnos')
            ->whereNotIn('id', DB::table('matriculas')->select('alumno_id'))
            ->count();
    }

    private function detectarDocumentosDuplicadosActivos(): ?int
    {
        if (! $this->schema->exists('documentos_academicos')) {
            return null;
        }

        $cols = $this->schema->columns('documentos_academicos');
        $group = array_values(array_intersect(['alumno_id', 'tipo_documento', 'estado_workflow'], $cols));
        if (! in_array('alumno_id', $group, true)) {
            return null;
        }

        $query = DB::table('documentos_academicos');
        if ($this->schema->hasColumn('documentos_academicos', 'deleted_at')) {
            $query->whereNull('deleted_at');
        }

        $rows = $query->select(array_merge($group, [DB::raw('COUNT(*) as duplicados')]))
            ->groupBy($group)
            ->havingRaw('COUNT(*) > 1')
            ->get();

        return $rows->count();
    }

    /**
     * @return array<string, mixed>
     */
    private function diagnosticarUsuarios(): array
    {
        if (! $this->schema->exists('users')) {
            return ['existe' => false];
        }

        $select = $this->schema->resolveSelectColumns('users', ['id', 'name', 'email', 'created_at']);
        $usuarios = DB::table('users')->select($select)->get();

        $detalle = [];
        foreach ($usuarios as $u) {
            $user = User::query()->find($u->id);
            $roles = $user ? $user->getRoleNames()->all() : [];
            $detalle[] = [
                'usuario' => (array) $u,
                'roles' => $roles,
            ];
        }

        $demoLocal = (int) DB::table('users')->where('email', 'like', '%@sices.local')->count();
        $sinRol = 0;
        foreach ($detalle as $row) {
            if ($row['roles'] === []) {
                $sinRol++;
            }
        }

        $superadminOk = User::role('superadmin')->exists();

        return [
            'existe' => true,
            'total' => count($detalle),
            'usuarios' => $detalle,
            'usuarios_sices_local' => $demoLocal,
            'usuarios_sin_rol' => $sinRol,
            'existe_superadmin_funcional' => $superadminOk,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function diagnosticarPermisosMenus(): array
    {
        $rolesTotal = $this->schema->exists('roles') ? Role::query()->count() : 0;
        $permTotal = $this->schema->exists('permissions') ? Permission::query()->count() : 0;
        $menusTotal = $this->schema->countAll('menus');

        $permDup = [];
        if ($this->schema->exists('permissions')) {
            $permDup = DB::table('permissions')
                ->select('name', 'guard_name', DB::raw('COUNT(*) as c'))
                ->groupBy('name', 'guard_name')
                ->having('c', '>', 1)
                ->get()
                ->map(static fn ($r) => (array) $r)
                ->all();
        }

        $menuDup = [];
        if ($this->schema->exists('menus')) {
            if ($this->schema->hasColumn('menus', 'route')) {
                $menuDup = DB::table('menus')
                    ->select('route', DB::raw('COUNT(*) as c'))
                    ->groupBy('route')
                    ->having('c', '>', 1)
                    ->get()
                    ->map(static fn ($r) => (array) $r)
                    ->all();
            }
        }

        $menusSinRuta = $this->schema->hasColumn('menus', 'route')
            ? (int) DB::table('menus')->whereNull('route')->orWhere('route', '')->count()
            : null;

        $menusSinRol = null;
        if ($this->schema->exists('menu_role') && $this->schema->exists('menus')) {
            $menusSinRol = (int) DB::table('menus')
                ->whereNotIn('id', DB::table('menu_role')->select('menu_id'))
                ->count();
        }

        $rutasApp = [];
        if ($this->schema->hasColumn('menus', 'route')) {
            $rutasApp = DB::table('menus')
                ->where('route', 'like', '/app%')
                ->pluck('route')
                ->map(static fn ($r) => (string) $r)
                ->all();
        }

        return [
            'total_roles' => $rolesTotal,
            'total_permisos' => $permTotal,
            'total_menus' => $menusTotal,
            'permisos_duplicados' => $permDup,
            'menus_duplicados_por_ruta' => $menuDup,
            'menus_sin_ruta' => $menusSinRuta,
            'menus_sin_rol' => $menusSinRol,
            'rutas_menu_app' => $rutasApp,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function generarRecomendaciones(): array
    {
        $demo = $this->demoAudit->auditar();
        $cl = $demo['clasificacion'];
        $activo = $cl['totales']['activo'];
        $purgable = $cl['totales']['purgable'];
        $catalogosReales = $cl['catalogos_activos_reales'];

        $tablasVacias = [];
        foreach ($this->diagnosticarTablas() as $t) {
            if (($t['existe'] ?? false) && ($t['total_registros'] ?? 0) === 0) {
                $tablasVacias[] = $t['tabla'];
            }
        }

        $catalogosIncompletos = [];
        if (($catalogosReales['sedes'] ?? 0) === 0 && $this->schema->countAll('sedes') === 0) {
            $catalogosIncompletos[] = 'sedes';
        }
        if (($catalogosReales['instituciones'] ?? 0) === 0 && $this->schema->countAll('instituciones') === 0) {
            $catalogosIncompletos[] = 'instituciones';
        }
        if (($catalogosReales['programas_estudio'] ?? 0) === 0 && $this->schema->countAll('programas_estudio') === 0) {
            $catalogosIncompletos[] = 'programas_estudio';
        }

        $conservar = ['subsistemas', 'regiones', 'instituciones', 'sedes', 'niveles_academicos', 'roles', 'permissions', 'menus', 'entidades_federativas', 'municipios'];
        $parecenDemo = array_keys(array_filter(
            $cl['demo_activo'] + $cl['demo_purgable'],
            static fn (int $n) => $n > 0,
        ));

        $ordenCarga = [
            'subsistemas', 'regiones', 'instituciones', 'sedes', 'niveles_academicos',
            'ciclos_escolares reales', 'programas reales', 'planes reales', 'materias',
            'plan_materias', 'ofertas_academicas', 'usuarios reales por rol', 'alumnos',
            'matriculas', 'inscripciones/cargas', 'materias_cursadas',
            'trayectorias_academicas', 'solicitudes/documentos académicos',
        ];

        $riesgos = [];
        if ($activo > 0) {
            $riesgos[] = "Persisten {$activo} registros demo activos; ejecute: php artisan sices:limpiar-demo --confirm";
        }
        if ($purgable > 0) {
            $riesgos[] = "Persisten {$purgable} registros demo soft-deleted purgables; ejecute: php artisan sices:limpiar-demo --confirm --purge-soft-deleted";
        }
        if ($activo === 0 && $purgable === 0) {
            $riesgos[] = 'Sin demo activo ni purgable detectado; puede proceder con carga real de catálogos y operación académica.';
        }
        if (! User::role('superadmin')->exists()) {
            $riesgos[] = 'No hay usuario con rol superadmin; la operación institucional puede quedar bloqueada.';
        }

        $ciclosStats = $this->diagnosticarCiclosPeriodos();
        if (($ciclosStats['ciclos_escolares']['total'] ?? 0) === 0) {
            $riesgos[] = 'No hay ciclos escolares registrados; matrícula e inscripción quedan bloqueadas.';
        } elseif ($ciclosStats['sin_ciclo_actual'] ?? false) {
            $riesgos[] = 'No hay ciclo escolar marcado como actual; configure uno en Catálogos → Ciclos y periodos.';
        }

        $catalogosCe = $this->diagnosticarCatalogosControlEscolar();
        if (($catalogosCe['escalas_calificacion']['sin_escala_activa'] ?? false) === true) {
            $riesgos[] = 'No hay escalas de calificación activas; la captura de calificaciones puede quedar bloqueada.';
        }

        $postPurga = [];
        if ($activo === 0 && $purgable === 0) {
            $postPurga[] = 'Importar ciclos, programas y planes institucionales reales (sin prefijo SXCE-DEMO).';
            $postPurga[] = 'Crear ofertas académicas ligadas a sedes e instituciones reales.';
            $postPurga[] = 'Registrar usuarios operativos (no @sices.local) y asignar roles Spatie.';
            $postPurga[] = 'Cargar alumnos y matrículas vía importación controlada documentada.';
        }

        return [
            'demo_resumen' => [
                'activo' => $activo,
                'soft_deleted' => $cl['totales']['soft_deleted'],
                'purgable' => $purgable,
                'catalogos_activos_reales' => $catalogosReales,
            ],
            'datos_conservar' => $conservar,
            'datos_parecen_demo' => $parecenDemo,
            'catalogos_incompletos' => $catalogosIncompletos,
            'tablas_listas_datos_reales' => array_values(array_diff(
                ['alumnos', 'matriculas', 'materias_cursadas', 'trayectorias_academicas', 'documentos_academicos'],
                $tablasVacias,
            )),
            'tablas_poblar_primero' => $catalogosIncompletos !== [] ? $catalogosIncompletos : ['ofertas_academicas', 'ciclos_escolares'],
            'carga_real_despues_purga' => $postPurga,
            'riesgos' => $riesgos,
            'orden_carga_recomendado' => $ordenCarga,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function diagnosticarCiclosPeriodos(): array
    {
        if (! $this->schema->exists('ciclos_escolares')) {
            return ['existe' => false];
        }

        $totalCiclos = $this->schema->countAll('ciclos_escolares');
        $activosCiclos = (int) DB::table('ciclos_escolares')->where('activo', true)->whereNull('deleted_at')->count();
        $actual = DB::table('ciclos_escolares')->where('es_actual', true)->whereNull('deleted_at')->first();

        $totalPeriodos = $this->schema->exists('periodos_escolares') ? $this->schema->countAll('periodos_escolares') : 0;
        $activosPeriodos = $this->schema->exists('periodos_escolares')
            ? (int) DB::table('periodos_escolares')->where('activo', true)->whereNull('deleted_at')->count()
            : 0;

        return [
            'existe' => true,
            'ciclos_escolares' => [
                'total' => $totalCiclos,
                'activos' => $activosCiclos,
                'inactivos' => max(0, $totalCiclos - $activosCiclos),
            ],
            'ciclo_actual' => $actual ? [
                'id' => $actual->id,
                'clave' => $actual->clave,
                'nombre' => $actual->nombre,
            ] : null,
            'sin_ciclo_actual' => $actual === null,
            'periodos_escolares' => [
                'total' => $totalPeriodos,
                'activos' => $activosPeriodos,
                'inactivos' => max(0, $totalPeriodos - $activosPeriodos),
            ],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function diagnosticarCatalogosControlEscolar(): array
    {
        $out = [
            'estatus_academicos' => ['existe' => false, 'total' => 0, 'activos' => 0],
            'estatus_matricula' => ['existe' => false, 'total' => 0, 'activos' => 0],
            'escalas_calificacion' => ['existe' => false, 'total' => 0, 'activos' => 0, 'sin_escala_activa' => true],
        ];

        if ($this->schema->exists('estatus_academicos')) {
            $total = $this->schema->countAll('estatus_academicos');
            $activos = (int) DB::table('estatus_academicos')->where('activo', true)->whereNull('deleted_at')->count();
            $out['estatus_academicos'] = [
                'existe' => true,
                'total' => $total,
                'activos' => $activos,
                'inactivos' => max(0, $total - $activos),
            ];
        }

        if ($this->schema->exists('estatus_matricula')) {
            $total = $this->schema->countAll('estatus_matricula');
            $activos = (int) DB::table('estatus_matricula')->where('activo', true)->whereNull('deleted_at')->count();
            $out['estatus_matricula'] = [
                'existe' => true,
                'total' => $total,
                'activos' => $activos,
                'inactivos' => max(0, $total - $activos),
            ];
        }

        if ($this->schema->exists('escalas_calificacion')) {
            $total = $this->schema->countAll('escalas_calificacion');
            $activos = (int) DB::table('escalas_calificacion')->where('activo', true)->whereNull('deleted_at')->count();
            $out['escalas_calificacion'] = [
                'existe' => true,
                'total' => $total,
                'activos' => $activos,
                'inactivos' => max(0, $total - $activos),
                'sin_escala_activa' => $activos === 0,
            ];
        }

        return $out;
    }
}
