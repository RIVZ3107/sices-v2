<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Catalogos;

use App\Http\Controllers\Controller;
use App\Models\EscalaCalificacion;
use App\Models\EstatusAcademico;
use App\Models\EstatusMatricula;
use App\Services\Catalogos\CatalogosControlEscolarService;
use App\Enums\ControlEscolar\TipoEscalaCalificacion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CatalogosControlEscolarController extends Controller
{
    public function __construct(
        protected CatalogosControlEscolarService $service,
    ) {}

    public function resumen(): JsonResponse
    {
        return response()->json(['data' => $this->service->resumen()]);
    }

    public function tiposEscala(): JsonResponse
    {
        return response()->json(['data' => $this->service->tiposEscalaCalificacion()]);
    }

    public function indexEstatusAcademicos(Request $request): JsonResponse
    {
        $paginator = $this->service->queryEstatusAcademicos($request->all())
            ->paginate($this->perPage($request));

        return response()->json([
            'data' => collect($paginator->items())->map(fn (EstatusAcademico $m) => $this->service->presentarEstatusAcademico($m))->values(),
            'meta' => $this->metaPaginacion($paginator),
            'resumen' => $this->service->resumenEstatusAcademicos(),
        ]);
    }

    public function storeEstatusAcademico(Request $request): JsonResponse
    {
        $data = $this->validarEstatusAcademico($request);
        $model = $this->service->crearEstatusAcademico($data);

        return response()->json(['data' => $this->service->presentarEstatusAcademico($model)], 201);
    }

    public function updateEstatusAcademico(Request $request, int $id): JsonResponse
    {
        $model = EstatusAcademico::query()->findOrFail($id);
        $data = $this->validarEstatusAcademico($request, $model->id);
        $actualizado = $this->service->actualizarEstatusAcademico($model, $data);

        return response()->json(['data' => $this->service->presentarEstatusAcademico($actualizado)]);
    }

    public function activarEstatusAcademico(Request $request, int $id): JsonResponse
    {
        $request->validate(['activo' => ['required', 'boolean']]);
        $model = EstatusAcademico::query()->findOrFail($id);
        $actualizado = $this->service->activarEstatusAcademico($model, (bool) $request->boolean('activo'));

        return response()->json(['data' => $this->service->presentarEstatusAcademico($actualizado)]);
    }

    public function indexEstatusMatricula(Request $request): JsonResponse
    {
        $paginator = $this->service->queryEstatusMatricula($request->all())
            ->paginate($this->perPage($request));

        return response()->json([
            'data' => collect($paginator->items())->map(fn (EstatusMatricula $m) => $this->service->presentarEstatusMatricula($m))->values(),
            'meta' => $this->metaPaginacion($paginator),
            'resumen' => $this->service->resumenEstatusMatricula(),
        ]);
    }

    public function storeEstatusMatricula(Request $request): JsonResponse
    {
        $data = $this->validarEstatusMatricula($request);
        $model = $this->service->crearEstatusMatricula($data);

        return response()->json(['data' => $this->service->presentarEstatusMatricula($model)], 201);
    }

    public function updateEstatusMatricula(Request $request, int $id): JsonResponse
    {
        $model = EstatusMatricula::query()->findOrFail($id);
        $data = $this->validarEstatusMatricula($request, $model->id);
        $actualizado = $this->service->actualizarEstatusMatricula($model, $data);

        return response()->json(['data' => $this->service->presentarEstatusMatricula($actualizado)]);
    }

    public function activarEstatusMatricula(Request $request, int $id): JsonResponse
    {
        $request->validate(['activo' => ['required', 'boolean']]);
        $model = EstatusMatricula::query()->findOrFail($id);
        $actualizado = $this->service->activarEstatusMatricula($model, (bool) $request->boolean('activo'));

        return response()->json(['data' => $this->service->presentarEstatusMatricula($actualizado)]);
    }

    public function indexEscalasCalificacion(Request $request): JsonResponse
    {
        $paginator = $this->service->queryEscalasCalificacion($request->all())
            ->paginate($this->perPage($request));

        return response()->json([
            'data' => collect($paginator->items())->map(fn (EscalaCalificacion $m) => $this->service->presentarEscalaCalificacion($m))->values(),
            'meta' => $this->metaPaginacion($paginator),
            'resumen' => $this->service->resumenEscalasCalificacion(),
        ]);
    }

    public function storeEscalaCalificacion(Request $request): JsonResponse
    {
        $data = $this->validarEscalaCalificacion($request);
        $model = $this->service->crearEscalaCalificacion($data);

        return response()->json(['data' => $this->service->presentarEscalaCalificacion($model)], 201);
    }

    public function updateEscalaCalificacion(Request $request, int $id): JsonResponse
    {
        $model = EscalaCalificacion::query()->findOrFail($id);
        $data = $this->validarEscalaCalificacion($request, $model->id);
        $actualizado = $this->service->actualizarEscalaCalificacion($model, $data);

        return response()->json(['data' => $this->service->presentarEscalaCalificacion($actualizado)]);
    }

    public function activarEscalaCalificacion(Request $request, int $id): JsonResponse
    {
        $request->validate(['activo' => ['required', 'boolean']]);
        $model = EscalaCalificacion::query()->findOrFail($id);
        $actualizado = $this->service->activarEscalaCalificacion($model, (bool) $request->boolean('activo'));

        return response()->json(['data' => $this->service->presentarEscalaCalificacion($actualizado)]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validarEstatusAcademico(Request $request, ?int $ignoreId = null): array
    {
        return $request->validate([
            'clave' => [
                'required', 'string', 'max:40',
                Rule::unique('estatus_academicos', 'clave')->ignore($ignoreId),
            ],
            'nombre' => ['required', 'string', 'max:120'],
            'descripcion' => ['nullable', 'string', 'max:255'],
            'color' => ['nullable', 'string', 'max:20'],
            'orden' => ['sometimes', 'integer', 'min:0', 'max:65535'],
            'activo' => ['sometimes', 'boolean'],
            'metadata' => ['sometimes', 'nullable', 'array'],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validarEstatusMatricula(Request $request, ?int $ignoreId = null): array
    {
        return $request->validate([
            'clave' => [
                'required', 'string', 'max:40',
                Rule::unique('estatus_matricula', 'clave')->ignore($ignoreId),
            ],
            'nombre' => ['required', 'string', 'max:120'],
            'descripcion' => ['nullable', 'string', 'max:255'],
            'color' => ['nullable', 'string', 'max:20'],
            'bloquea_operacion' => ['sometimes', 'boolean'],
            'orden' => ['sometimes', 'integer', 'min:0', 'max:65535'],
            'activo' => ['sometimes', 'boolean'],
            'metadata' => ['sometimes', 'nullable', 'array'],
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function validarEscalaCalificacion(Request $request, ?int $ignoreId = null): array
    {
        return $request->validate([
            'clave' => [
                'required', 'string', 'max:40',
                Rule::unique('escalas_calificacion', 'clave')->ignore($ignoreId),
            ],
            'nombre' => ['required', 'string', 'max:120'],
            'tipo' => ['required', 'string', Rule::in(TipoEscalaCalificacion::values())],
            'calificacion_minima' => ['sometimes', 'numeric'],
            'calificacion_maxima' => ['sometimes', 'numeric'],
            'calificacion_aprobatoria' => ['sometimes', 'numeric'],
            'permite_decimales' => ['sometimes', 'boolean'],
            'decimales' => ['sometimes', 'integer', 'min:0', 'max:4'],
            'permite_acreditado' => ['sometimes', 'boolean'],
            'activo' => ['sometimes', 'boolean'],
            'metadata' => ['sometimes', 'nullable', 'array'],
        ]);
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
