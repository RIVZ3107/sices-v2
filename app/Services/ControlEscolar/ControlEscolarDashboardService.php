<?php

declare(strict_types=1);

namespace App\Services\ControlEscolar;

use App\Models\Alumno;
use App\Models\CicloEscolar;
use App\Models\DocumentoAcademico;
use App\Models\ImportacionHistoricaMaterias;
use App\Models\InscripcionPeriodo;
use App\Models\Matricula;
use App\Models\OfertaAcademica;
use App\Models\TrayectoriaAcademica;
use App\Models\User;
use App\Services\Certificacion\CertificacionAlcanceService;
use App\Services\Certificacion\SolicitudMatriculaService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

class ControlEscolarDashboardService
{
    /** Etiquetas y colores para escenarios del seeder demo (metadata.scenario). */
    private const ESCENARIO_DEMO_VISUAL = [
        'listo_certificar' => ['label' => 'Listo para certificar', 'color' => '#16a34a'],
        'sin_matricula' => ['label' => 'Sin matrícula activa', 'color' => '#dc2626'],
        'matricula_sin_inscripcion' => ['label' => 'Sin inscripción', 'color' => '#ea580c'],
        'inscrito_sin_carga' => ['label' => 'Sin carga académica', 'color' => '#ca8a04'],
        'carga_sin_calificaciones' => ['label' => 'Calificaciones pendientes', 'color' => '#2563eb'],
        'importacion_errores' => ['label' => 'Importación con errores', 'color' => '#991b1b'],
        'documento_observaciones' => ['label' => 'Documento observado', 'color' => '#7c3aed'],
        'solicitud_revision' => ['label' => 'Solicitud en revisión', 'color' => '#534AB7'],
        'legacy_fuera_plan' => ['label' => 'Carga histórica fuera de plan', 'color' => '#64748b'],
    ];

    private const ESTATUS_VISUAL = [
        'activo' => ['label' => 'Activos', 'color' => '#16a34a'],
        'aspirante' => ['label' => 'Aspirantes', 'color' => '#2563eb'],
        'baja_temporal' => ['label' => 'Baja temporal', 'color' => '#ca8a04'],
        'baja_definitiva' => ['label' => 'Baja definitiva', 'color' => '#dc2626'],
        'egresado' => ['label' => 'Egresados', 'color' => '#7c3aed'],
        'inactivo' => ['label' => 'Inactivos', 'color' => '#64748b'],
    ];

    private const ESTADOS_MATRICULA_ACTIVA = ['activa', 'vigente'];

    private const ESTATUS_INSCRIPCION_ACTIVA = ['activa', 'inscrita'];

    /** @var list<int>|null */
    private ?array $ofertasIdsCache = null;

    private ?int $scopeUserId = null;

    public function __construct(
        protected CertificacionAlcanceService $alcance,
        protected SolicitudMatriculaService $solicitudesMatricula,
    ) {}

    public function resumen(User $user): array
    {
        return $this->conAlcanceUsuario($user, function () use ($user): array {
            $conteosEstatus = $this->conteosAlumnosPorEstatus($user);
            $distribucion = $this->alumnosDistribucion($user, $conteosEstatus);
            $muestras = $this->cargarMuestrasOperativas($user);

            $solicitudesMetricas = $user->can('ver_solicitud_matricula')
                ? $this->solicitudesMatricula->metricasControlEscolar($user)
                : [
                    'solicitudes_matricula_borrador' => 0,
                    'solicitudes_matricula_enviadas' => 0,
                    'solicitudes_matricula_con_observaciones' => 0,
                    'solicitudes_matricula_matricula_asignada' => 0,
                ];

            $metricas = array_merge($this->metricasOperativas($user, $conteosEstatus), $solicitudesMetricas);
            $pendientes = $this->armarPendientesPrioritarios($muestras);
            $procesos = $this->armarProcesosRecientes($user, $muestras, $pendientes);

            return [
                'actualizado_en' => now()->toIso8601String(),
                'contexto' => $this->contextoOperativo($user, (int) $distribucion['total']),
                'atencion_prioritaria' => $this->armarAtencionPrioritaria($metricas),
                'metricas' => $metricas,
                'alumnos_distribucion' => $distribucion,
                'cards' => [
                    ['key' => 'alumnos_activos', 'title' => 'Alumnos activos', 'value' => $metricas['alumnos_activos'], 'href' => '/app/expedientes'],
                    ['key' => 'solicitudes_matricula', 'title' => 'Solicitudes de matrícula', 'value' => ($metricas['solicitudes_matricula_borrador'] ?? 0) + ($metricas['solicitudes_matricula_enviadas'] ?? 0) + ($metricas['solicitudes_matricula_con_observaciones'] ?? 0), 'href' => '/app/expedientes'],
                    ['key' => 'inscripciones_pendientes', 'title' => 'Inscripciones pendientes', 'value' => $metricas['inscripciones_pendientes'], 'href' => '/app/expedientes'],
                    ['key' => 'calificaciones_pendientes', 'title' => 'Calificaciones pendientes', 'value' => $metricas['calificaciones_pendientes'], 'href' => '/app/expedientes'],
                    ['key' => 'documentos_obs', 'title' => 'Documentos con observaciones', 'value' => $metricas['documentos_con_observaciones'], 'href' => '/app/expedientes'],
                ],
                'pendientes_prioritarios' => $pendientes,
                'documentos_en_proceso' => [],
                'importaciones_recientes' => [],
                'procesos_recientes' => $procesos,
            ];
        });
    }

    /**
     * Ejecuta lógica con alcance territorial cacheado (ofertas IDs) para el usuario.
     *
     * @template T
     *
     * @param  callable(): T  $callback
     * @return T
     */
    public function conAlcanceUsuario(User $user, callable $callback): mixed
    {
        $this->iniciarAlcance($user);

        try {
            return $callback();
        } finally {
            $this->limpiarAlcance();
        }
    }

    /**
     * Métricas para la página de gestión de alumnos (sin cargar el tablero completo).
     * Debe invocarse dentro de {@see conAlcanceUsuario}.
     *
     * @return array{
     *   alumnos_activos: int,
     *   baja_temporal: int,
     *   egresados: int,
     *   expedientes_incompletos: int,
     *   total_alcance: int
     * }
     */
    public function metricasGestionAlumnos(User $user): array
    {
        $conteos = $this->conteosAlumnosPorEstatus($user);

        return [
            'alumnos_activos' => (int) ($conteos['activo'] ?? 0),
            'baja_temporal' => (int) ($conteos['baja_temporal'] ?? 0),
            'egresados' => (int) ($conteos['egresado'] ?? 0),
            'expedientes_incompletos' => $this->alumnosSinMatriculaActiva($user)->count(),
            'total_alcance' => array_sum($conteos),
        ];
    }

    /**
     * Query de alumnos en alcance. Debe invocarse dentro de {@see conAlcanceUsuario}.
     *
     * @return Builder<Alumno>
     */
    public function queryAlumnosEnAlcance(User $user): Builder
    {
        return $this->alumnosBaseQuery($user);
    }

    private function iniciarAlcance(User $user): void
    {
        $this->scopeUserId = $user->id;
        $this->ofertasIdsCache = null;
        $this->ofertasIds($user);
    }

    private function limpiarAlcance(): void
    {
        $this->scopeUserId = null;
        $this->ofertasIdsCache = null;
    }

    /**
     * @return list<int>
     */
    private function ofertasIds(User $user): array
    {
        if ($this->ofertasIdsCache !== null && $this->scopeUserId === $user->id) {
            return $this->ofertasIdsCache;
        }

        if ($this->alcance->exentaRestriccionTerritorial($user)) {
            return $this->ofertasIdsCache = OfertaAcademica::query()->pluck('id')->all();
        }

        $ofertas = OfertaAcademica::query();
        $this->alcance->aplicarAlcanceOfertasAcademicas($ofertas, $user);

        return $this->ofertasIdsCache = $ofertas->pluck('id')->all();
    }

    /**
     * @return array<string, int>
     */
    private function conteosAlumnosPorEstatus(User $user): array
    {
        $rows = $this->alumnosBaseQuery($user)
            ->selectRaw('estatus, COUNT(*) as total')
            ->groupBy('estatus')
            ->pluck('total', 'estatus');

        $conteos = [];
        foreach ($rows as $estatus => $total) {
            $conteos[(string) $estatus] = (int) $total;
        }

        return $conteos;
    }

    /**
     * @param  array<string, int>  $conteosEstatus
     * @return array<string, int>
     */
    private function metricasOperativas(User $user, array $conteosEstatus): array
    {
        $ids = $this->ofertasIds($user);

        return [
            'alumnos_activos' => (int) ($conteosEstatus['activo'] ?? 0),
            'aspirantes_pendientes' => (int) ($conteosEstatus['aspirante'] ?? 0),
            'matriculas_incompletas' => $this->alumnosSinMatriculaActiva($user)->count(),
            'inscripciones_pendientes' => $ids === []
                ? 0
                : Matricula::query()
                    ->whereIn('oferta_academica_id', $ids)
                    ->whereIn('estado', self::ESTADOS_MATRICULA_ACTIVA)
                    ->whereDoesntHave('inscripcionesPeriodo', fn (Builder $q) => $q->whereIn('estatus', self::ESTATUS_INSCRIPCION_ACTIVA))
                    ->count(),
            'cargas_academicas_pendientes' => $ids === []
                ? 0
                : InscripcionPeriodo::query()
                    ->whereIn('estatus', self::ESTATUS_INSCRIPCION_ACTIVA)
                    ->whereDoesntHave('cargasAcademicas')
                    ->whereHas('matricula', fn (Builder $m) => $m->whereIn('oferta_academica_id', $ids)->whereIn('estado', self::ESTADOS_MATRICULA_ACTIVA))
                    ->count(),
            'calificaciones_pendientes' => $this->inscripcionesConCalificacionesPendientes($user)->count(),
            'importaciones_con_errores' => $this->importacionesConErrores($user)->count(),
            'trayectorias_listas_para_certificar' => $this->trayectoriasListas($user)->count(),
            'documentos_con_observaciones' => $this->documentosConObservaciones($user)->count(),
            'solicitudes_en_revision' => $this->solicitudesEnRevision($user)->count(),
            'reinscripciones_bloqueadas' => $this->reinscripcionesBloqueadas($user),
        ];
    }

    /**
     * @param  array<string, int|float>  $metricas
     * @return list<array{key: string, count: int, titulo: string, descripcion: string, href: string, severidad: string}>
     */
    private function armarAtencionPrioritaria(array $metricas): array
    {
        $importaciones = (int) ($metricas['importaciones_con_errores'] ?? 0);
        $observaciones = (int) ($metricas['documentos_con_observaciones'] ?? 0);
        $reinscripciones = (int) ($metricas['reinscripciones_bloqueadas'] ?? 0);

        $items = [];

        if ($importaciones > 0) {
            $items[] = [
                'key' => 'importaciones',
                'count' => $importaciones,
                'titulo' => $importaciones === 1 ? '1 importación con error' : "{$importaciones} importaciones con error",
                'descripcion' => 'Requieren corrección para poder certificar.',
                'href' => '/app/importaciones',
                'severidad' => 'error',
            ];
        }

        if ($observaciones > 0) {
            $items[] = [
                'key' => 'observaciones',
                'count' => $observaciones,
                'titulo' => $observaciones === 1 ? '1 solicitud con observaciones' : "{$observaciones} solicitudes con observaciones",
                'descripcion' => 'Atender observaciones pendientes.',
                'href' => '/app/control-escolar/solicitudes',
                'severidad' => 'warning',
            ];
        }

        if ($reinscripciones > 0) {
            $items[] = [
                'key' => 'reinscripciones',
                'count' => $reinscripciones,
                'titulo' => $reinscripciones === 1 ? '1 reinscripción bloqueada' : "{$reinscripciones} reinscripciones bloqueadas",
                'descripcion' => 'Documentación incompleta.',
                'href' => '/app/control-escolar/reinscripciones',
                'severidad' => 'info',
            ];
        }

        return $items;
    }

    protected function reinscripcionesBloqueadas(User $user): int
    {
        $ids = $this->ofertasIds($user);
        if ($ids === []) {
            return 0;
        }

        return InscripcionPeriodo::query()
            ->whereIn('estatus', self::ESTATUS_INSCRIPCION_ACTIVA)
            ->whereHas('matricula', fn (Builder $m) => $m->whereIn('oferta_academica_id', $ids)->whereIn('estado', self::ESTADOS_MATRICULA_ACTIVA))
            ->whereHas('matricula.alumno.documentosAcademicos', function (Builder $q): void {
                $q->where('estado_workflow', 'rechazado')
                    ->orWhereHas('observacionesPendientes');
            })
            ->count();
    }

    /**
     * @return array{
     *   sin_matricula: Collection<int, Alumno>,
     *   sin_inscripcion: Collection<int, Matricula>,
     *   sin_carga: Collection<int, InscripcionPeriodo>,
     *   docs_observaciones: Collection<int, DocumentoAcademico>,
     *   docs_revision: Collection<int, DocumentoAcademico>,
     *   importaciones_error: Collection<int, ImportacionHistoricaMaterias>,
     *   trayectorias_listas: Collection<int, TrayectoriaAcademica>
     * }
     */
    private function cargarMuestrasOperativas(User $user): array
    {
        return [
            'sin_matricula' => $this->alumnosSinMatriculaActiva($user)->limit(3)->get(),
            'sin_inscripcion' => $this->matriculasSinInscripcionActiva($user)->limit(3)->get(),
            'sin_carga' => $this->inscripcionesSinCarga($user)->limit(3)->get(),
            'docs_observaciones' => $this->documentosConObservaciones($user)->limit(3)->get(),
            'docs_revision' => $this->solicitudesEnRevision($user)
                ->with(['alumno:id,nombre,primer_apellido,segundo_apellido,curp', 'matricula:id,matricula'])
                ->limit(3)
                ->get(),
            'importaciones_error' => $this->importacionesConErrores($user)
                ->with(['matricula.alumno:id,nombre,primer_apellido,segundo_apellido,curp'])
                ->limit(2)
                ->get(),
            'trayectorias_listas' => $this->trayectoriasListas($user)
                ->with(['matricula.alumno:id,nombre,primer_apellido,segundo_apellido,curp'])
                ->limit(2)
                ->get(),
        ];
    }

    /**
     * @param  array<string, Collection>  $muestras
     * @return list<array<string, mixed>>
     */
    private function armarPendientesPrioritarios(array $muestras): array
    {
        $pendientes = [];
        $push = static function (
            array &$items,
            string $alumno,
            string $curp,
            string $matricula,
            string $problema,
            string $prioridad,
            string $accion,
            ?int $alumnoId,
        ): void {
            if (count($items) >= 12) {
                return;
            }
            $items[] = [
                'alumno' => $alumno,
                'curp' => $curp,
                'matricula' => $matricula,
                'problema' => $problema,
                'prioridad' => $prioridad,
                'siguiente_accion' => $accion,
                'expediente_url' => $alumnoId ? '/app/expedientes?alumno='.$alumnoId : '/app/expedientes',
            ];
        };

        foreach ($muestras['sin_matricula'] as $alumno) {
            $push($pendientes, $this->nombreAlumno($alumno), (string) $alumno->curp, 'Sin matricula', 'Expediente incompleto: falta matricula activa', 'Alta', 'Solicitar matricula a Educacion Superior', (int) $alumno->id);
        }
        foreach ($muestras['sin_inscripcion'] as $matricula) {
            $push($pendientes, $this->nombreAlumno($matricula->alumno), (string) $matricula->alumno?->curp, (string) $matricula->matricula, 'Inscripcion pendiente', 'Alta', 'Registrar inscripcion de periodo', (int) $matricula->alumno_id);
        }
        foreach ($muestras['sin_carga'] as $inscripcion) {
            $push($pendientes, $this->nombreAlumno($inscripcion->matricula?->alumno), (string) $inscripcion->matricula?->alumno?->curp, (string) $inscripcion->matricula?->matricula, 'Carga academica pendiente', 'Media', 'Generar carga academica', (int) $inscripcion->matricula?->alumno_id);
        }
        foreach ($muestras['docs_observaciones'] as $doc) {
            $push($pendientes, $this->nombreAlumno($doc->alumno), (string) $doc->alumno?->curp, (string) $doc->matricula?->matricula, 'Documento con observaciones', 'Alta', 'Atender observacion', (int) $doc->alumno_id);
        }

        return $pendientes;
    }

    /**
     * @param  array<string, Collection>  $muestras
     * @param  list<array<string, mixed>>  $pendientes
     * @return list<array<string, mixed>>
     */
    private function armarProcesosRecientes(User $user, array $muestras, array $pendientes): array
    {
        $items = $this->procesosRecientesDesdeDocumentos($user, 25);

        if ($items !== []) {
            return $items;
        }

        $items = [];
        $push = function (
            string $alumno,
            string $matricula,
            string $tramite,
            string $estatus,
            ?int $alumnoId = null,
            ?int $documentoId = null,
            ?string $proceso = null,
            ?string $codigo = null,
            ?string $fecha = null,
        ) use (&$items): void {
            if (count($items) >= 25) {
                return;
            }
            $url = $documentoId
                ? '/app/documentos/'.$documentoId
                : ($alumnoId ? '/app/alumnos/'.$alumnoId.'/expediente' : '/app/control-escolar/expedientes');
            $items[] = [
                'alumno' => $alumno,
                'matricula' => $matricula,
                'codigo' => $codigo ?? $matricula,
                'proceso' => $proceso ?? '—',
                'tipo' => $tramite,
                'tramite' => $tramite,
                'estatus' => $estatus,
                'fecha' => $fecha,
                'expediente_url' => $url,
                'documento_id' => $documentoId,
                'alumno_id' => $alumnoId,
            ];
        };

        foreach ($muestras['docs_observaciones'] as $doc) {
            $push(
                $this->nombreAlumnoInstitucional($doc->alumno),
                (string) ($doc->matricula?->matricula ?? '—'),
                $this->etiquetaTipoDocumental((string) $doc->tipo_documento).' · observaciones pendientes',
                'Observado',
                (int) $doc->alumno_id,
                (int) $doc->id,
                $this->nombreProcesoInstitucional($doc),
                (string) ($doc->folio_interno ?? $doc->matricula?->matricula ?? '—'),
                $doc->updated_at?->toIso8601String(),
            );
        }

        foreach ($muestras['docs_revision'] as $doc) {
            $push(
                $this->nombreAlumnoInstitucional($doc->alumno),
                (string) ($doc->matricula?->matricula ?? '—'),
                'Solicitud documental',
                'En revisión',
                (int) $doc->alumno_id,
                (int) $doc->id,
                $this->nombreProcesoInstitucional($doc),
                (string) ($doc->folio_interno ?? $doc->matricula?->matricula ?? '—'),
                $doc->updated_at?->toIso8601String(),
            );
        }

        foreach ($muestras['sin_matricula']->take(2) as $alumno) {
            $push(
                $this->nombreAlumnoInstitucional($alumno),
                'Sin matrícula',
                'Expediente incompleto',
                'Pendiente',
                (int) $alumno->id,
            );
        }

        foreach ($muestras['sin_inscripcion']->take(2) as $matricula) {
            $push(
                $this->nombreAlumnoInstitucional($matricula->alumno),
                (string) $matricula->matricula,
                'Inscripción de periodo',
                'Pendiente',
                (int) $matricula->alumno_id,
            );
        }

        foreach ($muestras['sin_carga']->take(2) as $inscripcion) {
            $push(
                $this->nombreAlumnoInstitucional($inscripcion->matricula?->alumno),
                (string) ($inscripcion->matricula?->matricula ?? '—'),
                'Carga académica',
                'En proceso',
                (int) ($inscripcion->matricula?->alumno_id ?? 0) ?: null,
            );
        }

        foreach ($muestras['importaciones_error'] as $imp) {
            $push(
                $this->nombreAlumnoInstitucional($imp->matricula?->alumno),
                (string) ($imp->matricula?->matricula ?? '—'),
                'Importación histórica',
                'Error',
                (int) ($imp->matricula?->alumno_id ?? 0) ?: null,
            );
        }

        foreach ($muestras['trayectorias_listas'] as $tray) {
            $alumno = $tray->alumno ?? $tray->matricula?->alumno;
            $push(
                $this->nombreAlumnoInstitucional($alumno),
                (string) ($tray->matricula?->matricula ?? '—'),
                'Listo para certificar',
                'Completado',
                (int) ($alumno?->id ?? 0) ?: null,
            );
        }

        if ($items === []) {
            foreach ($pendientes as $p) {
                $push(
                    $this->nombreAlumnoInstitucionalDesdeTexto((string) $p['alumno']),
                    (string) $p['matricula'],
                    (string) $p['problema'],
                    (string) $p['prioridad'],
                    null,
                    null,
                    null,
                    (string) $p['matricula'],
                    null,
                );
            }
        }

        return $items;
    }

    protected function alumnosBaseQuery(User $user): Builder
    {
        $query = Alumno::query();

        if ($this->alcance->exentaRestriccionTerritorial($user)) {
            return $query;
        }

        $ids = $this->ofertasIds($user);
        if ($ids === []) {
            $query->whereRaw('1 = 0');

            return $query;
        }

        $query->whereHas('matriculas', fn (Builder $m) => $m->whereIn('oferta_academica_id', $ids));

        return $query;
    }

    protected function alumnosSinMatriculaActiva(User $user): Builder
    {
        return $this->alumnosBaseQuery($user)->whereDoesntHave('matriculas', function (Builder $q): void {
            $q->whereIn('estado', self::ESTADOS_MATRICULA_ACTIVA);
        });
    }

    protected function matriculasSinInscripcionActiva(User $user): Builder
    {
        $ids = $this->ofertasIds($user);

        return Matricula::query()
            ->with('alumno')
            ->whereIn('estado', self::ESTADOS_MATRICULA_ACTIVA)
            ->whereIn('oferta_academica_id', $ids)
            ->whereDoesntHave('inscripcionesPeriodo', function (Builder $q): void {
                $q->whereIn('estatus', self::ESTATUS_INSCRIPCION_ACTIVA);
            });
    }

    protected function inscripcionesSinCarga(User $user): Builder
    {
        $ids = $this->ofertasIds($user);

        return InscripcionPeriodo::query()
            ->with('matricula.alumno')
            ->whereIn('estatus', self::ESTATUS_INSCRIPCION_ACTIVA)
            ->whereDoesntHave('cargasAcademicas')
            ->whereHas('matricula', function (Builder $mat) use ($ids): void {
                $mat->whereIn('estado', self::ESTADOS_MATRICULA_ACTIVA)
                    ->whereIn('oferta_academica_id', $ids);
            });
    }

    protected function inscripcionesConCalificacionesPendientes(User $user): Builder
    {
        $ids = $this->ofertasIds($user);

        return InscripcionPeriodo::query()
            ->whereIn('estatus', self::ESTATUS_INSCRIPCION_ACTIVA)
            ->whereHas('cargasAcademicas')
            ->whereHas('matricula', function (Builder $mat) use ($ids): void {
                $mat->whereIn('estado', self::ESTADOS_MATRICULA_ACTIVA)
                    ->whereIn('oferta_academica_id', $ids);
            })
            ->where(function (Builder $q): void {
                $q->whereDoesntHave('cargasAcademicas.materiasCursadas')
                    ->orWhereHas('cargasAcademicas.materiasCursadas', function (Builder $m): void {
                        $m->whereNull('calificacion');
                    });
            });
    }

    protected function importacionesConErrores(User $user): Builder
    {
        return $this->importacionesBaseQuery($user)
            ->where(function (Builder $q): void {
                $q->where('estado', 'error')
                    ->orWhere('estado', 'rechazada')
                    ->orWhere('validacion_payload->tiene_bloqueos', true);
            });
    }

    protected function importacionesBaseQuery(User $user): Builder
    {
        $ids = $this->ofertasIds($user);

        return ImportacionHistoricaMaterias::query()
            ->with('matricula.alumno')
            ->whereHas('matricula', fn (Builder $mat) => $mat->whereIn('oferta_academica_id', $ids));
    }

    protected function trayectoriasListas(User $user): Builder
    {
        $ids = $this->ofertasIds($user);

        return TrayectoriaAcademica::query()
            ->whereIn('estado', ['consolidada', 'lista_certificacion'])
            ->whereHas('matricula', function (Builder $q) use ($ids): void {
                $q->whereIn('estado', self::ESTADOS_MATRICULA_ACTIVA)
                    ->whereIn('oferta_academica_id', $ids);
            });
    }

    protected function documentosConObservaciones(User $user): Builder
    {
        return $this->documentosBaseQuery($user)
            ->with(['alumno', 'matricula'])
            ->whereHas('observacionesPendientes');
    }

    protected function solicitudesEnRevision(User $user): Builder
    {
        return $this->documentosBaseQuery($user)->where('estado_workflow', 'en_revision');
    }

    protected function documentosBaseQuery(User $user): Builder
    {
        $query = DocumentoAcademico::query();
        $this->alcance->aplicarAlcanceDocumentosAcademicos($query, $user);

        return $query;
    }

    protected function nombreAlumno(?Alumno $alumno): string
    {
        if ($alumno === null) {
            return 'Alumno no disponible';
        }

        return trim(implode(' ', array_filter([$alumno->nombre, $alumno->primer_apellido, $alumno->segundo_apellido])));
    }

    /**
     * @return array{sede: ?string, ciclo_escolar: ?string, total_alumnos_alcance: int}
     */
    protected function contextoOperativo(User $user, int $totalAlumnos): array
    {
        $ciclo = CicloEscolar::query()
            ->where(function (Builder $q): void {
                $q->where('es_actual', true)->orWhere('activo', true);
            })
            ->orderByDesc('es_actual')
            ->orderByDesc('id')
            ->first();

        $nombresSedes = $user->sedes()->orderBy('nombre')->limit(3)->pluck('nombre');
        $sede = match (true) {
            $nombresSedes->count() === 0 => null,
            $nombresSedes->count() === 1 => (string) $nombresSedes->first(),
            default => $nombresSedes->count().' sedes en alcance',
        };

        return [
            'sede' => $sede,
            'ciclo_escolar' => $this->etiquetaCicloInstitucional($ciclo?->nombre),
            'total_alumnos_alcance' => $totalAlumnos,
        ];
    }

    /**
     * @param  array<string, int>|null  $conteosEstatus
     * @return array{tipo: string, total: int, segmentos: list<array{key: string, label: string, color: string, count: int, pct: float|int}>}
     */
    protected function alumnosDistribucion(User $user, ?array $conteosEstatus = null): array
    {
        if ($this->alumnosBaseQuery($user)
            ->where('metadata->origen', ResetDemoControlEscolarService::ORIGEN)
            ->exists()) {
            return $this->distribucionPorEscenarioDemo($user);
        }

        $conteos = $conteosEstatus ?? $this->conteosAlumnosPorEstatus($user);

        return $this->armarSegmentosDistribucion($conteos, 'estatus', self::ESTATUS_VISUAL);
    }

    /**
     * @return array{tipo: string, total: int, segmentos: list<array{key: string, label: string, color: string, count: int, pct: float|int}>}
     */
    protected function distribucionPorEscenarioDemo(User $user): array
    {
        $escenarioSql = $this->expresionEscenarioDemoSql();
        $origen = ResetDemoControlEscolarService::ORIGEN;

        $rows = $this->alumnosBaseQuery($user)
            ->where('metadata->origen', $origen)
            ->selectRaw("{$escenarioSql} as escenario, COUNT(*) as total")
            ->groupBy('escenario')
            ->pluck('total', 'escenario');

        $conteos = [];
        foreach ($rows as $escenario => $total) {
            $clave = $escenario !== null && $escenario !== '' ? (string) $escenario : 'sin_escenario';
            $conteos[$clave] = (int) $total;
        }

        return $this->armarSegmentosDistribucion($conteos, 'situacion_academica', self::ESCENARIO_DEMO_VISUAL);
    }

    private function expresionEscenarioDemoSql(): string
    {
        $driver = Alumno::query()->getConnection()->getDriverName();

        return match ($driver) {
            'sqlite' => "COALESCE(json_extract(metadata, '$.scenario'), 'sin_escenario')",
            'pgsql' => "COALESCE(metadata->>'scenario', 'sin_escenario')",
            default => "COALESCE(JSON_UNQUOTE(JSON_EXTRACT(metadata, '$.scenario')), 'sin_escenario')",
        };
    }

    /**
     * @param  array<string, int>  $conteos
     * @param  array<string, array{label: string, color: string}>  $catalogo
     * @return array{tipo: string, total: int, segmentos: list<array{key: string, label: string, color: string, count: int, pct: float|int}>}
     */
    protected function armarSegmentosDistribucion(array $conteos, string $tipo, array $catalogo): array
    {
        $total = array_sum($conteos);
        $segmentos = [];

        foreach ($conteos as $clave => $count) {
            $visual = $catalogo[$clave] ?? ['label' => ucfirst(str_replace('_', ' ', $clave)), 'color' => '#64748b'];
            $segmentos[] = [
                'key' => $clave,
                'label' => $visual['label'],
                'color' => $visual['color'],
                'count' => $count,
                'pct' => $total > 0 ? round(($count / $total) * 100, 1) : 0,
            ];
        }

        usort($segmentos, static fn (array $a, array $b): int => $b['count'] <=> $a['count']);

        return [
            'tipo' => $tipo,
            'total' => $total,
            'segmentos' => $segmentos,
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function procesosRecientesDesdeDocumentos(User $user, int $limit): array
    {
        $docs = $this->documentosBaseQuery($user)
            ->with([
                'alumno:id,nombre,primer_apellido,segundo_apellido,curp',
                'matricula:id,matricula,oferta_academica_id',
                'matricula.ofertaAcademica:id,nombre,institucion_id,sede_id',
                'matricula.ofertaAcademica.institucion:id,nombre',
                'matricula.ofertaAcademica.sede:id,nombre',
                'observacionesPendientes',
            ])
            ->where(function (Builder $q): void {
                $q->whereIn('estado_workflow', ['en_revision', 'observado', 'borrador', 'rechazado'])
                    ->orWhereHas('observacionesPendientes');
            })
            ->orderByDesc('updated_at')
            ->limit($limit)
            ->get();

        if ($docs->isEmpty()) {
            return [];
        }

        return $docs->map(function (DocumentoAcademico $doc): array {
            $estatus = $doc->observacionesPendientes->isNotEmpty()
                ? 'Observado'
                : match ((string) $doc->estado_workflow) {
                    'en_revision' => 'En revisión',
                    'rechazado' => 'Rechazado',
                    'borrador' => 'Borrador',
                    default => ucfirst(str_replace('_', ' ', (string) $doc->estado_workflow)),
                };

            $tipo = $this->etiquetaTipoDocumental((string) $doc->tipo_documento);
            if ($estatus === 'Observado') {
                $tipo .= ' · observaciones pendientes';
            }

            return [
                'alumno' => $this->nombreAlumnoInstitucional($doc->alumno),
                'matricula' => (string) ($doc->matricula?->matricula ?? '—'),
                'codigo' => (string) ($doc->folio_interno ?? $doc->matricula?->matricula ?? '—'),
                'proceso' => $this->nombreProcesoInstitucional($doc),
                'tipo' => $tipo,
                'tramite' => $tipo,
                'estatus' => $estatus,
                'fecha' => $doc->updated_at?->toIso8601String(),
                'expediente_url' => '/app/documentos/'.$doc->id,
                'documento_id' => (int) $doc->id,
                'alumno_id' => (int) $doc->alumno_id,
            ];
        })->values()->all();
    }

    protected function nombreAlumnoInstitucional(?Alumno $alumno): string
    {
        $nombre = $this->nombreAlumno($alumno);

        return $this->nombreAlumnoInstitucionalDesdeTexto($nombre);
    }

    protected function nombreAlumnoInstitucionalDesdeTexto(string $nombre): string
    {
        if (stripos($nombre, 'demosynthetic') !== false || stripos($nombre, 'demo synthetic') !== false) {
            return 'Alumno de prueba institucional';
        }

        if (preg_match('/\bdemo\b/i', $nombre) && preg_match('/\b(synthetic|sintetico|sintético)\b/i', $nombre)) {
            return 'Alumno de prueba institucional';
        }

        return $nombre;
    }

    protected function etiquetaTipoDocumental(string $tipo): string
    {
        return match ($tipo) {
            'certificado_terminacion' => 'Certificado · terminación',
            'certificado_parcial' => 'Certificado · parcial',
            'constancia_estudios' => 'Constancia de estudios',
            'kardex' => 'Kardex',
            'titulo' => 'Título profesional',
            default => $tipo !== '' ? ucfirst(str_replace('_', ' ', $tipo)) : 'Documento académico',
        };
    }

    protected function etiquetaCicloInstitucional(?string $nombre): ?string
    {
        if ($nombre === null || trim($nombre) === '') {
            return null;
        }

        $limpio = trim((string) preg_replace('/\bdemo\b/i', '', $nombre));
        $limpio = trim((string) preg_replace('/\s{2,}/', ' ', $limpio));

        return $limpio !== '' ? $limpio : 'Ciclo escolar vigente';
    }

    protected function nombreProcesoInstitucional(DocumentoAcademico $doc): string
    {
        $oferta = $doc->matricula?->ofertaAcademica;
        $sede = $oferta?->sede?->nombre;
        $inst = $oferta?->institucion?->nombre;

        if ($sede !== null && $sede !== '') {
            return (string) $sede;
        }

        if ($inst !== null && $inst !== '') {
            return (string) $inst;
        }

        if ($oferta?->nombre) {
            return (string) $oferta->nombre;
        }

        return 'Proceso escolar';
    }
}
