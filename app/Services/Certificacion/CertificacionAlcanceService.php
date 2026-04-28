<?php

declare(strict_types=1);

namespace App\Services\Certificacion;

use App\Models\DocumentoAcademico;
use App\Models\Institucion;
use App\Models\OfertaAcademica;
use App\Models\Sede;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

/**
 * Alcance territorial por asignaciones usuario ↔ región / institución / sede (Bloque 14).
 * Superadmin y admin quedan exentos de restricción espacial.
 */
class CertificacionAlcanceService
{
    public function exentaRestriccionTerritorial(User $user): bool
    {
        return $user->hasRole(['superadmin', 'admin']);
    }

    /**
     * Educación superior sin pivotes asignados opera a nivel estatal (sin filtro territorial).
     * Sistemas sin pivotes: sin filtro para operaciones técnicas globales.
     */
    public function alcanceTerritorialEstaVacio(User $user): bool
    {
        return $user->instituciones()->count() === 0
            && $user->sedes()->count() === 0
            && $user->regiones()->count() === 0;
    }

    public function documentoEnAlcance(User $user, DocumentoAcademico $documento): bool
    {
        if ($this->exentaRestriccionTerritorial($user)) {
            return true;
        }

        if ($documento->oferta_academica_id !== null) {
            return $this->ofertaEnAlcance($user, (int) $documento->oferta_academica_id);
        }

        return $this->contextoInstitucionalEnAlcance(
            $user,
            $documento->institucion_id,
            $documento->sede_id,
            $documento->region_id,
            null,
        );
    }

    public function ofertaEnAlcance(User $user, int $ofertaAcademicaId): bool
    {
        if ($this->exentaRestriccionTerritorial($user)) {
            return true;
        }

        $oferta = OfertaAcademica::query()->find($ofertaAcademicaId);
        if ($oferta === null) {
            return false;
        }

        $regionId = Institucion::query()->whereKey($oferta->institucion_id)->value('region_id');

        return $this->contextoInstitucionalEnAlcance(
            $user,
            $oferta->institucion_id,
            $oferta->sede_id,
            $regionId !== null ? (int) $regionId : null,
            $oferta->id,
        );
    }

    /**
     * @param  ?int  $ofertaId  Solo para depuración; el contexto real es institución/sede/región.
     */
    protected function contextoInstitucionalEnAlcance(
        User $user,
        ?int $institucionId,
        ?int $sedeId,
        ?int $regionId,
        ?int $ofertaId,
    ): bool {
        $idsInst = $user->instituciones()->pluck('instituciones.id');
        $idsSedes = $user->sedes()->pluck('sedes.id');
        $idsRegiones = $user->regiones()->pluck('regiones.id');

        if ($idsInst->isEmpty() && $idsSedes->isEmpty() && $idsRegiones->isEmpty()) {
            if ($user->hasRole('educacion_superior')) {
                return true;
            }
            if ($user->hasRole('sistemas')) {
                return true;
            }

            return false;
        }

        if ($institucionId !== null && $idsInst->contains($institucionId)) {
            return true;
        }

        if ($sedeId !== null && $idsSedes->contains($sedeId)) {
            return true;
        }

        if ($regionId !== null && $idsRegiones->contains($regionId)) {
            return true;
        }

        if ($institucionId !== null && $idsRegiones->isNotEmpty()) {
            $inst = Institucion::query()->find($institucionId);
            if ($inst !== null && $inst->region_id !== null && $idsRegiones->contains($inst->region_id)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Restringe consultas de instituciones al alcance del usuario (sin efecto si está exento).
     */
    public function aplicarAlcanceInstituciones(Builder $query, User $user): void
    {
        if ($this->exentaRestriccionTerritorial($user)) {
            return;
        }

        if ($this->alcanceTerritorialEstaVacio($user)) {
            if ($user->hasRole('educacion_superior') || $user->hasRole('sistemas')) {
                return;
            }
            $query->whereRaw('1 = 0');

            return;
        }

        $idsInst = $user->instituciones()->pluck('instituciones.id');
        $idsSedes = $user->sedes()->pluck('sedes.id');
        $idsRegiones = $user->regiones()->pluck('regiones.id');

        $query->where(function ($q) use ($idsInst, $idsSedes, $idsRegiones) {
            $q->whereRaw('0 = 1');
            if ($idsInst->isNotEmpty()) {
                $q->orWhereIn('id', $idsInst);
            }
            if ($idsSedes->isNotEmpty()) {
                $q->orWhereIn('id', function ($sub) use ($idsSedes) {
                    $sub->select('institucion_id')
                        ->from('sedes')
                        ->whereIn('id', $idsSedes)
                        ->whereNotNull('institucion_id');
                });
            }
            if ($idsRegiones->isNotEmpty()) {
                $q->orWhereIn('region_id', $idsRegiones);
            }
        });
    }

    public function aplicarAlcanceRegiones(Builder $query, User $user): void
    {
        if ($this->exentaRestriccionTerritorial($user)) {
            return;
        }

        if ($this->alcanceTerritorialEstaVacio($user)) {
            if ($user->hasRole('educacion_superior') || $user->hasRole('sistemas')) {
                return;
            }
            $query->whereRaw('1 = 0');

            return;
        }

        $idsRegiones = $user->regiones()->pluck('regiones.id');
        if ($idsRegiones->isNotEmpty()) {
            $query->whereIn('id', $idsRegiones);
        } else {
            $idsInst = $user->instituciones()->pluck('instituciones.id');
            if ($idsInst->isNotEmpty()) {
                $regionesDeInst = Institucion::query()
                    ->whereIn('id', $idsInst)
                    ->whereNotNull('region_id')
                    ->pluck('region_id');
                if ($regionesDeInst->isNotEmpty()) {
                    $query->whereIn('id', $regionesDeInst->unique());
                } else {
                    $query->whereRaw('1 = 0');
                }
            } else {
                $query->whereRaw('1 = 0');
            }
        }
    }

    public function aplicarAlcanceOfertasAcademicas(Builder $query, User $user): void
    {
        if ($this->exentaRestriccionTerritorial($user)) {
            return;
        }

        if ($this->alcanceTerritorialEstaVacio($user)) {
            if ($user->hasRole('educacion_superior') || $user->hasRole('sistemas')) {
                return;
            }
            $query->whereRaw('1 = 0');

            return;
        }

        $idsInst = $user->instituciones()->pluck('instituciones.id');
        $idsSedes = $user->sedes()->pluck('sedes.id');
        $idsRegiones = $user->regiones()->pluck('regiones.id');

        $query->where(function ($q) use ($idsInst, $idsSedes, $idsRegiones) {
            $q->whereRaw('0 = 1');
            if ($idsInst->isNotEmpty()) {
                $q->orWhereIn('institucion_id', $idsInst);
            }
            if ($idsSedes->isNotEmpty()) {
                $q->orWhereIn('sede_id', $idsSedes);
            }
            if ($idsRegiones->isNotEmpty()) {
                $q->orWhereIn('institucion_id', function ($sub) use ($idsRegiones) {
                    $sub->select('id')
                        ->from('instituciones')
                        ->whereIn('region_id', $idsRegiones);
                });
            }
        });
    }

    public function aplicarAlcanceDocumentosAcademicos(Builder $query, User $user): void
    {
        if ($this->exentaRestriccionTerritorial($user)) {
            return;
        }

        if ($this->alcanceTerritorialEstaVacio($user)) {
            if ($user->hasRole('educacion_superior') || $user->hasRole('sistemas')) {
                return;
            }
            $query->whereRaw('1 = 0');

            return;
        }

        $idsInst = $user->instituciones()->pluck('instituciones.id');
        $idsSedes = $user->sedes()->pluck('sedes.id');
        $idsRegiones = $user->regiones()->pluck('regiones.id');

        $query->where(function ($q) use ($idsInst, $idsSedes, $idsRegiones) {
            $q->whereRaw('0 = 1');
            if ($idsInst->isNotEmpty()) {
                $q->orWhereIn('institucion_id', $idsInst);
            }
            if ($idsSedes->isNotEmpty()) {
                $q->orWhereIn('sede_id', $idsSedes);
            }
            if ($idsRegiones->isNotEmpty()) {
                $q->orWhereIn('region_id', $idsRegiones);
            }
        });
    }
}
