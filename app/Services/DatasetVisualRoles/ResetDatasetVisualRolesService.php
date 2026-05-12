<?php

declare(strict_types=1);

namespace App\Services\DatasetVisualRoles;

use App\Models\Alumno;
use App\Models\AuditoriaEvento;
use App\Models\CargaAcademica;
use App\Models\CicloEscolar;
use App\Models\DocumentoAcademico;
use App\Models\DocumentoEstadoHistorial;
use App\Models\DocumentoFirma;
use App\Models\DocumentoFirmante;
use App\Models\DocumentoMateriaSnapshot;
use App\Models\DocumentoObservacion;
use App\Models\DocumentoPayload;
use App\Models\DocumentoVersion;
use App\Models\Folio;
use App\Models\ImportacionHistoricaMaterias;
use App\Models\InscripcionPeriodo;
use App\Models\IntegracionLog;
use App\Models\MateriaCursada;
use App\Models\Matricula;
use App\Models\OfertaAcademica;
use App\Models\PeriodoEscolar;
use App\Models\SolicitudMatricula;
use App\Models\TrayectoriaAcademica;
use App\Models\UrlShortToken;
use App\Models\VisualDatasetEvent;
use App\Support\DatasetVisualRolesMetadata;
use Illuminate\Support\Facades\DB;

/**
 * Elimina únicamente filas marcadas con {@see DatasetVisualRolesMetadata::DATASET}.
 * No borra catálogos institucionales persistentes ni roles/permisos/menús.
 */
final class ResetDatasetVisualRolesService
{
    public function ejecutar(): void
    {
        DB::transaction(function (): void {
            VisualDatasetEvent::query()
                ->where('metadata->dataset', DatasetVisualRolesMetadata::DATASET)
                ->delete();

            IntegracionLog::query()
                ->where('metadata->dataset', DatasetVisualRolesMetadata::DATASET)
                ->delete();

            AuditoriaEvento::query()
                ->where('metadata->dataset', DatasetVisualRolesMetadata::DATASET)
                ->delete();

            $idsAlumnos = Alumno::withoutGlobalScopes()
                ->withTrashed()
                ->where('metadata->dataset', DatasetVisualRolesMetadata::DATASET)
                ->pluck('id')
                ->all();

            if ($idsAlumnos !== []) {
                SolicitudMatricula::query()->whereIn('alumno_id', $idsAlumnos)->delete();
            }

            SolicitudMatricula::query()
                ->where('metadata->dataset', DatasetVisualRolesMetadata::DATASET)
                ->delete();

            $idsDocs = DocumentoAcademico::query()
                ->withTrashed()
                ->where(function ($q) use ($idsAlumnos): void {
                    $q->where('metadata->dataset', DatasetVisualRolesMetadata::DATASET);
                    if ($idsAlumnos !== []) {
                        $q->orWhereIn('alumno_id', $idsAlumnos);
                    }
                })
                ->pluck('id')
                ->all();

            DocumentoObservacion::query()->whereIn('documento_academico_id', $idsDocs)->delete();
            DocumentoMateriaSnapshot::query()->whereIn('documento_academico_id', $idsDocs)->delete();
            IntegracionLog::query()->whereIn('documento_academico_id', $idsDocs)->delete();
            DocumentoVersion::query()->whereIn('documento_academico_id', $idsDocs)->delete();
            DocumentoPayload::query()->whereIn('documento_academico_id', $idsDocs)->delete();
            Folio::query()->whereIn('documento_academico_id', $idsDocs)->delete();
            UrlShortToken::query()->whereIn('documento_academico_id', $idsDocs)->delete();
            DocumentoFirma::query()->whereIn('documento_academico_id', $idsDocs)->delete();
            DocumentoFirmante::query()->whereIn('documento_academico_id', $idsDocs)->delete();
            DocumentoEstadoHistorial::query()->whereIn('documento_academico_id', $idsDocs)->delete();

            foreach (DocumentoAcademico::withTrashed()->whereIn('id', $idsDocs)->cursor() as $doc) {
                $doc->forceDelete();
            }

            $idsMatriculas = $idsAlumnos !== []
                ? Matricula::withoutGlobalScopes()
                    ->withTrashed()
                    ->whereIn('alumno_id', $idsAlumnos)
                    ->pluck('id')
                    ->all()
                : [];

            ImportacionHistoricaMaterias::query()
                ->where(function ($q) use ($idsMatriculas): void {
                    $q->where('metadata->dataset', DatasetVisualRolesMetadata::DATASET);
                    if ($idsMatriculas !== []) {
                        $q->orWhereIn('matricula_id', $idsMatriculas);
                    }
                })
                ->delete();

            MateriaCursada::withoutGlobalScopes()
                ->withTrashed()
                ->where(function ($q) use ($idsAlumnos, $idsMatriculas): void {
                    $q->where('metadata->dataset', DatasetVisualRolesMetadata::DATASET);
                    if ($idsAlumnos !== []) {
                        $q->orWhereIn('alumno_id', $idsAlumnos);
                    }
                    if ($idsMatriculas !== []) {
                        $q->orWhereIn('matricula_id', $idsMatriculas);
                    }
                })
                ->get()
                ->each(static fn (MateriaCursada $mc) => $mc->forceDelete());

            CargaAcademica::query()
                ->where(function ($q) use ($idsMatriculas): void {
                    $q->where('metadata->dataset', DatasetVisualRolesMetadata::DATASET);
                    if ($idsMatriculas !== []) {
                        $q->orWhereHas('inscripcionPeriodo', static fn ($ins) => $ins->whereIn('matricula_id', $idsMatriculas));
                    }
                })
                ->delete();

            InscripcionPeriodo::query()
                ->where(function ($q) use ($idsMatriculas): void {
                    $q->where('metadata->dataset', DatasetVisualRolesMetadata::DATASET);
                    if ($idsMatriculas !== []) {
                        $q->orWhereIn('matricula_id', $idsMatriculas);
                    }
                })
                ->delete();

            TrayectoriaAcademica::withoutGlobalScopes()
                ->withTrashed()
                ->where(function ($q) use ($idsAlumnos, $idsMatriculas): void {
                    $q->where('metadata->dataset', DatasetVisualRolesMetadata::DATASET);
                    if ($idsAlumnos !== []) {
                        $q->orWhereIn('alumno_id', $idsAlumnos);
                    }
                    if ($idsMatriculas !== []) {
                        $q->orWhereIn('matricula_id', $idsMatriculas);
                    }
                })
                ->get()
                ->each(static fn (TrayectoriaAcademica $t) => $t->forceDelete());

            Matricula::withoutGlobalScopes()
                ->withTrashed()
                ->where(function ($q) use ($idsAlumnos): void {
                    $q->where('metadata->dataset', DatasetVisualRolesMetadata::DATASET);
                    if ($idsAlumnos !== []) {
                        $q->orWhereIn('alumno_id', $idsAlumnos);
                    }
                })
                ->get()
                ->each(static fn (Matricula $m) => $m->forceDelete());

            Alumno::withoutGlobalScopes()
                ->withTrashed()
                ->where('metadata->dataset', DatasetVisualRolesMetadata::DATASET)
                ->get()
                ->each(static fn (Alumno $a) => $a->forceDelete());

            OfertaAcademica::query()
                ->where('metadata->dataset', DatasetVisualRolesMetadata::DATASET)
                ->delete();

            PeriodoEscolar::query()
                ->where('metadata->dataset', DatasetVisualRolesMetadata::DATASET)
                ->delete();

            CicloEscolar::query()
                ->where('metadata->dataset', DatasetVisualRolesMetadata::DATASET)
                ->delete();
        });
    }
}
