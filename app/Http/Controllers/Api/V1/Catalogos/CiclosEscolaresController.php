<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Catalogos;

use App\Http\Controllers\Controller;
use App\Models\CicloEscolar;
use App\Models\PeriodoEscolar;
use App\Models\User;
use App\Services\Catalogos\CicloEscolarCatalogoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use App\Enums\Academico\TipoPeriodoEscolar;

class CiclosEscolaresController extends Controller
{
    public function __construct(
        protected CicloEscolarCatalogoService $service,
    ) {}

    public function resumen(): JsonResponse
    {
        return response()->json(['data' => $this->service->resumenCiclos()]);
    }

    public function index(Request $request): JsonResponse
    {
        $tecnico = $this->modoTecnico($request->user());
        $paginator = $this->service->queryCiclos($request->all())
            ->paginate($this->perPage($request));

        return response()->json([
            'data' => collect($paginator->items())->map(fn (CicloEscolar $c) => $this->service->presentarCiclo($c, $tecnico))->values(),
            'meta' => $this->metaPaginacion($paginator),
            'resumen' => $this->service->resumenCiclos(),
        ]);
    }

    public function show(Request $request, int $ciclo): JsonResponse
    {
        $tecnico = $this->modoTecnico($request->user());
        $model = CicloEscolar::query()->withCount('periodosEscolares')->findOrFail($ciclo);

        return response()->json(['data' => $this->service->presentarCiclo($model, $tecnico)]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->validarCiclo($request);
        $tecnico = $this->modoTecnico($request->user());
        $ciclo = $this->service->crearCiclo($data);

        return response()->json(['data' => $this->service->presentarCiclo($ciclo, $tecnico)], 201);
    }

    public function update(Request $request, int $ciclo): JsonResponse
    {
        $model = CicloEscolar::query()->findOrFail($ciclo);
        $data = $this->validarCiclo($request, $model->id);
        $tecnico = $this->modoTecnico($request->user());
        $actualizado = $this->service->actualizarCiclo($model, $data);

        return response()->json(['data' => $this->service->presentarCiclo($actualizado, $tecnico)]);
    }

    public function marcarActual(Request $request, int $ciclo): JsonResponse
    {
        $model = CicloEscolar::query()->findOrFail($ciclo);
        $tecnico = $this->modoTecnico($request->user());
        $actualizado = $this->service->marcarComoActual($model);

        return response()->json(['data' => $this->service->presentarCiclo($actualizado, $tecnico)]);
    }

    public function activar(Request $request, int $ciclo): JsonResponse
    {
        $request->validate(['activo' => ['required', 'boolean']]);
        $model = CicloEscolar::query()->findOrFail($ciclo);
        $tecnico = $this->modoTecnico($request->user());
        $actualizado = $this->service->activarCiclo($model, (bool) $request->boolean('activo'));

        return response()->json(['data' => $this->service->presentarCiclo($actualizado, $tecnico)]);
    }

    public function periodosIndex(Request $request): JsonResponse
    {
        $tecnico = $this->modoTecnico($request->user());
        $paginator = $this->service->queryPeriodos($request->all())
            ->paginate($this->perPage($request));

        return response()->json([
            'data' => collect($paginator->items())->map(fn (PeriodoEscolar $p) => $this->service->presentarPeriodo($p, $tecnico))->values(),
            'meta' => $this->metaPaginacion($paginator),
        ]);
    }

    public function periodosPorCiclo(Request $request, int $ciclo): JsonResponse
    {
        CicloEscolar::query()->findOrFail($ciclo);
        $tecnico = $this->modoTecnico($request->user());
        $request->merge(['ciclo_escolar_id' => $ciclo]);
        $paginator = $this->service->queryPeriodos($request->all())
            ->paginate($this->perPage($request));

        return response()->json([
            'data' => collect($paginator->items())->map(fn (PeriodoEscolar $p) => $this->service->presentarPeriodo($p, $tecnico))->values(),
            'meta' => $this->metaPaginacion($paginator),
        ]);
    }

    public function storePeriodo(Request $request, int $ciclo): JsonResponse
    {
        $cicloModel = CicloEscolar::query()->findOrFail($ciclo);
        $data = $this->validarPeriodo($request, null, $ciclo);
        $tecnico = $this->modoTecnico($request->user());
        $periodo = $this->service->crearPeriodo($cicloModel, $data);

        return response()->json(['data' => $this->service->presentarPeriodo($periodo, $tecnico)], 201);
    }

    public function updatePeriodo(Request $request, int $periodo): JsonResponse
    {
        $model = PeriodoEscolar::query()->findOrFail($periodo);
        $data = $this->validarPeriodo($request, $model->id, $model->ciclo_escolar_id);
        $tecnico = $this->modoTecnico($request->user());
        $actualizado = $this->service->actualizarPeriodo($model, $data);

        return response()->json(['data' => $this->service->presentarPeriodo($actualizado, $tecnico)]);
    }

    public function activarPeriodo(Request $request, int $periodo): JsonResponse
    {
        $request->validate(['activo' => ['required', 'boolean']]);
        $model = PeriodoEscolar::query()->findOrFail($periodo);
        $tecnico = $this->modoTecnico($request->user());
        $actualizado = $this->service->activarPeriodo($model, (bool) $request->boolean('activo'));

        return response()->json(['data' => $this->service->presentarPeriodo($actualizado, $tecnico)]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validarCiclo(Request $request, ?int $ignoreId = null): array
    {
        return $request->validate([
            'clave' => [
                'required', 'string', 'max:30',
                Rule::unique('ciclos_escolares', 'clave')->ignore($ignoreId),
            ],
            'nombre' => ['required', 'string', 'max:120'],
            'fecha_inicio' => ['required', 'date'],
            'fecha_fin' => ['required', 'date', 'after_or_equal:fecha_inicio'],
            'es_actual' => ['sometimes', 'boolean'],
            'activo' => ['sometimes', 'boolean'],
            'metadata' => ['sometimes', 'nullable', 'array'],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validarPeriodo(Request $request, ?int $ignoreId = null, int|string|null $cicloId = null): array
    {
        $cicloId = $cicloId ?? $request->route('ciclo');

        return $request->validate([
            'clave' => [
                'required', 'string', 'max:40',
                Rule::unique('periodos_escolares', 'clave')
                    ->where(fn ($q) => $q->where('ciclo_escolar_id', $cicloId))
                    ->ignore($ignoreId),
            ],
            'nombre' => ['required', 'string', 'max:120'],
            'tipo_periodo' => ['required', 'string', Rule::in(TipoPeriodoEscolar::values())],
            'numero_periodo' => ['required', 'integer', 'min:1', 'max:255'],
            'fecha_inicio' => ['required', 'date'],
            'fecha_fin' => ['required', 'date', 'after_or_equal:fecha_inicio'],
            'fecha_inicio_inscripcion' => ['nullable', 'date'],
            'fecha_fin_inscripcion' => ['nullable', 'date', 'after_or_equal:fecha_inicio_inscripcion'],
            'fecha_inicio_calificaciones' => ['nullable', 'date'],
            'fecha_fin_calificaciones' => ['nullable', 'date', 'after_or_equal:fecha_inicio_calificaciones'],
            'activo' => ['sometimes', 'boolean'],
            'metadata' => ['sometimes', 'nullable', 'array'],
        ]);
    }

    private function modoTecnico(?User $user): bool
    {
        if ($user === null) {
            return false;
        }

        return $user->hasAnyRole(['superadmin', 'admin', 'sistemas'])
            || $user->can('catalogos.configurar')
            || $user->can('catalogos.academicos.configurar');
    }

    private function perPage(Request $request): int
    {
        return min(100, max(1, $request->integer('per_page', 25)));
    }

    /**
     * @return array<string, int|null>
     */
    private function metaPaginacion(mixed $paginator): array
    {
        return [
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
        ];
    }
}
