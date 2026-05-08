<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Certificacion;

use App\Http\Controllers\Controller;
use App\Models\CicloEscolar;
use App\Models\Institucion;
use App\Models\OfertaAcademica;
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
