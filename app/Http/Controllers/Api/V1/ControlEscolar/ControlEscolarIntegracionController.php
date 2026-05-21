<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\ControlEscolar;

use App\Contracts\ControlEscolar\ControlEscolarSourceAdapterInterface;
use App\Http\Controllers\Controller;
use App\Http\Requests\ControlEscolar\ImportarControlEscolarRequest;
use App\Services\ControlEscolar\ControlEscolarDecDataValidator;
use App\Services\ControlEscolar\ControlEscolarSyncService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ControlEscolarIntegracionController extends Controller
{
    public function __construct(
        protected ControlEscolarSourceAdapterInterface $source,
        protected ControlEscolarSyncService $sync,
        protected ControlEscolarDecDataValidator $decValidator,
    ) {}

    public function health(): JsonResponse
    {
        return response()->json(['data' => $this->source->health()]);
    }

    public function buscar(Request $request): JsonResponse
    {
        $curp = $request->query('curp');
        $matricula = $request->query('matricula');

        if ($curp !== null && $curp !== '') {
            $dato = $this->source->buscarAlumnoPorCurp((string) $curp);

            return response()->json([
                'data' => $dato ? $this->serializeAlumno($dato) : null,
            ]);
        }

        if ($matricula !== null && $matricula !== '') {
            $dato = $this->source->buscarAlumnoPorMatricula((string) $matricula);

            return response()->json([
                'data' => $dato ? $this->serializeAlumno($dato) : null,
            ]);
        }

        return response()->json(['message' => 'Indique curp o matricula.'], 422);
    }

    public function importar(ImportarControlEscolarRequest $request): JsonResponse
    {
        $data = $request->validated();

        $result = isset($data['curp'])
            ? $this->sync->importarPorCurp($data['curp'])
            : $this->sync->importarPorMatricula($data['matricula']);

        return response()->json(['data' => $result->toArray()], $result->success ? 200 : 422);
    }

    public function validarDec(string $matricula): JsonResponse
    {
        $sync = $this->sync->importarPorMatricula($matricula);
        if (! $sync->success || $sync->matricula === null) {
            return response()->json(['data' => $sync->toArray()], 422);
        }

        $errores = $this->decValidator->validarMatricula($sync->matricula);

        return response()->json([
            'data' => [
                'valido' => $errores === [],
                'errores' => $errores,
                'matricula_id' => $sync->matricula->id,
            ],
        ]);
    }

    public function crearDocumentoCertificacion(Request $request, string $matricula): JsonResponse
    {
        $result = $this->sync->crearDocumentoDesdeControlEscolar(
            $matricula,
            $request->only(['tipo_documento', 'tipo_certificacion', 'sede_cct']),
        );

        return response()->json(['data' => $result->toArray()], $result->success ? 201 : 422);
    }

    /**
     * @param  \App\Data\ControlEscolar\ControlEscolarAlumnoData  $dato
     * @return array<string, mixed>
     */
    protected function serializeAlumno($dato): array
    {
        return [
            'curp' => $dato->curp,
            'nombre' => $dato->nombre,
            'primer_apellido' => $dato->primerApellido,
            'segundo_apellido' => $dato->segundoApellido,
            'matricula' => $dato->matricula,
            'sede_cct' => $dato->sedeCct,
            'programa' => $dato->programaNombre,
            'plan' => $dato->planNombre,
            'modalidad' => $dato->modalidad,
        ];
    }
}
