<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Catalogos;

use App\Http\Controllers\Controller;
use App\Models\CicloEscolar;
use App\Models\EntidadFederativa;
use App\Models\Institucion;
use App\Models\Materia;
use App\Models\Municipio;
use App\Models\NivelAcademico;
use App\Models\OfertaAcademica;
use App\Models\PlanEstudio;
use App\Models\PlanMateria;
use App\Models\PeriodoEscolar;
use App\Models\ProgramaEstudio;
use App\Models\Region;
use App\Models\Sede;
use App\Models\Subsistema;
use App\Services\Certificacion\CertificacionAlcanceService;
use App\Support\Catalogos\CatalogoAcademicoPresenter;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CatalogosAcademicosController extends Controller
{
    public function __construct(
        protected CertificacionAlcanceService $alcance,
    ) {}

    public function resumen(Request $request): JsonResponse
    {
        $user = $request->user();
        $tecnico = $this->modoTecnico($user);

        $conteo = function (string $modelClass, ?callable $scope = null) use ($user): array {
            /** @var Builder $q */
            $q = $modelClass::query();
            if ($scope !== null) {
                $scope($q);
            }

            $total = (clone $q)->count();
            $activos = (clone $q)->where('activo', true)->count();
            $importados = (clone $q)->where(function (Builder $w): void {
                $w->where('metadata->origin', CatalogoAcademicoPresenter::ORIGEN_SISEES)
                    ->orWhere('metadata->origen', CatalogoAcademicoPresenter::ORIGEN_SISEES);
            })->count();

            return [
                'total' => $total,
                'activos' => $activos,
                'inactivos' => max(0, $total - $activos),
                'importados_sisees' => $importados,
            ];
        };

        $conteoMaterias = function () use ($user): array {
            $q = Materia::query();
            $this->aplicarAlcanceMaterias($q, $user);
            $total = (clone $q)->count();
            $importados = (clone $q)->where(function (Builder $w): void {
                $w->where('metadata->origin', CatalogoAcademicoPresenter::ORIGEN_SISEES)
                    ->orWhere('metadata->origen', CatalogoAcademicoPresenter::ORIGEN_SISEES);
            })->count();

            return [
                'total' => $total,
                'activos' => $total,
                'inactivos' => 0,
                'importados_sisees' => $importados,
            ];
        };

        $conteoPlanMaterias = function () use ($user): array {
            $q = PlanMateria::query();
            $this->aplicarAlcancePlanMaterias($q, $user);
            $total = (clone $q)->count();
            $importados = (clone $q)->where(function (Builder $w): void {
                $w->where('metadata->origin', CatalogoAcademicoPresenter::ORIGEN_SISEES)
                    ->orWhere('metadata->origen', CatalogoAcademicoPresenter::ORIGEN_SISEES);
            })->count();

            return [
                'total' => $total,
                'activos' => $total,
                'inactivos' => 0,
                'importados_sisees' => $importados,
            ];
        };

        return response()->json([
            'data' => CatalogoAcademicoPresenter::sanitizarResumen([
                'instituciones' => $conteo(Institucion::class, fn (Builder $q) => $this->alcance->aplicarAlcanceInstituciones($q, $user)),
                'sedes' => $conteo(Sede::class, fn (Builder $q) => $this->alcance->aplicarAlcanceSedes($q, $user)),
                'niveles_academicos' => [
                    'total' => NivelAcademico::query()->count(),
                    'activos' => NivelAcademico::query()->where('activo', true)->count(),
                    'inactivos' => NivelAcademico::query()->where('activo', false)->count(),
                    'importados_sisees' => NivelAcademico::query()->where(function (Builder $w): void {
                        $w->where('metadata->origin', CatalogoAcademicoPresenter::ORIGEN_SISEES)
                            ->orWhere('metadata->origen', CatalogoAcademicoPresenter::ORIGEN_SISEES);
                    })->count(),
                ],
                'programas_estudio' => $conteo(ProgramaEstudio::class, fn (Builder $q) => $this->aplicarAlcanceProgramas($q, $user)),
                'planes_estudio' => $conteo(PlanEstudio::class, fn (Builder $q) => $this->aplicarAlcancePlanes($q, $user)),
                'materias' => $conteoMaterias(),
                'plan_materias' => $conteoPlanMaterias(),
                'ofertas_academicas' => $conteo(OfertaAcademica::class, fn (Builder $q) => $this->alcance->aplicarAlcanceOfertasAcademicas($q, $user)),
                'ciclos_escolares' => $conteo(CicloEscolar::class),
                'periodos_escolares' => [
                    'total' => PeriodoEscolar::query()->count(),
                    'activos' => PeriodoEscolar::query()->where('activo', true)->count(),
                    'inactivos' => PeriodoEscolar::query()->where('activo', false)->count(),
                ],
            ], $tecnico),
            'modo_tecnico' => $tecnico,
            'generado_en' => now()->toIso8601String(),
        ]);
    }

    public function instituciones(Request $request): JsonResponse
    {
        $user = $request->user();
        $tecnico = $this->modoTecnico($user);

        $q = Institucion::query()
            ->with(['subsistema:id,clave,nombre', 'region:id,clave,nombre']);
        $this->alcance->aplicarAlcanceInstituciones($q, $user);
        $this->aplicarFiltrosActivos($q, $request);
        $this->aplicarFiltroImportadoSisees($q, $request);
        if ($request->filled('subsistema_id')) {
            $q->where('subsistema_id', $request->integer('subsistema_id'));
        }
        if ($request->filled('region_id')) {
            $q->where('region_id', $request->integer('region_id'));
        }
        if ($request->filled('search')) {
            $term = '%'.trim((string) $request->input('search')).'%';
            $q->where(function (Builder $w) use ($term): void {
                $w->where('nombre', 'like', $term)->orWhere('clave', 'like', $term);
            });
        }

        $paginator = $q->orderBy('nombre')->paginate($this->perPage($request));

        $payload = CatalogoAcademicoPresenter::respuestaPaginada(
            $paginator,
            fn (Institucion $i) => CatalogoAcademicoPresenter::enriquecer([
                'id' => $i->id,
                'clave' => $i->clave,
                'nombre' => $i->nombre,
                'nombre_corto' => $i->nombre_corto,
                'subsistema' => $i->subsistema?->nombre ?? $i->subsistema?->clave,
                'subsistema_id' => $i->subsistema_id,
                'region' => CatalogoAcademicoPresenter::normalizarRegion(
                    $i->region?->nombre,
                    $i->region?->clave,
                ) ?? '—',
                'region_id' => $i->region_id,
                'activo' => (bool) $i->activo,
                'estatus' => CatalogoAcademicoPresenter::estatusLabel((bool) $i->activo),
            ], $i->metadata, $tecnico),
        );

        return response()->json($payload);
    }

    public function sedes(Request $request): JsonResponse
    {
        $user = $request->user();
        $tecnico = $this->modoTecnico($user);

        $q = Sede::query()->with(['institucion.subsistema:id,clave,nombre']);
        $this->alcance->aplicarAlcanceSedes($q, $user);
        $this->aplicarFiltrosActivos($q, $request);
        $this->aplicarFiltroImportadoSisees($q, $request);
        if ($request->filled('institucion_id')) {
            $q->where('institucion_id', $request->integer('institucion_id'));
        }
        if ($request->filled('subsistema_id')) {
            $subsistemaId = $request->integer('subsistema_id');
            $q->whereHas('institucion', fn (Builder $w) => $w->where('subsistema_id', $subsistemaId));
        }
        if ($request->filled('municipio')) {
            $mun = trim((string) $request->input('municipio'));
            $q->where(function (Builder $w) use ($mun): void {
                $w->whereRaw('LOWER(COALESCE(CAST(metadata AS CHAR), \'\')) LIKE ?', ['%'.strtolower($mun).'%'])
                    ->orWhere('domicilio', 'like', '%'.$mun.'%');
            });
        }
        if ($request->filled('search')) {
            $term = '%'.trim((string) $request->input('search')).'%';
            $q->where(function (Builder $w) use ($term): void {
                $w->where('nombre', 'like', $term)
                    ->orWhere('clave', 'like', $term)
                    ->orWhere('cct', 'like', $term);
            });
        }

        $paginator = $q->orderBy('nombre')->paginate($this->perPage($request));

        $payload = CatalogoAcademicoPresenter::respuestaPaginada(
            $paginator,
            fn (Sede $s) => CatalogoAcademicoPresenter::enriquecer([
                'id' => $s->id,
                'clave' => $s->clave,
                'nombre' => $s->nombre,
                'cct' => $s->cct,
                'institucion_id' => $s->institucion_id,
                'institucion' => $s->institucion?->nombre,
                'subsistema' => $s->institucion?->subsistema?->nombre ?? $s->institucion?->subsistema?->clave,
                'municipio' => data_get($s->metadata, 'posible_municipio_detectado'),
                'activo' => (bool) $s->activo,
                'estatus' => CatalogoAcademicoPresenter::estatusLabel((bool) $s->activo),
            ], $s->metadata, $tecnico),
        );

        return response()->json($payload);
    }

    public function programas(Request $request): JsonResponse
    {
        $user = $request->user();
        $tecnico = $this->modoTecnico($user);

        $q = ProgramaEstudio::query()
            ->with(['nivelAcademico:id,clave,nombre', 'subsistema:id,clave,nombre'])
            ->withCount(['planesEstudio as planes_total', 'planesEstudio as planes_activos' => fn (Builder $pq) => $pq->where('activo', true)]);
        $this->aplicarAlcanceProgramas($q, $user);
        $this->aplicarFiltrosActivos($q, $request);
        $this->aplicarFiltroImportadoSisees($q, $request);
        if ($request->filled('subsistema_id')) {
            $q->where('subsistema_id', $request->integer('subsistema_id'));
        }
        if ($request->filled('search')) {
            $term = '%'.trim((string) $request->input('search')).'%';
            $q->where(function (Builder $w) use ($term): void {
                $w->where('nombre', 'like', $term)->orWhere('clave', 'like', $term);
            });
        }

        $paginator = $q->orderBy('nombre')->paginate($this->perPage($request));

        $payload = CatalogoAcademicoPresenter::respuestaPaginada(
            $paginator,
            fn (ProgramaEstudio $p) => CatalogoAcademicoPresenter::enriquecer([
                'id' => $p->id,
                'clave' => $p->clave,
                'nombre' => $p->nombre,
                'nivel' => $p->nivelAcademico?->nombre ?? '—',
                'subsistema' => $p->subsistema?->nombre ?? $p->subsistema?->clave,
                'subsistema_id' => $p->subsistema_id,
                'planes_activos' => (int) ($p->planes_activos ?? 0),
                'planes_total' => (int) ($p->planes_total ?? 0),
                'activo' => (bool) $p->activo,
                'estatus' => CatalogoAcademicoPresenter::estatusLabel((bool) $p->activo),
            ], $p->metadata, $tecnico),
        );

        return response()->json($payload);
    }

    public function planes(Request $request): JsonResponse
    {
        $user = $request->user();
        $tecnico = $this->modoTecnico($user);

        $q = PlanEstudio::query()
            ->with(['programaEstudio:id,clave,nombre,subsistema_id', 'programaEstudio.subsistema:id,clave,nombre'])
            ->withCount('planMaterias as materias_count');
        $this->aplicarAlcancePlanes($q, $user);
        $this->aplicarFiltrosActivos($q, $request);
        $this->aplicarFiltroImportadoSisees($q, $request);
        if ($request->filled('programa_estudio_id')) {
            $q->where('programa_estudio_id', $request->integer('programa_estudio_id'));
        }
        if ($request->filled('subsistema_id')) {
            $q->where('subsistema_id', $request->integer('subsistema_id'));
        }
        if ($request->filled('search')) {
            $term = '%'.trim((string) $request->input('search')).'%';
            $q->where(function (Builder $w) use ($term): void {
                $w->where('nombre', 'like', $term)
                    ->orWhere('clave', 'like', $term)
                    ->orWhereHas('programaEstudio', fn (Builder $p) => $p->where('nombre', 'like', $term));
            });
        }

        $paginator = $q->orderBy('nombre')->paginate($this->perPage($request));

        $payload = CatalogoAcademicoPresenter::respuestaPaginada(
            $paginator,
            fn (PlanEstudio $p) => CatalogoAcademicoPresenter::enriquecer([
                'id' => $p->id,
                'clave' => $p->clave,
                'nombre' => $p->nombre,
                'programa_estudio_id' => $p->programa_estudio_id,
                'programa' => $p->programaEstudio?->nombre,
                'programa_clave' => $p->programaEstudio?->clave,
                'subsistema' => $p->programaEstudio?->subsistema?->nombre ?? $p->programaEstudio?->subsistema?->clave,
                'anio_aprobacion' => $p->anio_aprobacion,
                'materias_count' => (int) ($p->materias_count ?? 0),
                'activo' => (bool) $p->activo,
                'estatus' => $p->activo ? 'vigente' : 'inactivo',
            ], $p->metadata, $tecnico),
        );

        return response()->json($payload);
    }

    public function materias(Request $request): JsonResponse
    {
        $user = $request->user();
        $tecnico = $this->modoTecnico($user);

        $q = Materia::query()->with(['planEstudio:id,clave,nombre,programa_estudio_id', 'planEstudio.programaEstudio:id,clave,nombre']);
        $this->aplicarAlcanceMaterias($q, $user);
        $this->aplicarFiltroImportadoSisees($q, $request);
        if ($request->filled('plan_estudio_id')) {
            $q->where('plan_estudio_id', $request->integer('plan_estudio_id'));
        }
        if ($request->filled('programa_estudio_id')) {
            $programaId = $request->integer('programa_estudio_id');
            $q->whereHas('planEstudio', fn (Builder $w) => $w->where('programa_estudio_id', $programaId));
        }
        if ($request->filled('search')) {
            $term = '%'.trim((string) $request->input('search')).'%';
            $q->where(function (Builder $w) use ($term): void {
                $w->where('nombre', 'like', $term)->orWhere('clave', 'like', $term);
            });
        }

        $paginator = $q->orderBy('nombre')->paginate($this->perPage($request));

        $payload = CatalogoAcademicoPresenter::respuestaPaginada(
            $paginator,
            fn (Materia $m) => CatalogoAcademicoPresenter::enriquecer([
                'id' => $m->id,
                'clave' => $m->clave,
                'nombre' => $m->nombre,
                'creditos' => $m->creditos,
                'semestre' => $m->semestre,
                'tipo' => $m->tipo,
                'estatus' => $m->estatus ?? 'activo',
                'plan_estudio_id' => $m->plan_estudio_id,
                'plan' => $m->planEstudio?->nombre,
                'programa' => $m->planEstudio?->programaEstudio?->nombre,
                'activo' => ($m->estatus ?? 'activo') !== 'inactivo',
            ], $m->metadata, $tecnico),
        );

        return response()->json($payload);
    }

    public function ofertasAcademicas(Request $request): JsonResponse
    {
        $user = $request->user();
        $tecnico = $this->modoTecnico($user);

        $q = OfertaAcademica::query()
            ->with([
                'institucion:id,nombre,clave,subsistema_id',
                'institucion.subsistema:id,clave,nombre',
                'sede:id,nombre,clave',
                'programaEstudio:id,clave,nombre',
                'planEstudio:id,clave,nombre',
            ]);
        $this->alcance->aplicarAlcanceOfertasAcademicas($q, $user);
        $this->aplicarFiltrosActivos($q, $request);
        $this->aplicarFiltroImportadoSisees($q, $request);
        if ($request->filled('institucion_id')) {
            $q->where('institucion_id', $request->integer('institucion_id'));
        }
        if ($request->filled('programa_estudio_id')) {
            $q->where('programa_estudio_id', $request->integer('programa_estudio_id'));
        }
        if ($request->filled('plan_estudio_id')) {
            $q->where('plan_estudio_id', $request->integer('plan_estudio_id'));
        }
        if ($request->filled('sede_id')) {
            $q->where('sede_id', $request->integer('sede_id'));
        }
        if ($request->filled('search')) {
            $term = '%'.trim((string) $request->input('search')).'%';
            $q->where(function (Builder $w) use ($term): void {
                $w->where('clave', 'like', $term)
                    ->orWhere('modalidad', 'like', $term)
                    ->orWhereHas('institucion', fn (Builder $i) => $i->where('nombre', 'like', $term))
                    ->orWhereHas('programaEstudio', fn (Builder $p) => $p->where('nombre', 'like', $term));
            });
        }

        $paginator = $q->orderBy('clave')->paginate($this->perPage($request));

        $payload = CatalogoAcademicoPresenter::respuestaPaginada(
            $paginator,
            fn (OfertaAcademica $o) => CatalogoAcademicoPresenter::enriquecer([
                'id' => $o->id,
                'clave' => $o->clave,
                'modalidad' => $o->modalidad,
                'institucion_id' => $o->institucion_id,
                'institucion' => $o->institucion?->nombre,
                'sede_id' => $o->sede_id,
                'sede' => $o->sede?->nombre,
                'subsistema' => $o->institucion?->subsistema?->nombre ?? $o->institucion?->subsistema?->clave,
                'programa_estudio_id' => $o->programa_estudio_id,
                'programa' => $o->programaEstudio?->nombre,
                'plan_estudio_id' => $o->plan_estudio_id,
                'plan' => $o->planEstudio?->nombre ?? '—',
                'activo' => (bool) $o->activo,
                'estatus' => CatalogoAcademicoPresenter::estatusLabel((bool) $o->activo),
            ], $o->metadata, $tecnico),
        );

        return response()->json($payload);
    }

    public function planMaterias(Request $request, int $plan): JsonResponse
    {
        $user = $request->user();
        $tecnico = $this->modoTecnico($user);

        $planModel = PlanEstudio::query()
            ->with(['programaEstudio:id,clave,nombre'])
            ->findOrFail($plan);

        $q = PlanMateria::query()
            ->with(['materia:id,clave,nombre'])
            ->where('plan_estudio_id', $planModel->id);
        $this->aplicarFiltroImportadoSisees($q, $request);
        if ($request->filled('search')) {
            $term = '%'.trim((string) $request->input('search')).'%';
            $q->where(function (Builder $w) use ($term): void {
                $w->where('nombre_materia', 'like', $term)
                    ->orWhere('clave_materia', 'like', $term);
            });
        }

        $paginator = $q
            ->orderBy('numero_periodo_curricular')
            ->orderBy('orden')
            ->orderBy('nombre_materia')
            ->paginate($this->perPage($request));

        $payload = CatalogoAcademicoPresenter::respuestaPaginada(
            $paginator,
            fn (PlanMateria $pm) => CatalogoAcademicoPresenter::enriquecer([
                'id' => $pm->id,
                'plan_estudio_id' => $pm->plan_estudio_id,
                'materia_id' => $pm->materia_id,
                'clave_materia' => $pm->clave_materia,
                'nombre_materia' => $pm->nombre_materia,
                'periodo' => $pm->etiqueta_periodo_curricular
                    ?? trim(($pm->tipo_periodo_curricular ?? '').' '.($pm->numero_periodo_curricular ?? '')),
                'semestre' => $pm->semestre,
                'creditos' => $pm->creditos,
                'obligatoria' => (bool) $pm->obligatoria,
                'orden' => $pm->orden,
                'estatus' => $pm->estatus ?? 'activo',
            ], $pm->metadata, $tecnico),
        );

        $payload['plan'] = CatalogoAcademicoPresenter::enriquecerPlanResumen([
            'id' => $planModel->id,
            'clave' => $planModel->clave,
            'nombre' => $planModel->nombre,
            'programa' => $planModel->programaEstudio?->nombre,
        ], $planModel->metadata, $tecnico);

        return response()->json($payload);
    }

    public function subsistemas(Request $request): JsonResponse
    {
        $user = $request->user();
        $tecnico = $this->modoTecnico($user);

        $q = Subsistema::query();
        $this->aplicarFiltrosActivos($q, $request);
        if ($request->filled('search')) {
            $term = '%'.trim((string) $request->input('search')).'%';
            $q->where(function (Builder $w) use ($term): void {
                $w->where('nombre', 'like', $term)->orWhere('clave', 'like', $term);
            });
        }

        $paginator = $q
            ->withCount(['instituciones' => function (Builder $iq) use ($user): void {
                $this->alcance->aplicarAlcanceInstituciones($iq, $user);
            }])
            ->orderBy('nombre')
            ->paginate($this->perPage($request));

        $payload = CatalogoAcademicoPresenter::respuestaPaginada(
            $paginator,
            fn (Subsistema $s) => CatalogoAcademicoPresenter::enriquecer([
                'id' => $s->id,
                'clave' => $s->clave,
                'nombre' => $s->nombre,
                'nombre_corto' => $s->nombre_corto,
                'instituciones_count' => (int) ($s->instituciones_count ?? 0),
                'activo' => (bool) $s->activo,
                'estatus' => CatalogoAcademicoPresenter::estatusLabel((bool) $s->activo),
            ], $s->metadata, $tecnico),
        );

        return response()->json($payload);
    }

    public function municipios(Request $request): JsonResponse
    {
        $user = $request->user();
        $tecnico = $this->modoTecnico($user);

        $q = Municipio::query()->with(['entidadFederativa:id,nombre,abreviatura,clave_entidad']);

        if ($request->filled('entidad_federativa_id')) {
            $q->where('entidad_federativa_id', $request->integer('entidad_federativa_id'));
        }
        if ($request->filled('activo') || $request->filled('estatus')) {
            $estatus = $request->filled('estatus')
                ? (string) $request->input('estatus')
                : ($request->boolean('activo') ? 'activo' : 'inactivo');
            $q->where('estatus', $estatus);
        }
        if ($request->filled('search')) {
            $term = '%'.trim((string) $request->input('search')).'%';
            $q->where(function (Builder $w) use ($term): void {
                $w->where('nombre', 'like', $term)
                    ->orWhere('nombre_oficial', 'like', $term)
                    ->orWhere('clave_municipio', 'like', $term);
            });
        }

        $paginator = $q->orderBy('nombre')->paginate($this->perPage($request));

        $payload = CatalogoAcademicoPresenter::respuestaPaginada(
            $paginator,
            function (Municipio $m) use ($user, $tecnico): array {
                $nombreMun = $m->nombre !== '' ? $m->nombre : ($m->nombre_oficial ?? '');
                $sedesCount = Sede::query()
                    ->where(function (Builder $w) use ($nombreMun): void {
                        $w->whereRaw('LOWER(COALESCE(CAST(metadata AS CHAR), \'\')) LIKE ?', ['%'.strtolower($nombreMun).'%']);
                    });
                $this->alcance->aplicarAlcanceSedes($sedesCount, $user);

                return CatalogoAcademicoPresenter::enriquecer([
                    'id' => $m->id,
                    'clave' => $m->clave_municipio,
                    'nombre' => $nombreMun,
                    'entidad' => $m->entidadFederativa?->nombre ?? '—',
                    'entidad_abreviatura' => $m->entidadFederativa?->abreviatura,
                    'entidad_federativa_id' => $m->entidad_federativa_id,
                    'sedes_relacionadas' => $sedesCount->count(),
                    'estatus' => $m->estatus ?? 'activo',
                ], $m->metadata, $tecnico);
            },
        );

        return response()->json($payload);
    }

    public function institucionDetalle(Request $request, int $institucion): JsonResponse
    {
        $user = $request->user();
        $tecnico = $this->modoTecnico($user);

        $q = Institucion::query()
            ->with(['subsistema:id,clave,nombre', 'region:id,clave,nombre'])
            ->whereKey($institucion);
        $this->alcance->aplicarAlcanceInstituciones($q, $user);
        $model = $q->firstOrFail();

        $sedesCount = Sede::query()->where('institucion_id', $model->id);
        $this->alcance->aplicarAlcanceSedes($sedesCount, $user);

        $ofertasCount = OfertaAcademica::query()->where('institucion_id', $model->id);
        $this->alcance->aplicarAlcanceOfertasAcademicas($ofertasCount, $user);

        $programasCount = (clone $ofertasCount)->distinct('programa_estudio_id')->count('programa_estudio_id');

        $data = CatalogoAcademicoPresenter::enriquecer([
            'id' => $model->id,
            'clave' => $model->clave,
            'nombre' => $model->nombre,
            'nombre_corto' => $model->nombre_corto,
            'subsistema' => $model->subsistema?->nombre ?? $model->subsistema?->clave,
            'subsistema_id' => $model->subsistema_id,
            'region' => CatalogoAcademicoPresenter::normalizarRegion(
                $model->region?->nombre,
                $model->region?->clave,
            ) ?? '—',
            'region_id' => $model->region_id,
            'email_contacto' => $model->email_contacto,
            'telefono_contacto' => $model->telefono_contacto,
            'activo' => (bool) $model->activo,
            'estatus' => CatalogoAcademicoPresenter::estatusLabel((bool) $model->activo),
            'sedes_count' => $sedesCount->count(),
            'ofertas_count' => $ofertasCount->count(),
            'programas_count' => $programasCount,
        ], $model->metadata, $tecnico);

        return response()->json(['data' => $data]);
    }

    public function institucionSedes(Request $request, int $institucion): JsonResponse
    {
        $request->merge(['institucion_id' => $institucion]);

        return $this->sedes($request);
    }

    public function institucionOfertas(Request $request, int $institucion): JsonResponse
    {
        $request->merge(['institucion_id' => $institucion]);

        return $this->ofertasAcademicas($request);
    }

    public function sedeOfertas(Request $request, int $sede): JsonResponse
    {
        $user = $request->user();
        $tecnico = $this->modoTecnico($user);

        $sedeModel = Sede::query()->whereKey($sede);
        $this->alcance->aplicarAlcanceSedes($sedeModel, $user);
        $sedeModel = $sedeModel->firstOrFail();

        $request->merge(['institucion_id' => $sedeModel->institucion_id]);

        $q = OfertaAcademica::query()
            ->with([
                'institucion:id,nombre,clave',
                'sede:id,nombre,clave',
                'programaEstudio:id,clave,nombre',
                'planEstudio:id,clave,nombre',
            ])
            ->where('sede_id', $sedeModel->id);
        $this->alcance->aplicarAlcanceOfertasAcademicas($q, $user);
        $this->aplicarFiltrosActivos($q, $request);

        $paginator = $q->orderBy('clave')->paginate($this->perPage($request));

        $payload = CatalogoAcademicoPresenter::respuestaPaginada(
            $paginator,
            fn (OfertaAcademica $o) => CatalogoAcademicoPresenter::enriquecer([
                'id' => $o->id,
                'clave' => $o->clave,
                'modalidad' => $o->modalidad,
                'institucion' => $o->institucion?->nombre,
                'sede' => $o->sede?->nombre,
                'programa' => $o->programaEstudio?->nombre,
                'plan' => $o->planEstudio?->nombre ?? '—',
                'activo' => (bool) $o->activo,
                'estatus' => CatalogoAcademicoPresenter::estatusLabel((bool) $o->activo),
            ], $o->metadata, $tecnico),
        );

        $payload['sede'] = CatalogoAcademicoPresenter::enriquecer([
            'id' => $sedeModel->id,
            'clave' => $sedeModel->clave,
            'nombre' => $sedeModel->nombre,
            'cct' => $sedeModel->cct,
            'institucion_id' => $sedeModel->institucion_id,
        ], $sedeModel->metadata, $tecnico);

        return response()->json($payload);
    }

    public function filtros(Request $request): JsonResponse
    {
        $user = $request->user();

        $instQ = Institucion::query()->where('activo', true)->orderBy('nombre');
        $this->alcance->aplicarAlcanceInstituciones($instQ, $user);
        $instituciones = $instQ->get(['id', 'clave', 'nombre', 'subsistema_id']);

        $progQ = ProgramaEstudio::query()->where('activo', true)->orderBy('nombre');
        $this->aplicarAlcanceProgramas($progQ, $user);
        $programas = $progQ->get(['id', 'clave', 'nombre', 'subsistema_id']);

        $planQ = PlanEstudio::query()->where('activo', true)->orderBy('nombre');
        $this->aplicarAlcancePlanes($planQ, $user);
        if ($request->filled('programa_estudio_id')) {
            $planQ->where('programa_estudio_id', $request->integer('programa_estudio_id'));
        }
        $planes = $planQ->get(['id', 'clave', 'nombre', 'programa_estudio_id']);

        $regionQ = Region::query()->where('activo', true)->orderBy('nombre');
        $this->alcance->aplicarAlcanceRegiones($regionQ, $user);
        $regiones = $regionQ->get(['id', 'clave', 'nombre', 'subsistema_id']);

        $entidades = EntidadFederativa::query()
            ->where('estatus', 'activo')
            ->orderBy('nombre')
            ->get(['id', 'nombre', 'abreviatura', 'clave_entidad']);

        $subsistemasLista = Subsistema::query()
            ->where('activo', true)
            ->orderBy('nombre')
            ->get(['id', 'clave', 'nombre']);

        return response()->json([
            'data' => [
                'subsistemas' => $subsistemasLista,
                'instituciones' => $instituciones,
                'programas' => $programas,
                'planes' => $planes,
                'regiones' => $regiones->map(fn (Region $r) => [
                    'id' => $r->id,
                    'clave' => $r->clave,
                    'nombre' => CatalogoAcademicoPresenter::limpiarTextoInstitucional($r->nombre),
                    'subsistema_id' => $r->subsistema_id,
                ])->values(),
                'entidades_federativas' => $entidades,
            ],
        ]);
    }

    private function perPage(Request $request): int
    {
        return min(100, max(10, $request->integer('per_page', 25)));
    }

    private function modoTecnico(?\App\Models\User $user): bool
    {
        if ($user === null) {
            return false;
        }

        return $user->hasRole(['superadmin', 'admin', 'sistemas'])
            || $user->can('ver_claves_legacy_catalogos')
            || $user->can('catalogos.configurar');
    }

    private function aplicarFiltrosActivos(Builder $q, Request $request): void
    {
        if ($request->has('activo') && $request->input('activo') !== '' && $request->input('activo') !== null) {
            $q->where('activo', $request->boolean('activo'));
        }
    }

    private function aplicarFiltroImportadoSisees(Builder $q, Request $request): void
    {
        if (! $request->boolean('importado_sisees')) {
            return;
        }

        $q->where(function (Builder $w): void {
            $w->where('metadata->origin', CatalogoAcademicoPresenter::ORIGEN_SISEES)
                ->orWhere('metadata->origen', CatalogoAcademicoPresenter::ORIGEN_SISEES);
        });
    }

    private function aplicarAlcanceProgramas(Builder $q, \App\Models\User $user): void
    {
        if ($this->alcance->exentaRestriccionTerritorial($user) || $this->alcance->alcanceTerritorialEstaVacio($user)) {
            return;
        }

        $q->whereHas('ofertasAcademicas', function (Builder $o) use ($user): void {
            $this->alcance->aplicarAlcanceOfertasAcademicas($o, $user);
        });
    }

    private function aplicarAlcancePlanes(Builder $q, \App\Models\User $user): void
    {
        if ($this->alcance->exentaRestriccionTerritorial($user) || $this->alcance->alcanceTerritorialEstaVacio($user)) {
            return;
        }

        $q->whereHas('ofertasAcademicas', function (Builder $o) use ($user): void {
            $this->alcance->aplicarAlcanceOfertasAcademicas($o, $user);
        });
    }

    private function aplicarAlcanceMaterias(Builder $q, \App\Models\User $user): void
    {
        if ($this->alcance->exentaRestriccionTerritorial($user) || $this->alcance->alcanceTerritorialEstaVacio($user)) {
            return;
        }

        $q->whereHas('planEstudio.ofertasAcademicas', function (Builder $o) use ($user): void {
            $this->alcance->aplicarAlcanceOfertasAcademicas($o, $user);
        });
    }

    private function aplicarAlcancePlanMaterias(Builder $q, \App\Models\User $user): void
    {
        if ($this->alcance->exentaRestriccionTerritorial($user) || $this->alcance->alcanceTerritorialEstaVacio($user)) {
            return;
        }

        $q->whereHas('planEstudio.ofertasAcademicas', function (Builder $o) use ($user): void {
            $this->alcance->aplicarAlcanceOfertasAcademicas($o, $user);
        });
    }
}
