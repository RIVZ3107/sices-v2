<?php

declare(strict_types=1);

namespace App\Services\Certificacion;

use App\Models\DocumentoAcademico;
use App\Models\Folio;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class FolioService
{
    /**
     * Asigna un folio interno disponible al documento y actualiza `folio_interno` en el documento.
     * Si el documento ya tiene folio asociado, devuelve ese registro sin duplicar.
     */
    public function asignarFolioInterno(DocumentoAcademico $documento, ?string $prefijo = null): Folio
    {
        $documento->loadMissing(['folio', 'cicloEscolar']);

        if ($documento->folio !== null) {
            return $documento->folio;
        }

        return DB::transaction(function () use ($documento, $prefijo) {
            $documento->refresh();

            $prefijoUsado = $prefijo ?? 'FA';
            $ciclo = $documento->cicloEscolar;
            if ($ciclo === null) {
                throw new RuntimeException('El documento académico no tiene ciclo escolar asociado.');
            }

            $pool = Folio::query()
                ->where('estado', 'disponible')
                ->where('ciclo_escolar_id', $documento->ciclo_escolar_id)
                ->where('tipo_documento', $documento->tipo_documento)
                ->where(function ($q) use ($documento) {
                    $q->whereNull('subsistema_id');
                    if ($documento->subsistema_id) {
                        $q->orWhere('subsistema_id', $documento->subsistema_id);
                    }
                })
                ->orderBy('id')
                ->lockForUpdate()
                ->first();

            if ($pool !== null) {
                $pool->forceFill([
                    'documento_academico_id' => $documento->id,
                    'estado' => 'asignado',
                    'asignado_at' => now(),
                    'metadata' => array_merge($pool->metadata ?? [], [
                        'asignado_por' => self::class,
                    ]),
                ])->save();

                $documento->forceFill(['folio_interno' => $pool->folio_completo])->save();

                return $pool->refresh();
            }

            $base = Folio::query()
                ->where('ciclo_escolar_id', $documento->ciclo_escolar_id)
                ->where('tipo_documento', $documento->tipo_documento)
                ->where(function ($q) use ($documento) {
                    $q->whereNull('subsistema_id');
                    if ($documento->subsistema_id) {
                        $q->orWhere('subsistema_id', $documento->subsistema_id);
                    }
                });

            $siguiente = (int) $base->lockForUpdate()->max('numero') + 1;

            $claveCiclo = $ciclo->clave ?? (string) $ciclo->id;
            $folioCompleto = sprintf('%s-%s-%06d', $prefijoUsado, $claveCiclo, $siguiente);

            $folio = Folio::query()->create([
                'documento_academico_id' => $documento->id,
                'ciclo_escolar_id' => $documento->ciclo_escolar_id,
                'subsistema_id' => $documento->subsistema_id,
                'tipo_documento' => $documento->tipo_documento,
                'prefijo' => $prefijoUsado,
                'numero' => $siguiente,
                'folio_completo' => $folioCompleto,
                'estado' => 'asignado',
                'asignado_at' => now(),
                'metadata' => [
                    'generado_automaticamente' => true,
                    'servicio' => self::class,
                ],
            ]);

            $documento->forceFill(['folio_interno' => $folioCompleto])->save();

            return $folio;
        });
    }
}
