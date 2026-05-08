<?php

declare(strict_types=1);

namespace App\Services\Certificacion;

use App\Contracts\Certificacion\AcademicSubsistemaRulesContract;
use App\Exceptions\Certificacion\AcademicRulesNotConfiguredException;
use App\Models\DocumentoAcademico;
use App\Models\Matricula;
use App\Models\Subsistema;

final class AcademicRulesResolver
{
    public function forSubsistema(string $claveSubsistema): AcademicSubsistemaRulesContract
    {
        $clave = strtoupper(trim($claveSubsistema));
        if ($clave === '') {
            throw AcademicRulesNotConfiguredException::subsistema($claveSubsistema);
        }

        return match ($clave) {
            'NORMAL' => app(NormalesControlEscolar2022RulesService::class),
            'UPN' => app(UpnLicenciaturaRulesService::class),
            default => throw AcademicRulesNotConfiguredException::subsistema($claveSubsistema),
        };
    }

    public function forMatricula(Matricula $matricula): AcademicSubsistemaRulesContract
    {
        $matricula->loadMissing('ofertaAcademica.institucion.subsistema');
        $clave = strtoupper((string) ($matricula->ofertaAcademica?->institucion?->subsistema?->clave ?? ''));

        if ($clave === '') {
            throw AcademicRulesNotConfiguredException::sinSubsistemaEnEntidad(Matricula::class);
        }

        return $this->forSubsistema($clave);
    }

    public function forDocumento(DocumentoAcademico $documento): AcademicSubsistemaRulesContract
    {
        $documento->loadMissing('subsistema');
        $clave = strtoupper((string) ($documento->subsistema?->clave ?? ''));

        if ($clave === '') {
            throw AcademicRulesNotConfiguredException::sinSubsistemaEnEntidad(DocumentoAcademico::class);
        }

        return $this->forSubsistema($clave);
    }

    /**
     * Resolución por id de subsistema persistido (tabla subsistemas).
     */
    public function forSubsistemaId(int $subsistemaId): AcademicSubsistemaRulesContract
    {
        $clave = Subsistema::query()->whereKey($subsistemaId)->value('clave');
        if ($clave === null || $clave === '') {
            throw AcademicRulesNotConfiguredException::subsistema((string) $subsistemaId);
        }

        return $this->forSubsistema((string) $clave);
    }
}
