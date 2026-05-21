<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Certificacion;

use App\Http\Controllers\Controller;
use App\Models\CicloEscolar;
use App\Models\Institucion;
use App\Models\OfertaAcademica;
use App\Models\PlanEstudio;
use App\Models\ProgramaEstudio;
use App\Models\Region;
use App\Models\Sede;
use App\Models\Subsistema;
use App\Services\Certificacion\CertificacionAlcanceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CatalogoCapturaController extends Controller
{
    public function __construct(
        protected CertificacionAlcanceService $alcance,
    ) {}

    public function ciclosEscolares(): JsonResponse
    {
        $filas = CicloEscolar::query()
            ->where('activo', true)
            ->orderByDesc('fecha_inicio')
            ->get(['id', 'clave', 'nombre', 'fecha_inicio', 'fecha_fin', 'es_actual']);

        return response()->json(['data' => $filas]);
    }

    public function subsistemas(): JsonResponse
    {
        $filas = Subsistema::query()
            ->where('activo', true)
            ->orderBy('nombre')
            ->get(['id', 'clave', 'nombre', 'nombre_corto']);

        return response()->json(['data' => $filas]);
    }

    public function regiones(Request $request): JsonResponse
    {
        $q = Region::query()->where('activo', true);
        if ($request->filled('subsistema_id')) {
            $q->where(function ($w) use ($request) {
                $w->whereNull('subsistema_id')
                    ->orWhere('subsistema_id', $request->integer('subsistema_id'));
            });
        }
        $this->alcance->aplicarAlcanceRegiones($q, $request->user());

        $filas = $q->orderBy('nombre')->get(['id', 'subsistema_id', 'clave', 'nombre']);

        return response()->json(['data' => $filas]);
    }

    public function instituciones(Request $request): JsonResponse
    {
        $q = Institucion::query()->where('activo', true);
        if ($request->filled('subsistema_id')) {
            $q->where('subsistema_id', $request->integer('subsistema_id'));
        }
        if ($request->filled('region_id')) {
            $q->where('region_id', $request->integer('region_id'));
        }
        $this->alcance->aplicarAlcanceInstituciones($q, $request->user());

        $filas = $q->orderBy('nombre')->get(['id', 'subsistema_id', 'region_id', 'clave', 'nombre']);

        return response()->json(['data' => $filas]);
    }

    public function programas(Request $request): JsonResponse
    {
        $user = $request->user();

        $q = ProgramaEstudio::query()
            ->with(['nivelAcademico:id,clave,nombre', 'subsistema:id,clave,nombre'])
            ->withCount(['planesEstudio as planes_vigentes' => fn ($pq) => $pq->where('activo', true)]);

        if ($request->filled('subsistema_id')) {
            $q->where('subsistema_id', $request->integer('subsistema_id'));
        }
        if ($request->filled('activo')) {
            $q->where('activo', $request->boolean('activo'));
        }
        if ($request->filled('search')) {
            $term = '%'.trim((string) $request->input('search')).'%';
            $q->where(function ($w) use ($term): void {
                $w->where('nombre', 'like', $term)
                    ->orWhere('clave', 'like', $term);
            });
        }

        if (! $this->alcance->exentaRestriccionTerritorial($user) && ! $this->alcance->alcanceTerritorialEstaVacio($user)) {
            $q->whereHas('ofertasAcademicas', function ($o) use ($user): void {
                $o->where('activo', true);
                $this->alcance->aplicarAlcanceOfertasAcademicas($o, $user);
            });
        }

        $filas = $q->orderBy('nombre')->get();
        $ids = $filas->pluck('id');

        $instPorPrograma = [];
        if ($ids->isNotEmpty()) {
            $ofertas = OfertaAcademica::query()
                ->whereIn('programa_estudio_id', $ids)
                ->where('activo', true)
                ->with('institucion:id,nombre')
                ->orderBy('programa_estudio_id')
                ->orderBy('id')
                ->get(['id', 'programa_estudio_id', 'institucion_id']);

            foreach ($ofertas as $oferta) {
                if (! isset($instPorPrograma[$oferta->programa_estudio_id])) {
                    $instPorPrograma[$oferta->programa_estudio_id] = $oferta->institucion?->nombre ?? '—';
                }
            }
        }

        $rows = $filas->map(fn (ProgramaEstudio $p) => [
            'id' => $p->id,
            'clave' => $p->clave,
            'nombre' => $p->nombre,
            'nivel' => $p->nivelAcademico?->nombre ?? '—',
            'nivel_clave' => $p->nivelAcademico?->clave,
            'subsistema' => $p->subsistema?->nombre ?? $p->subsistema?->clave,
            'institucion' => $instPorPrograma[$p->id] ?? '—',
            'planes_vigentes' => (int) ($p->planes_vigentes ?? 0),
            'activo' => $p->activo,
            'estatus' => $p->activo ? 'activo' : 'inactivo',
        ])->values();

        return response()->json(['data' => $rows]);
    }

    public function planesEstudio(Request $request): JsonResponse
    {
        $user = $request->user();

        $q = PlanEstudio::query()
            ->with(['programaEstudio:id,clave,nombre,creditos_minimos'])
            ->withCount('planMaterias as materias_count');

        if ($request->filled('programa_estudio_id')) {
            $q->where('programa_estudio_id', $request->integer('programa_estudio_id'));
        }
        if ($request->filled('subsistema_id')) {
            $q->where('subsistema_id', $request->integer('subsistema_id'));
        }
        if ($request->filled('activo')) {
            $q->where('activo', $request->boolean('activo'));
        }
        if ($request->filled('search')) {
            $term = '%'.trim((string) $request->input('search')).'%';
            $q->where(function ($w) use ($term): void {
                $w->where('nombre', 'like', $term)
                    ->orWhere('clave', 'like', $term)
                    ->orWhereHas('programaEstudio', fn ($p) => $p->where('nombre', 'like', $term));
            });
        }

        if (! $this->alcance->exentaRestriccionTerritorial($user) && ! $this->alcance->alcanceTerritorialEstaVacio($user)) {
            $q->whereHas('ofertasAcademicas', function ($o) use ($user): void {
                $o->where('activo', true);
                $this->alcance->aplicarAlcanceOfertasAcademicas($o, $user);
            });
        }

        $rows = $q->orderBy('nombre')->get()->map(function (PlanEstudio $p): array {
            $version = data_get($p->metadata, 'version');
            if ($version === null || $version === '') {
                $version = $p->anio_aprobacion !== null ? (string) $p->anio_aprobacion : $p->clave;
            }

            return [
                'id' => $p->id,
                'nombre' => $p->nombre,
                'clave' => $p->clave,
                'version' => (string) $version,
                'programa' => $p->programaEstudio?->nombre ?? '—',
                'programa_clave' => $p->programaEstudio?->clave,
                'creditos' => (int) (data_get($p->metadata, 'creditos_totales') ?? $p->programaEstudio?->creditos_minimos ?? 0),
                'materias' => (int) ($p->materias_count ?? 0),
                'activo' => $p->activo,
                'estatus' => $p->activo ? 'vigente' : 'inactivo',
                'anio_aprobacion' => $p->anio_aprobacion,
            ];
        })->values();

        return response()->json(['data' => $rows]);
    }

    public function ofertasAcademicas(Request $request): JsonResponse
    {
        $q = OfertaAcademica::query()->where('activo', true);
        if ($request->filled('ciclo_escolar_id')) {
            $q->where('ciclo_escolar_id', $request->integer('ciclo_escolar_id'));
        }
        if ($request->filled('institucion_id')) {
            $q->where('institucion_id', $request->integer('institucion_id'));
        }
        $this->alcance->aplicarAlcanceOfertasAcademicas($q, $request->user());

        $filas = $q->orderBy('clave')
            ->get([
                'id',
                'institucion_id',
                'sede_id',
                'programa_estudio_id',
                'plan_estudio_id',
                'ciclo_escolar_id',
                'clave',
                'modalidad',
            ]);

        return response()->json(['data' => $filas]);
    }

    public function sedes(Request $request): JsonResponse
    {
        $q = Sede::query()->with(['institucion.subsistema'])->where('activo', true);
        $modoTecnico = $request->user()?->can('ver_claves_legacy_catalogos') === true;

        if ($request->filled('institucion_id')) {
            $q->where('institucion_id', $request->integer('institucion_id'));
        }
        if ($request->filled('subsistema_id')) {
            $subsistemaId = $request->integer('subsistema_id');
            $q->whereHas('institucion', fn ($w) => $w->where('subsistema_id', $subsistemaId));
        }
        if ($request->filled('estatus')) {
            $estatus = strtoupper(trim((string) $request->input('estatus')));
            if (in_array($estatus, ['A', 'B'], true)) {
                $q->where('activo', $estatus === 'A');
            }
        }
        if ($request->filled('search')) {
            $term = trim((string) $request->input('search'));
            $q->where(function ($w) use ($term): void {
                $w->where('nombre', 'like', '%'.$term.'%')
                    ->orWhereHas('institucion', fn ($x) => $x->where('nombre', 'like', '%'.$term.'%'));
            });
        }

        $this->alcance->aplicarAlcanceSedes($q, $request->user());

        $rows = $q->orderBy('nombre')->get()->map(function (Sede $s) use ($modoTecnico): array {
            $sub = $s->institucion?->subsistema;
            $base = [
                'id' => $s->id,
                'nombre' => $s->nombre,
                'institucion' => $s->institucion?->nombre ?? '—',
                'subsistema' => $sub?->clave,
                'cct' => $s->cct,
                'municipio_nombre' => data_get($s->metadata, 'posible_municipio_detectado'),
                'estatus' => $s->activo ? 'A' : 'B',
            ];
            if (! $modoTecnico) {
                return $base;
            }

            return array_merge($base, [
                'legacy_kcve_subsede' => $s->legacy_kcve_subsede,
                'legacy_rcve_institucion' => $s->legacy_rcve_institucion,
                'legacy_rcvect' => $s->legacy_rcvect,
                'metadata' => $s->metadata,
            ]);
        })->values();

        return response()->json(['data' => $rows]);
    }
}
