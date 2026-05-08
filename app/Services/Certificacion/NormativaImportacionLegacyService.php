<?php

declare(strict_types=1);

namespace App\Services\Certificacion;

use App\Models\AuditoriaEvento;
use App\Models\ImportacionHistoricaMaterias;
use App\Models\MateriaCursada;
use App\Models\Matricula;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class NormativaImportacionLegacyService
{
    public function __construct(
        protected AuditoriaService $auditoria,
    ) {}

    public function listarMatriculasPendientes(int $perPage = 20): LengthAwarePaginator
    {
        $q = Matricula::query()
            ->where(
                'metadata->'.CertificacionImportacionLegacyNormativaGate::MATRICULA_META_KEY.'->estado',
                CertificacionImportacionLegacyNormativaGate::ESTADO_PENDIENTE_VALIDACION
            )
            ->with([
                'alumno:id,curp,nombre,primer_apellido,segundo_apellido',
                'ofertaAcademica.institucion:id,clave,nombre',
                'ofertaAcademica.planEstudio:id,clave,nombre',
                'cicloEscolar:id,clave,nombre',
            ])
            ->orderByDesc('id');

        return $q->paginate($perPage);
    }

    /**
     * @return array<string, mixed>
     */
    public function armarDetalle(Matricula $matricula): array
    {
        $bucket = data_get($matricula->metadata, CertificacionImportacionLegacyNormativaGate::MATRICULA_META_KEY);
        $bucketArr = is_array($bucket) ? $bucket : [];

        $ids = isset($bucketArr['importaciones_ids']) && is_array($bucketArr['importaciones_ids'])
            ? array_map('intval', $bucketArr['importaciones_ids'])
            : [];

        $importaciones = $ids !== []
            ? ImportacionHistoricaMaterias::query()
                ->whereIn('id', $ids)
                ->with('user:id,name,email')
                ->orderByDesc('id')
                ->get()
            : collect();

        $materiasLegacy = MateriaCursada::query()
            ->where('matricula_id', $matricula->id)
            ->where('metadata->origen', CertificacionImportacionLegacyNormativaGate::META_ORIGEN_LEGACY)
            ->orderBy('id')
            ->get(['id', 'clave', 'nombre', 'calificacion', 'creditos', 'metadata', 'semestre']);

        $eventosLegacy = AuditoriaEvento::query()
            ->where(function ($w) use ($matricula, $ids) {
                $w->where(function ($x) use ($matricula) {
                    $x->where('entidad_tipo', Matricula::class)
                        ->where('entidad_id', $matricula->id);
                });
                foreach ($ids as $impId) {
                    $w->orWhere(function ($x) use ($impId) {
                        $x->where('entidad_tipo', ImportacionHistoricaMaterias::class)
                            ->where('entidad_id', $impId);
                    });
                }
            })
            ->whereIn('evento', [
                'importacion_materias_historicas.confirmada',
                'historico_importacion_legacy.validacion_normativa.aprobada',
                'historico_importacion_legacy.validacion_normativa.rechazada',
            ])
            ->orderByDesc('id')
            ->limit(100)
            ->get();

        return [
            'historico_bucket' => $bucketArr,
            'importaciones' => $importaciones,
            'materias_legacy' => $materiasLegacy,
            'auditoria' => $eventosLegacy,
        ];
    }

    public function aprobar(
        Matricula $matricula,
        int $actorId,
        ?string $motivo,
        ?string $ip = null,
        ?string $userAgent = null,
    ): Matricula {
        return DB::transaction(function () use ($matricula, $actorId, $motivo, $ip, $userAgent) {
            $matricula->refresh();
            $this->assertPendiente($matricula);

            $bucket = $this->mergeBucketDecisión($matricula, CertificacionImportacionLegacyNormativaGate::ESTADO_VALIDADO_NORMATIVAMENTE, $actorId, $motivo, 'aprobar');

            $meta = array_merge((array) ($matricula->metadata ?? []), [
                CertificacionImportacionLegacyNormativaGate::MATRICULA_META_KEY => $bucket,
            ]);

            $matricula->forceFill(['metadata' => $meta])->save();

            $this->auditoria->registrar(
                'historico_importacion_legacy.validacion_normativa.aprobada',
                Matricula::class,
                $matricula->id,
                [
                    'motivo' => $motivo,
                    'estado' => CertificacionImportacionLegacyNormativaGate::ESTADO_VALIDADO_NORMATIVAMENTE,
                ],
                $actorId,
                $ip,
                $userAgent,
                ['servicio' => self::class],
            );

            return $matricula->fresh();
        });
    }

    public function rechazar(
        Matricula $matricula,
        int $actorId,
        string $motivo,
        ?string $ip = null,
        ?string $userAgent = null,
    ): Matricula {
        return DB::transaction(function () use ($matricula, $actorId, $motivo, $ip, $userAgent) {
            $matricula->refresh();
            $this->assertPendiente($matricula);

            $bucket = $this->mergeBucketDecisión($matricula, CertificacionImportacionLegacyNormativaGate::ESTADO_RECHAZADO_NORMATIVAMENTE, $actorId, $motivo, 'rechazar');

            $meta = array_merge((array) ($matricula->metadata ?? []), [
                CertificacionImportacionLegacyNormativaGate::MATRICULA_META_KEY => $bucket,
            ]);

            $matricula->forceFill(['metadata' => $meta])->save();

            $this->auditoria->registrar(
                'historico_importacion_legacy.validacion_normativa.rechazada',
                Matricula::class,
                $matricula->id,
                [
                    'motivo' => $motivo,
                    'estado' => CertificacionImportacionLegacyNormativaGate::ESTADO_RECHAZADO_NORMATIVAMENTE,
                ],
                $actorId,
                $ip,
                $userAgent,
                ['servicio' => self::class],
            );

            return $matricula->fresh();
        });
    }

    /** @throws ValidationException */
    private function assertPendiente(Matricula $matricula): void
    {
        $estado = (string) data_get($matricula->metadata, CertificacionImportacionLegacyNormativaGate::MATRICULA_META_KEY.'.estado');
        if ($estado !== CertificacionImportacionLegacyNormativaGate::ESTADO_PENDIENTE_VALIDACION) {
            throw ValidationException::withMessages([
                'matricula_id' => ['Solo pueden validarse normativamente matrículas con estado pendiente de validación.'],
            ]);
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function mergeBucketDecisión(
        Matricula $matricula,
        string $nuevoEstado,
        int $actorId,
        ?string $motivo,
        string $accion,
    ): array {
        $prev = (array) (data_get($matricula->metadata, CertificacionImportacionLegacyNormativaGate::MATRICULA_META_KEY) ?? []);

        return array_merge($prev, [
            'estado' => $nuevoEstado,
            'validacion_normativa' => [
                'accion' => $accion,
                'usuario_id' => $actorId,
                'fecha' => now()->toIso8601String(),
                'motivo' => trim((string) ($motivo ?? '')),
            ],
        ]);
    }
}
