<?php

declare(strict_types=1);

namespace App\Support\Demo;

use App\Models\Alumno;
use App\Models\CargaAcademica;
use App\Models\CicloEscolar;
use App\Models\DocumentoAcademico;
use App\Models\DocumentoObservacion;
use App\Models\InscripcionPeriodo;
use App\Models\Materia;
use App\Models\MateriaCursada;
use App\Models\Matricula;
use App\Models\OfertaAcademica;
use App\Models\PlanEstudio;
use App\Models\PlanMateria;
use App\Models\ProgramaEstudio;
use App\Models\TrayectoriaAcademica;
use App\Models\User;
use App\Services\ControlEscolar\ResetDemoControlEscolarService;
use Illuminate\Database\Eloquent\Builder;

/**
 * Identificación centralizada de registros claramente demo/sintéticos.
 */
final class DemoDataScope
{
    /** @var list<string> */
    public const CLAVES_PROGRAMA_DEMO = ResetDemoControlEscolarService::PROGRAMAS_DEMO_CLAVES;

    /** @var list<string> */
    public const CLAVES_PLAN_DEMO = ResetDemoControlEscolarService::PLANES_DEMO_CLAVES;

    /** @var list<string> */
    public const CLAVES_CICLO_DEMO = ResetDemoControlEscolarService::CICLOS_DEMO_CLAVES;

    public static function origenDemo(): string
    {
        return ResetDemoControlEscolarService::ORIGEN;
    }

    public function queryUsuariosDemo(): Builder
    {
        return User::query()->where(function (Builder $q): void {
            $q->where('email', 'like', '%@sices.local')
                ->orWhere('email', 'like', '%.dataset@sices.local');
        });
    }

    public function queryAlumnosDemo(): Builder
    {
        return Alumno::withoutGlobalScopes()->withTrashed()->where(function (Builder $q): void {
            $q->where('metadata->origen', self::origenDemo())
                ->orWhere('metadata->demo_dataset', ResetDemoControlEscolarService::DATASET)
                ->orWhere('nombre', 'DemoSynthetic');
        });
    }

    public function idsAlumnosDemo(): array
    {
        return $this->queryAlumnosDemo()->pluck('id')->map(static fn ($id) => (int) $id)->all();
    }

    public function queryMatriculasDemo(): Builder
    {
        $idsAlumnos = $this->idsAlumnosDemo();

        return Matricula::withoutGlobalScopes()->withTrashed()->where(function (Builder $q) use ($idsAlumnos): void {
            $q->where('metadata->origen', self::origenDemo());
            if ($idsAlumnos !== []) {
                $q->orWhereIn('alumno_id', $idsAlumnos);
            }
        });
    }

    public function idsMatriculasDemo(): array
    {
        return $this->queryMatriculasDemo()->pluck('id')->map(static fn ($id) => (int) $id)->all();
    }

    public function queryDocumentosDemo(): Builder
    {
        $idsAlumnos = $this->idsAlumnosDemo();

        return DocumentoAcademico::withTrashed()->where(function (Builder $q) use ($idsAlumnos): void {
            $q->where('metadata->origen', self::origenDemo());
            if ($idsAlumnos !== []) {
                $q->orWhereIn('alumno_id', $idsAlumnos);
            }
        });
    }

    public function idsDocumentosDemo(): array
    {
        return $this->queryDocumentosDemo()->pluck('id')->map(static fn ($id) => (int) $id)->all();
    }

    public function queryObservacionesDemo(): Builder
    {
        $idsDocs = $this->idsDocumentosDemo();

        return DocumentoObservacion::query()->where(function (Builder $q) use ($idsDocs): void {
            $q->where('metadata->origen', self::origenDemo());
            if ($idsDocs !== []) {
                $q->orWhereIn('documento_academico_id', $idsDocs);
            }
        });
    }

    public function queryMateriasCursadasDemo(): Builder
    {
        $idsAlumnos = $this->idsAlumnosDemo();

        return MateriaCursada::withoutGlobalScopes()->withTrashed()->where(function (Builder $q) use ($idsAlumnos): void {
            $q->where('metadata->origen', self::origenDemo());
            if ($idsAlumnos !== []) {
                $q->orWhereIn('alumno_id', $idsAlumnos);
            }
        });
    }

    public function queryCargasAcademicasDemo(): Builder
    {
        $idsMat = $this->idsMatriculasDemo();

        return CargaAcademica::query()->where(function (Builder $q) use ($idsMat): void {
            $q->where('metadata->origen', self::origenDemo());
            if ($idsMat !== []) {
                $q->orWhereHas('inscripcionPeriodo', static fn (Builder $ins) => $ins->whereIn('matricula_id', $idsMat));
            }
        });
    }

    public function queryInscripcionesDemo(): Builder
    {
        $idsMat = $this->idsMatriculasDemo();

        return InscripcionPeriodo::query()->where(function (Builder $q) use ($idsMat): void {
            $q->where('metadata->origen', self::origenDemo());
            if ($idsMat !== []) {
                $q->orWhereIn('matricula_id', $idsMat);
            }
        });
    }

    public function queryTrayectoriasDemo(): Builder
    {
        $idsAlumnos = $this->idsAlumnosDemo();
        $idsMat = $this->idsMatriculasDemo();

        return TrayectoriaAcademica::withoutGlobalScopes()->withTrashed()->where(function (Builder $q) use ($idsAlumnos, $idsMat): void {
            $q->where('metadata->origen', self::origenDemo());
            if ($idsAlumnos !== []) {
                $q->orWhereIn('alumno_id', $idsAlumnos);
            }
            if ($idsMat !== []) {
                $q->orWhereIn('matricula_id', $idsMat);
            }
        });
    }

    public function queryProgramasDemo(): Builder
    {
        return ProgramaEstudio::query()->where(function (Builder $q): void {
            $q->whereIn('clave', self::CLAVES_PROGRAMA_DEMO)
                ->orWhere('clave', 'like', 'SXCE-DEMO-%')
                ->orWhere('metadata->origen', self::origenDemo())
                ->orWhereRaw('LOWER(nombre) LIKE ?', ['%demo%']);
        });
    }

    public function queryPlanesDemo(): Builder
    {
        return PlanEstudio::query()->where(function (Builder $q): void {
            $q->whereIn('clave', self::CLAVES_PLAN_DEMO)
                ->orWhere('clave', 'like', 'SXCE-DEMO-%')
                ->orWhere('metadata->origen', self::origenDemo())
                ->orWhereRaw('LOWER(nombre) LIKE ?', ['%plan demo%']);
        });
    }

    public function queryCiclosDemo(): Builder
    {
        return CicloEscolar::query()->where(function (Builder $q): void {
            $q->whereIn('clave', self::CLAVES_CICLO_DEMO)
                ->orWhere('clave', 'like', 'SXCE-DEMO-%')
                ->orWhere('metadata->origen', self::origenDemo())
                ->orWhereRaw('LOWER(nombre) LIKE ?', ['%ciclo demo%']);
        });
    }

    public function queryOfertasDemo(): Builder
    {
        return OfertaAcademica::query()->where(function (Builder $q): void {
            $q->where('metadata->origen', self::origenDemo())
                ->orWhere('clave', 'like', 'SXCE-DEMO-%');
        });
    }

    public function queryMateriasDemo(): Builder
    {
        $planIds = $this->queryPlanesDemo()->pluck('id')->all();

        return Materia::query()->where(function (Builder $q) use ($planIds): void {
            $q->where('metadata->origen', self::origenDemo())
                ->orWhereRaw('LOWER(nombre) LIKE ?', ['%(demo)%'])
                ->orWhereRaw('LOWER(nombre) LIKE ?', ['%sintétic%'])
                ->orWhereRaw('LOWER(nombre) LIKE ?', ['%sintetic%']);
            if ($planIds !== []) {
                $q->orWhereIn('plan_estudio_id', $planIds);
            }
        });
    }

    public function queryPlanMateriasDemo(): Builder
    {
        $planIds = $this->queryPlanesDemo()->pluck('id')->all();
        if ($planIds === []) {
            return PlanMateria::query()->whereRaw('1 = 0');
        }

        return PlanMateria::query()->whereIn('plan_estudio_id', $planIds);
    }

    /**
     * @return array<string, int>
     */
    public function conteos(): array
    {
        return [
            'usuarios_demo' => $this->queryUsuariosDemo()->count(),
            'alumnos_demo' => $this->queryAlumnosDemo()->count(),
            'matriculas_demo' => $this->queryMatriculasDemo()->count(),
            'materias_demo' => $this->queryMateriasDemo()->count(),
            'plan_materias_demo' => $this->queryPlanMateriasDemo()->count(),
            'materias_cursadas_demo' => $this->queryMateriasCursadasDemo()->count(),
            'cargas_academicas_demo' => $this->queryCargasAcademicasDemo()->count(),
            'inscripciones_demo' => $this->queryInscripcionesDemo()->count(),
            'trayectorias_demo' => $this->queryTrayectoriasDemo()->count(),
            'documentos_academicos_demo' => $this->queryDocumentosDemo()->count(),
            'observaciones_demo' => $this->queryObservacionesDemo()->count(),
            'ciclos_demo' => $this->queryCiclosDemo()->count(),
            'programas_demo' => $this->queryProgramasDemo()->count(),
            'planes_demo' => $this->queryPlanesDemo()->count(),
            'ofertas_demo' => $this->queryOfertasDemo()->count(),
        ];
    }
}
