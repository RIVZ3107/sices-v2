<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Certificacion;

use App\Http\Controllers\Controller;
use App\Http\Requests\Certificacion\AprobarValidacionNormativaLegacyRequest;
use App\Http\Requests\Certificacion\RechazarValidacionNormativaLegacyRequest;
use App\Models\Matricula;
use App\Models\User;
use App\Services\Certificacion\CertificacionImportacionLegacyNormativaGate;
use App\Services\Certificacion\NormativaImportacionLegacyService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ValidacionNormativaImportacionLegacyController extends Controller
{
    public function __construct(
        protected NormativaImportacionLegacyService $servicio,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $perPage = min(max((int) $request->query('per_page', 20), 1), 100);
        $paginator = $this->servicio->listarMatriculasPendientes($perPage);

        $ids = collect($paginator->items())->map(function ($m) {
            /** @var Matricula $m */
            return (int) (data_get($m->metadata, CertificacionImportacionLegacyNormativaGate::MATRICULA_META_KEY.'.usuario_importador_id') ?? 0);
        })->filter(fn (int $id) => $id > 0)->unique()->values();

        $usuariosPorId = $ids->isNotEmpty()
            ? User::query()->whereIn('id', $ids)->get(['id', 'name', 'email'])->keyBy('id')
            : collect();

        return response()->json([
            'data' => collect($paginator->items())->map(fn (Matricula $m) => $this->serializarFilaListado($m, $usuariosPorId))->values(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
        ]);
    }

    public function show(Request $request, Matricula $matricula): JsonResponse
    {
        $this->authorize('view', $matricula);

        $detalle = $this->servicio->armarDetalle($matricula->loadMissing([
            'alumno',
            'ofertaAcademica.institucion',
            'ofertaAcademica.planEstudio',
            'cicloEscolar',
        ]));

        $bucket = $detalle['historico_bucket'];

        return response()->json([
            'data' => [
                'matricula' => $this->serializarMatriculaBase($matricula),
                'historico_importacion_legacy' => $bucket,
                'acciones_normativa_disponibles' => (($bucket['estado'] ?? null)
                    === CertificacionImportacionLegacyNormativaGate::ESTADO_PENDIENTE_VALIDACION),
                'importaciones' => $detalle['importaciones']->map(fn ($imp) => $this->serializarImportacion($imp))->values(),
                'materias_legacy' => $detalle['materias_legacy']->map(fn ($mc) => [
                    'id' => $mc->id,
                    'clave' => $mc->clave,
                    'nombre' => $mc->nombre,
                    'calificacion' => $mc->calificacion,
                    'creditos' => $mc->creditos,
                    'semestre' => $mc->semestre,
                    'metadata' => $mc->metadata,
                ])->values(),
                'auditoria' => $detalle['auditoria']->map(fn ($ev) => [
                    'id' => $ev->id,
                    'evento' => $ev->evento,
                    'user_id' => $ev->user_id,
                    'entidad_tipo' => $ev->entidad_tipo,
                    'entidad_id' => $ev->entidad_id,
                    'payload' => $ev->payload,
                    'created_at' => $ev->created_at?->toIso8601String(),
                ])->values(),
            ],
        ]);
    }

    public function aprobar(AprobarValidacionNormativaLegacyRequest $request, Matricula $matricula): JsonResponse
    {
        $this->authorize('view', $matricula);

        $usuario = $request->user();
        if ($usuario === null) {
            abort(401);
        }

        $fresh = $this->servicio->aprobar(
            $matricula,
            (int) $usuario->id,
            $request->validated('motivo'),
            $request->ip(),
            $request->userAgent(),
        );

        return response()->json([
            'data' => [
                'matricula_id' => $fresh->id,
                'historico_importacion_legacy' => data_get(
                    $fresh->metadata,
                    CertificacionImportacionLegacyNormativaGate::MATRICULA_META_KEY,
                ),
            ],
        ]);
    }

    public function rechazar(RechazarValidacionNormativaLegacyRequest $request, Matricula $matricula): JsonResponse
    {
        $this->authorize('view', $matricula);

        $usuario = $request->user();
        if ($usuario === null) {
            abort(401);
        }

        $fresh = $this->servicio->rechazar(
            $matricula,
            (int) $usuario->id,
            (string) $request->validated('motivo'),
            $request->ip(),
            $request->userAgent(),
        );

        return response()->json([
            'data' => [
                'matricula_id' => $fresh->id,
                'historico_importacion_legacy' => data_get(
                    $fresh->metadata,
                    CertificacionImportacionLegacyNormativaGate::MATRICULA_META_KEY,
                ),
            ],
        ]);
    }

    /**
     * @param  \Illuminate\Support\Collection<int, User>  $usuariosPorId
     * @return array<string, mixed>
     */
    private function serializarFilaListado(Matricula $matricula, $usuariosPorId): array
    {
        $bucket = (array) (data_get($matricula->metadata, CertificacionImportacionLegacyNormativaGate::MATRICULA_META_KEY) ?? []);
        $uid = (int) ($bucket['usuario_importador_id'] ?? 0);
        $importador = $uid > 0 ? $usuariosPorId->get($uid) : null;

        $base = $this->serializarMatriculaBase($matricula);

        return array_merge($base, [
            'fecha_marcado_legacy' => $bucket['marcado_en'] ?? null,
            'motivo_forzar_sin_plan' => $bucket['motivo_ultimo_forzado'] ?? null,
            'importador' => $importador ? [
                'id' => $importador->id,
                'name' => $importador->name,
                'email' => $importador->email,
            ] : null,
        ]);
    }

    /** @return array<string, mixed> */
    private function serializarMatriculaBase(Matricula $matricula): array
    {
        $matricula->loadMissing([
            'alumno:id,curp,nombre,primer_apellido,segundo_apellido',
            'ofertaAcademica.institucion:id,clave,nombre',
            'ofertaAcademica.planEstudio:id,clave,nombre',
        ]);

        return [
            'id' => $matricula->id,
            'matricula' => $matricula->matricula,
            'alumno' => $matricula->alumno ? [
                'id' => $matricula->alumno->id,
                'curp' => $matricula->alumno->curp,
                'nombre_completo' => trim(implode(' ', array_filter([
                    $matricula->alumno->nombre,
                    $matricula->alumno->primer_apellido,
                    $matricula->alumno->segundo_apellido,
                ]))),
            ] : null,
            'institucion' => $matricula->ofertaAcademica?->institucion ? [
                'id' => $matricula->ofertaAcademica->institucion->id,
                'clave' => $matricula->ofertaAcademica->institucion->clave,
                'nombre' => $matricula->ofertaAcademica->institucion->nombre,
            ] : null,
            'plan_estudio' => $matricula->ofertaAcademica?->planEstudio ? [
                'id' => $matricula->ofertaAcademica->planEstudio->id,
                'clave' => $matricula->ofertaAcademica->planEstudio->clave,
                'nombre' => $matricula->ofertaAcademica->planEstudio->nombre,
            ] : null,
        ];
    }

    /** @return array<string, mixed> */
    private function serializarImportacion($imp): array
    {
        $confirm = is_array($imp->metadata) ? ($imp->metadata['confirmacion'] ?? []) : [];

        return [
            'id' => $imp->id,
            'estado' => $imp->estado,
            'created_at' => $imp->created_at?->toIso8601String(),
            'motivo_forzar_sin_plan' => $confirm['motivo_forzar_sin_plan'] ?? null,
            'forzar_sin_plan_materia' => $confirm['forzar_sin_plan_materia'] ?? null,
            'usuario' => $imp->user ? [
                'id' => $imp->user->id,
                'name' => $imp->user->name,
                'email' => $imp->user->email,
            ] : null,
        ];
    }
}
