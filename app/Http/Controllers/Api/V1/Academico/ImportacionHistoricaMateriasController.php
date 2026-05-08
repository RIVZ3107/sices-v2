<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Academico;

use App\Http\Controllers\Controller;
use App\Http\Requests\Academico\ConfirmImportacionHistoricaMateriasRequest;
use App\Http\Requests\Academico\StoreImportacionHistoricaMateriasRequest;
use App\Http\Resources\Academico\ImportacionHistoricaMateriasResource;
use App\Models\ImportacionHistoricaMaterias;
use App\Models\Matricula;
use App\Services\Certificacion\ImportacionHistoricaMateriasService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class ImportacionHistoricaMateriasController extends Controller
{
    public function __construct(
        protected ImportacionHistoricaMateriasService $servicio,
    ) {}

    public function plantilla(Request $request): JsonResponse
    {
        abort_unless($request->user()?->can('importar_calificaciones'), 403);

        return response()->json([
            'columnas_sugeridas' => [
                'clave',
                'nombre',
                'calificacion',
                'tipo_periodo_curricular',
                'numero_periodo_curricular',
                'semestre_dec',
                'periodo',
                'estado',
            ],
            'descripcion' => 'Si no se envían tipo_periodo_curricular ni numero_periodo_curricular se interpreta período tipo semestre '
                .'usando semestre o numero declarado como número de periodo. '
                .'Para períodos no semestrales debe declararse semestre_dec (o semestre institucional) para el atributo XML DEC; '
                .'confirmar en modo «forzar sin plan» requiere permiso dedicado + motivo (API: motivo_forzar_sin_plan).',
        ]);
    }

    public function index(Request $request): JsonResponse
    {
        abort_unless($request->user()?->can('importar_calificaciones'), 403);

        $lista = ImportacionHistoricaMaterias::query()
            ->where('user_id', (int) $request->user()->id)
            ->orderByDesc('id')
            ->limit(80)
            ->get();

        return ImportacionHistoricaMateriasResource::collection(
            $lista->load(['matricula:id,alumno_id,oferta_academica_id,matricula,ciclo_escolar_id']),
        )->response();
    }

    public function store(StoreImportacionHistoricaMateriasRequest $request): JsonResponse
    {
        abort_unless($request->user()?->can('importar_calificaciones'), 403);

        $data = $request->validated();
        $matricula = Matricula::query()->findOrFail($data['matricula_id']);
        $this->authorize('capturarMaterias', $matricula);

        $importacion = ImportacionHistoricaMaterias::query()->create([
            'user_id' => (int) $request->user()->id,
            'matricula_id' => $matricula->id,
            'ciclo_escolar_id' => (int) $data['ciclo_escolar_id'],
            'estado' => 'borrador',
            'filas_payload' => array_values($data['filas_payload']),
            'validacion_payload' => null,
            'reconciliacion_payload' => null,
            'metadata' => $data['metadata'] ?? [],
        ]);

        return (new ImportacionHistoricaMateriasResource($importacion))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Request $request, int $historica_importacion): JsonResponse
    {
        abort_unless($request->user()?->can('importar_calificaciones'), 403);

        $importacion = ImportacionHistoricaMaterias::query()->findOrFail($historica_importacion);
        $this->aseguraPropiedad($importacion, $request);
        $importacion->loadMissing(['matricula:id,alumno_id,oferta_academica_id,matricula,ciclo_escolar_id']);
        $this->authorize('capturarMaterias', $importacion->matricula);

        return (new ImportacionHistoricaMateriasResource($importacion))->response();
    }

    public function prevalidar(Request $request, int $historica_importacion): JsonResponse
    {
        abort_unless($request->user()?->can('importar_calificaciones'), 403);

        $importacion = ImportacionHistoricaMaterias::query()->findOrFail($historica_importacion);
        $this->aseguraPropiedad($importacion, $request);
        $importacion->loadMissing('matricula');
        $this->authorize('capturarMaterias', $importacion->matricula);

        if (in_array($importacion->estado, ['confirmada', 'cancelada'], true)) {
            throw ValidationException::withMessages([
                'estado' => ['Este lote ya no puede prevalidarse.'],
            ]);
        }

        /** @var list<array<string,mixed>> $filas */
        $filas = $importacion->filas_payload ?? [];
        $salida = $this->servicio->prevalidarYConciliar($importacion->matricula, $filas);

        $importacion->update([
            'validacion_payload' => $salida['validacion'],
            'reconciliacion_payload' => $salida['reconciliacion'],
            'estado' => 'pre_validada',
        ]);

        return response()->json([
            'data' => new ImportacionHistoricaMateriasResource(
                $importacion->fresh(['matricula:id,alumno_id,oferta_academica_id,matricula,ciclo_escolar_id']),
            ),
            'informe_validacion' => $salida['validacion'],
            'conciliacion' => $salida['reconciliacion'],
        ]);
    }

    public function confirmar(
        ConfirmImportacionHistoricaMateriasRequest $request,
        int $historica_importacion,
    ): JsonResponse {
        abort_unless($request->user()?->can('importar_calificaciones'), 403);

        $importacion = ImportacionHistoricaMaterias::query()->findOrFail($historica_importacion);
        $this->aseguraPropiedad($importacion, $request);
        $importacion->loadMissing('matricula');
        $this->authorize('capturarMaterias', $importacion->matricula);

        if ($importacion->estado === 'confirmada') {
            throw ValidationException::withMessages([
                'estado' => ['Esta importacion ya fue confirmada.'],
            ]);
        }
        if ($importacion->estado !== 'pre_validada') {
            throw ValidationException::withMessages([
                'estado' => ['Primero debe ejecutar prevalidacion y quedar en pre_validada.'],
            ]);
        }

        $payload = $request->validated();
        $forzarSinPlan = (bool) ($payload['forzar_sin_plan_materia'] ?? false);

        if ($forzarSinPlan) {
            abort_unless($request->user()?->can('forzar_importacion_historica_sin_plan_materia'), 403);
        }

        /** @var list<array<string,mixed>> $filas */
        $filas = isset($payload['filas_payload']) && is_array($payload['filas_payload'])
            ? array_values($payload['filas_payload'])
            : array_values($importacion->filas_payload ?? []);
        $ejecución = isset($payload['filas_ejecucion']) && is_array($payload['filas_ejecucion'])
            ? array_values($payload['filas_ejecucion'])
            : $this->servicio->filasEjecucionPorDefecto($importacion);

        if ($ejecución === []) {
            throw ValidationException::withMessages([
                'filas_ejecucion' => ['No hay conciliacion previa ni filas proporcionadas.'],
            ]);
        }

        $motivoLegacy = $forzarSinPlan
            ? trim((string) ($payload['motivo_forzar_sin_plan'] ?? ''))
            : null;

        $resumen = $this->servicio->aplicarImportacionConfirmada(
            $importacion,
            $filas,
            $ejecución,
            $request->user()?->id,
            $forzarSinPlan,
            $motivoLegacy,
        );

        return response()->json([
            'data' => new ImportacionHistoricaMateriasResource(
                $importacion->fresh(['matricula:id,alumno_id,oferta_academica_id,matricula,ciclo_escolar_id']),
            ),
            'resumen' => $resumen,
        ]);
    }

    public function cancelar(Request $request, int $historica_importacion): JsonResponse
    {
        abort_unless($request->user()?->can('importar_calificaciones'), 403);

        $importacion = ImportacionHistoricaMaterias::query()->findOrFail($historica_importacion);
        $this->aseguraPropiedad($importacion, $request);
        $this->authorize('capturarMaterias', $importacion->matricula);

        if ($importacion->estado === 'confirmada') {
            throw ValidationException::withMessages([
                'estado' => ['Un lote confirmado no puede cancelarse por este endpoint.'],
            ]);
        }

        $importacion->update(['estado' => 'cancelada']);

        return (new ImportacionHistoricaMateriasResource($importacion->fresh()))->response();
    }

    private function aseguraPropiedad(ImportacionHistoricaMaterias $importacion, Request $request): void
    {
        if ((int) $importacion->user_id !== (int) $request->user()?->id) {
            abort(404);
        }
    }
}
