<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Certificacion;

use App\Http\Controllers\Controller;
use App\Models\SolicitudMatricula;
use App\Services\Certificacion\SolicitudMatriculaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SolicitudMatriculaController extends Controller
{
    public function __construct(
        protected SolicitudMatriculaService $solicitudes,
    ) {}

    public function index(Request $request): JsonResponse
    {
        if (
            ! $request->user()?->can('ver_solicitud_matricula')
            && ! $request->user()?->can('solicitudes_matricula.ver')
        ) {
            abort(403);
        }

        $estado = $request->query('estado');
        $estado = is_string($estado) ? trim($estado) : null;

        $rows = $this->solicitudes->listarBandejaParaUsuario($request->user(), $estado);

        return response()->json(['ok' => true, 'data' => $rows]);
    }

    public function ultimaPorAlumno(Request $request, int $alumno): JsonResponse
    {
        if (
            ! $request->user()?->can('ver_solicitud_matricula')
            && ! $request->user()?->can('solicitudes_matricula.ver')
        ) {
            abort(403);
        }

        $s = $this->solicitudes->ultimaVigenteParaAlumno($alumno);

        return response()->json(['ok' => true, 'data' => $s]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'alumno_id' => ['required', 'integer', 'exists:alumnos,id'],
            'oferta_academica_id' => ['required', 'integer', 'exists:ofertas_academicas,id'],
            'ciclo_ingreso_id' => ['required', 'integer', 'exists:ciclos_escolares,id'],
            'metadata' => ['nullable', 'array'],
        ]);

        $s = $this->solicitudes->crearBorrador(
            $request->user(),
            (int) $data['alumno_id'],
            (int) $data['oferta_academica_id'],
            (int) $data['ciclo_ingreso_id'],
            (array) ($data['metadata'] ?? []),
        );

        return response()->json(['ok' => true, 'data' => $s], 201);
    }

    public function enviar(Request $request, SolicitudMatricula $solicitudMatricula): JsonResponse
    {
        $s = $this->solicitudes->enviar($request->user(), $solicitudMatricula);

        return response()->json(['ok' => true, 'data' => $s]);
    }

    public function tomarEnRevision(Request $request, SolicitudMatricula $solicitudMatricula): JsonResponse
    {
        $s = $this->solicitudes->tomarEnRevision($request->user(), $solicitudMatricula);

        return response()->json(['ok' => true, 'data' => $s]);
    }

    public function devolverConObservaciones(Request $request, SolicitudMatricula $solicitudMatricula): JsonResponse
    {
        $data = $request->validate([
            'observaciones' => ['required', 'string', 'max:8000'],
        ]);

        $s = $this->solicitudes->devolverConObservaciones(
            $request->user(),
            $solicitudMatricula,
            (string) $data['observaciones'],
        );

        return response()->json(['ok' => true, 'data' => $s]);
    }

    public function atenderObservaciones(Request $request, SolicitudMatricula $solicitudMatricula): JsonResponse
    {
        $s = $this->solicitudes->atenderObservaciones($request->user(), $solicitudMatricula);

        return response()->json(['ok' => true, 'data' => $s]);
    }

    public function aprobar(Request $request, SolicitudMatricula $solicitudMatricula): JsonResponse
    {
        $s = $this->solicitudes->aprobar($request->user(), $solicitudMatricula);

        return response()->json(['ok' => true, 'data' => $s]);
    }

    public function rechazar(Request $request, SolicitudMatricula $solicitudMatricula): JsonResponse
    {
        $data = $request->validate([
            'motivo_rechazo' => ['required', 'string', 'max:4000'],
        ]);

        $s = $this->solicitudes->rechazar(
            $request->user(),
            $solicitudMatricula,
            (string) $data['motivo_rechazo'],
        );

        return response()->json(['ok' => true, 'data' => $s]);
    }

    public function asignarMatricula(Request $request, SolicitudMatricula $solicitudMatricula): JsonResponse
    {
        $data = $request->validate([
            'matricula' => ['required', 'string', 'max:50'],
            'estado' => ['sometimes', 'string', 'max:20'],
            'metadata' => ['nullable', 'array'],
        ]);

        $s = $this->solicitudes->asignarMatricula(
            $request->user(),
            $solicitudMatricula,
            (string) $data['matricula'],
            (string) ($data['estado'] ?? 'activa'),
            (array) ($data['metadata'] ?? []),
        );

        return response()->json(['ok' => true, 'data' => $s]);
    }
}
