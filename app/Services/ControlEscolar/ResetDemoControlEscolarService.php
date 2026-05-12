<?php

declare(strict_types=1);

namespace App\Services\ControlEscolar;

use App\Models\Alumno;
use App\Models\AuditoriaEvento;
use App\Models\CadenaOriginalGenerada;
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
use App\Models\Institucion;
use App\Models\Materia;
use App\Models\MateriaCursada;
use App\Models\Matricula;
use App\Models\Municipio;
use App\Models\OfertaAcademica;
use App\Models\PeriodoEscolar;
use App\Models\PlanEstudio;
use App\Models\PlanMateria;
use App\Models\ProgramaEstudio;
use App\Models\Sede;
use App\Models\SolicitudMatricula;
use App\Models\Subsistema;
use App\Models\TrayectoriaAcademica;
use App\Models\UrlShortToken;
use Illuminate\Support\Facades\DB;

/**
 * Reset idempotente de datos sintéticos Control Escolar y convención única de metadata (`origen` / `demo_dataset`).
 *
 * No sustituye políticas de negocio reales; solo etiqueta y elimina el universo demo.
 */
final class ResetDemoControlEscolarService
{
    public const ORIGEN = 'demo_control_escolar';

    public const DATASET = 'control_escolar_v1';

    /** @param  array<string, mixed>  $extra */
    public static function metadata(array $extra = []): array
    {
        return array_merge([
            'origen' => self::ORIGEN,
            'demo_dataset' => self::DATASET,
        ], $extra);
    }

    /** @var list<string> */
    public const PLANES_DEMO_CLAVES = [
        'SXCE-DEMO-PL-NORM-2022',
        'SXCE-DEMO-PL-UPN-2025',
    ];

    /** @var list<string> */
    public const PROGRAMAS_DEMO_CLAVES = [
        'SXCE-DEMO-PRO-NORM-LIC',
        'SXCE-DEMO-PRO-UPN-LIC',
    ];

    /** @var list<string> */
    public const CICLOS_DEMO_CLAVES = [
        'SXCE-DEMO-CICLO-2026',
    ];

    public static function marcaMetadata(): string
    {
        return self::ORIGEN;
    }

    public function ejecutar(): void
    {
        DB::transaction(function (): void {
            $idsAlumnosDemo = Alumno::withoutGlobalScopes()
                ->withTrashed()
                ->where('metadata->origen', self::marcaMetadata())
                ->pluck('id')->all();

            if (count($idsAlumnosDemo) > 0) {
                SolicitudMatricula::query()->whereIn('alumno_id', $idsAlumnosDemo)->delete();
            }

            $idsDocs = DocumentoAcademico::query()
                ->withTrashed()
                ->when(
                    count($idsAlumnosDemo) > 0,
                    static fn ($q) => $q->whereIn('alumno_id', $idsAlumnosDemo),
                    static fn ($q) => $q->whereRaw('1 = 0')
                )->pluck('id')->all();

            DocumentoObservacion::query()->whereIn('documento_academico_id', $idsDocs)->delete();
            DocumentoMateriaSnapshot::query()->whereIn('documento_academico_id', $idsDocs)->delete();

            IntegracionLog::query()->whereIn('documento_academico_id', $idsDocs)->delete();
            DocumentoVersion::query()->whereIn('documento_academico_id', $idsDocs)->delete();
            CadenaOriginalGenerada::query()->whereIn('documento_academico_id', $idsDocs)->delete();
            DocumentoPayload::query()->whereIn('documento_academico_id', $idsDocs)->delete();
            Folio::query()->whereIn('documento_academico_id', $idsDocs)->delete();
            UrlShortToken::query()->whereIn('documento_academico_id', $idsDocs)->delete();
            DocumentoFirma::query()->whereIn('documento_academico_id', $idsDocs)->delete();
            DocumentoFirmante::query()->whereIn('documento_academico_id', $idsDocs)->delete();
            DocumentoEstadoHistorial::query()->whereIn('documento_academico_id', $idsDocs)->delete();

            foreach (DocumentoAcademico::withTrashed()->whereIn('id', $idsDocs)->cursor() as $doc) {
                $doc->forceDelete();
            }

            $idsMatriculasDemo = count($idsAlumnosDemo) > 0
                ? Matricula::withoutGlobalScopes()
                    ->withTrashed()
                    ->whereIn('alumno_id', $idsAlumnosDemo)
                    ->pluck('id')->all()
                : [];

            ImportacionHistoricaMaterias::query()->where(static function ($q) use ($idsMatriculasDemo): void {
                $q->where('metadata->origen', ResetDemoControlEscolarService::marcaMetadata());
                if ($idsMatriculasDemo !== []) {
                    $q->orWhereIn('matricula_id', $idsMatriculasDemo);
                }
            })->delete();

            MateriaCursada::withoutGlobalScopes()
                ->withTrashed()
                ->where(static function ($q) use ($idsAlumnosDemo): void {
                    $q->where('metadata->origen', ResetDemoControlEscolarService::marcaMetadata());
                    if ($idsAlumnosDemo !== []) {
                        $q->orWhereIn('alumno_id', $idsAlumnosDemo);
                    }
                })
                ->get()
                ->each(static fn (MateriaCursada $mc) => $mc->forceDelete());

            CargaAcademica::query()->where(static function ($q) use ($idsMatriculasDemo): void {
                $q->where('metadata->origen', ResetDemoControlEscolarService::marcaMetadata());
                if ($idsMatriculasDemo !== []) {
                    $q->orWhereHas('inscripcionPeriodo', static fn ($ins) => $ins->whereIn('matricula_id', $idsMatriculasDemo));
                }
            })->delete();

            InscripcionPeriodo::query()->where(static function ($q) use ($idsMatriculasDemo): void {
                $q->where('metadata->origen', ResetDemoControlEscolarService::marcaMetadata());
                if ($idsMatriculasDemo !== []) {
                    $q->orWhereIn('matricula_id', $idsMatriculasDemo);
                }
            })->delete();

            TrayectoriaAcademica::withoutGlobalScopes()
                ->withTrashed()
                ->where(static function ($q) use ($idsAlumnosDemo, $idsMatriculasDemo): void {
                    $q->where('metadata->origen', ResetDemoControlEscolarService::marcaMetadata());
                    if ($idsAlumnosDemo !== []) {
                        $q->orWhereIn('alumno_id', $idsAlumnosDemo);
                    }
                    if ($idsMatriculasDemo !== []) {
                        $q->orWhereIn('matricula_id', $idsMatriculasDemo);
                    }
                })
                ->get()
                ->each(static fn (TrayectoriaAcademica $t) => $t->forceDelete());

            Matricula::withoutGlobalScopes()
                ->withTrashed()
                ->where(static function ($q) use ($idsAlumnosDemo): void {
                    $q->where('metadata->origen', ResetDemoControlEscolarService::marcaMetadata());
                    if ($idsAlumnosDemo !== []) {
                        $q->orWhereIn('alumno_id', $idsAlumnosDemo);
                    }
                })
                ->get()
                ->each(static fn (Matricula $m) => $m->forceDelete());

            Alumno::withoutGlobalScopes()
                ->withTrashed()
                ->where('metadata->origen', self::marcaMetadata())
                ->get()
                ->each(static fn (Alumno $a) => $a->forceDelete());

            AuditoriaEvento::query()->where('metadata->origen', self::marcaMetadata())->delete();

            OfertaAcademica::query()
                ->where('metadata->origen', self::marcaMetadata())
                ->delete();

            foreach (self::PLANES_DEMO_CLAVES as $clavePlan) {
                $plan = PlanEstudio::query()->where('clave', $clavePlan)->first();
                if ($plan === null) {
                    continue;
                }
                $programaId = $plan->programa_estudio_id;
                Materia::query()->where('plan_estudio_id', $plan->id)->delete();
                PlanMateria::query()->where('plan_estudio_id', $plan->id)->delete();
                $plan->delete();

                ProgramaEstudio::query()
                    ->whereKey($programaId)
                    ->whereIn('clave', self::PROGRAMAS_DEMO_CLAVES)
                    ->delete();
            }

            PeriodoEscolar::query()->where('metadata->origen', self::marcaMetadata())->delete();
            CicloEscolar::query()->whereIn('clave', self::CICLOS_DEMO_CLAVES)->delete();
        });
    }

    /**
     * Asegura que catálogo persistente no cambió después del reset demo.
     */
    public static function existeCatalogoPersistente(): bool
    {
        return Institucion::query()->exists()
            && Sede::query()->exists()
            && Subsistema::query()->exists()
            && Municipio::query()->exists();
    }
}
