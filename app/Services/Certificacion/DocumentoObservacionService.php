<?php

declare(strict_types=1);

namespace App\Services\Certificacion;

use App\Enums\Certificacion\EstadoWorkflow;
use App\Models\DocumentoAcademico;
use App\Models\DocumentoObservacion;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class DocumentoObservacionService
{
    public function __construct(
        protected DocumentoAcademicoWorkflowService $workflow,
        protected AuditoriaService $auditoria,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function crear(
        DocumentoAcademico $documento,
        array $data,
        ?int $userId = null,
        ?string $ip = null,
        ?string $userAgent = null,
    ): DocumentoObservacion {
        if (in_array($documento->estado_firma, ['firmado', 'firmando'], true)) {
            throw ValidationException::withMessages([
                'estado_firma' => ['No se pueden registrar observaciones en documentos firmados o en proceso de firma.'],
            ]);
        }

        if (! in_array($documento->estado_workflow, [EstadoWorkflow::EN_REVISION->value, EstadoWorkflow::PENDIENTE->value], true)) {
            throw ValidationException::withMessages([
                'estado_workflow' => ['Solo se pueden registrar observaciones en documentos en revisión o pendiente.'],
            ]);
        }

        return DB::transaction(function () use ($documento, $data, $userId, $ip, $userAgent) {
            $obs = DocumentoObservacion::query()->create([
                'documento_academico_id' => $documento->id,
                'tipo' => $data['tipo'],
                'seccion' => $data['seccion'] ?? null,
                'observacion' => $data['observacion'],
                'estado' => 'pendiente',
                'prioridad' => $data['prioridad'] ?? 'media',
                'creada_por' => $userId,
                'metadata' => $data['metadata'] ?? null,
            ]);

            $this->auditoria->registrar(
                'documento_observacion.creada',
                DocumentoObservacion::class,
                $obs->id,
                ['documento_id' => $documento->id],
                $userId,
                $ip,
                $userAgent,
            );

            return $obs;
        });
    }

    public function devolverConObservaciones(
        DocumentoAcademico $documento,
        ?int $userId = null,
        ?string $motivo = null,
        ?string $ip = null,
        ?string $userAgent = null,
    ): DocumentoAcademico {
        $pendientes = DocumentoObservacion::query()
            ->where('documento_academico_id', $documento->id)
            ->where('estado', 'pendiente')
            ->count();

        if ($pendientes < 1) {
            throw ValidationException::withMessages([
                'observaciones' => ['Debe existir al menos una observación pendiente para devolver a corrección.'],
            ]);
        }

        return $this->workflow->rechazar($documento, $userId, $motivo ?? 'Devuelto a corrección por observaciones.', $ip, $userAgent);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public function atender(
        DocumentoObservacion $observacion,
        array $data,
        ?int $userId = null,
        ?string $ip = null,
        ?string $userAgent = null,
    ): DocumentoObservacion {
        if ($observacion->estado !== 'pendiente') {
            throw ValidationException::withMessages([
                'estado' => ['Solo pueden atenderse observaciones pendientes.'],
            ]);
        }

        $meta = array_merge($observacion->metadata ?? [], $data['metadata'] ?? []);

        $observacion->forceFill([
            'estado' => $data['estado'],
            'respuesta' => $data['respuesta'] ?? null,
            'atendida_por' => $userId,
            'atendida_at' => now(),
            'metadata' => $meta,
        ])->save();

        $this->auditoria->registrar(
            'documento_observacion.atendida',
            DocumentoObservacion::class,
            $observacion->id,
            ['estado' => $data['estado']],
            $userId,
            $ip,
            $userAgent,
        );

        return $observacion->fresh();
    }
}
