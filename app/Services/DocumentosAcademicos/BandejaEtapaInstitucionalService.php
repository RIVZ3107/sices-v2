<?php

declare(strict_types=1);

namespace App\Services\DocumentosAcademicos;

use App\Enums\Certificacion\EstadoFirma;
use App\Enums\Certificacion\EstadoWorkflow;
use App\Enums\DocumentosAcademicos\EtapaInstitucionalDocumento;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

/**
 * Filtros de bandeja y listados por etapa institucional (metadata.etapa_institucional + fallback legacy).
 */
class BandejaEtapaInstitucionalService
{
    /** @var array<string, string> slug URL → etapa */
    private const ALIAS_BANDEJA = [
        'borradores' => 'solicitado_control_escolar',
        'por-enviar' => 'solicitado_control_escolar',
        'en-revision' => 'en_validacion_certificador',
        'pendientes-revision' => 'en_validacion_certificador',
        'aprobados' => 'aprobado_educacion_superior',
        'rechazados' => 'rechazado',
        'cancelados' => 'cancelado',
        'listos-para-firma' => 'pendiente_firma',
        'firmados' => 'firmado_timbrado',
        'errores-firma' => 'incidencia_tecnica',
        'pendientes-tecnicos' => 'incidencia_tecnica',
    ];

    public function resolverEtapaDesdeBandeja(string $bandeja): ?string
    {
        if ($bandeja === '') {
            return null;
        }

        if (isset(self::ALIAS_BANDEJA[$bandeja])) {
            return self::ALIAS_BANDEJA[$bandeja];
        }

        $etapa = str_replace('-', '_', $bandeja);

        return EtapaInstitucionalDocumento::tryFromLoose($etapa)?->value;
    }

    /**
     * @return list<string> slugs de bandeja API
     */
    public function bandejasPorRol(User $user): array
    {
        if ($user->hasAnyRole(['superadmin', 'admin'])) {
            return array_merge(
                array_keys(self::ALIAS_BANDEJA),
                $this->etapasInstitucionalesSlugs(),
            );
        }

        if ($user->hasRole('control_escolar_escuela')) {
            return [
                'solicitado-control-escolar',
                'observado-por-certificador',
                'en-validacion-certificador',
                'rechazados',
                'cancelados',
                'borradores',
                'en-revision',
            ];
        }

        if ($user->hasRole('responsable_certificacion_titulacion')) {
            return [
                'en-validacion-certificador',
                'observado-por-certificador',
                'validado-por-certificador',
                'en-revision',
                'pendientes-revision',
            ];
        }

        if ($user->hasRole('educacion_superior')) {
            return [
                'validado-por-certificador',
                'aprobado-educacion-superior',
                'folio-asignado',
                'en-procesamiento',
                'pendiente-firma',
                'firmado-timbrado',
                'finalizado',
                'incidencia-tecnica',
                'aprobados',
                'listos-para-firma',
            ];
        }

        if ($user->hasRole('sistemas')) {
            return [
                'incidencia-tecnica',
                'en-revision-sistemas',
                'reintentado',
                'errores-firma',
                'pendientes-tecnicos',
            ];
        }

        if ($user->hasRole('director_escuela')) {
            return ['por-enviar', 'en-revision', 'aprobados', 'rechazados'];
        }

        return ['aprobados'];
    }

    /**
     * @return list<string> valores etapa_institucional permitidos para listado por rol (sin bandeja concreta).
     */
    public function etapasPermitidasPorRol(User $user): array
    {
        if ($user->hasAnyRole(['superadmin', 'admin'])) {
            return EtapaInstitucionalDocumento::values();
        }

        if ($user->hasRole('control_escolar_escuela')) {
            return [
                EtapaInstitucionalDocumento::SOLICITADO_CONTROL_ESCOLAR->value,
                EtapaInstitucionalDocumento::OBSERVADO_POR_CERTIFICADOR->value,
                EtapaInstitucionalDocumento::EN_VALIDACION_CERTIFICADOR->value,
                EtapaInstitucionalDocumento::RECHAZADO->value,
                EtapaInstitucionalDocumento::CANCELADO->value,
            ];
        }

        if ($user->hasRole('responsable_certificacion_titulacion')) {
            return [
                EtapaInstitucionalDocumento::EN_VALIDACION_CERTIFICADOR->value,
                EtapaInstitucionalDocumento::OBSERVADO_POR_CERTIFICADOR->value,
                EtapaInstitucionalDocumento::VALIDADO_POR_CERTIFICADOR->value,
            ];
        }

        if ($user->hasRole('educacion_superior')) {
            return [
                EtapaInstitucionalDocumento::VALIDADO_POR_CERTIFICADOR->value,
                EtapaInstitucionalDocumento::APROBADO_EDUCACION_SUPERIOR->value,
                EtapaInstitucionalDocumento::FOLIO_ASIGNADO->value,
                EtapaInstitucionalDocumento::EN_PROCESAMIENTO->value,
                EtapaInstitucionalDocumento::PENDIENTE_FIRMA->value,
                EtapaInstitucionalDocumento::FIRMADO_TIMBRADO->value,
                EtapaInstitucionalDocumento::FINALIZADO->value,
                EtapaInstitucionalDocumento::INCIDENCIA_TECNICA->value,
            ];
        }

        if ($user->hasRole('sistemas')) {
            return [
                EtapaInstitucionalDocumento::INCIDENCIA_TECNICA->value,
                EtapaInstitucionalDocumento::EN_REVISION_SISTEMAS->value,
                EtapaInstitucionalDocumento::REINTENTADO->value,
            ];
        }

        return [EtapaInstitucionalDocumento::APROBADO_EDUCACION_SUPERIOR->value];
    }

    public function usuarioPuedeVerBandeja(User $user, string $bandeja): bool
    {
        return in_array($bandeja, $this->bandejasPorRol($user), true);
    }

    public function aplicarFiltroEtapaInstitucional(Builder $q, string $etapa): void
    {
        $caso = EtapaInstitucionalDocumento::tryFromLoose($etapa);
        if ($caso === null) {
            $q->whereRaw('1 = 0');

            return;
        }

        $q->where(function (Builder $outer) use ($caso): void {
            $outer->where('metadata->etapa_institucional', $caso->value)
                ->orWhere(function (Builder $legacy) use ($caso): void {
                    $this->aplicarFallbackLegacy($legacy, $caso);
                });
        });
    }

    public function aplicarAlcanceEtapasPorRol(Builder $q, User $user): void
    {
        if ($user->hasAnyRole(['superadmin', 'admin'])) {
            return;
        }

        $etapas = $this->etapasPermitidasPorRol($user);
        $q->where(function (Builder $outer) use ($etapas): void {
            foreach ($etapas as $etapa) {
                $outer->orWhere(function (Builder $sub) use ($etapa): void {
                    $this->aplicarFiltroEtapaInstitucional($sub, $etapa);
                });
            }
        });
    }

    /**
     * @return array<string, int> clave bandeja/slug → conteo
     */
    public function resumenInstitucionalPorRol(Builder $baseQuery, User $user): array
    {
        $out = [];
        foreach ($this->bandejasPorRol($user) as $slug) {
            $etapa = $this->resolverEtapaDesdeBandeja($slug);
            if ($etapa === null) {
                continue;
            }
            $q = clone $baseQuery;
            $this->aplicarFiltroEtapaInstitucional($q, $etapa);
            $out[$slug] = (int) $q->count();
        }

        return $out;
    }

    protected function aplicarFallbackLegacy(Builder $q, EtapaInstitucionalDocumento $etapa): void
    {
        match ($etapa) {
            EtapaInstitucionalDocumento::SOLICITADO_CONTROL_ESCOLAR => $q->whereIn('estado_workflow', [
                EstadoWorkflow::BORRADOR->value,
                EstadoWorkflow::PENDIENTE->value,
            ])->where(function (Builder $m): void {
                $m->whereNull('metadata->etapa_institucional')
                    ->orWhere('metadata->etapa_institucional', EtapaInstitucionalDocumento::SOLICITADO_CONTROL_ESCOLAR->value);
            }),

            EtapaInstitucionalDocumento::EN_VALIDACION_CERTIFICADOR => $q->whereIn('estado_workflow', [
                EstadoWorkflow::PENDIENTE->value,
                EstadoWorkflow::EN_REVISION->value,
            ])->where(function (Builder $m): void {
                $m->whereNull('metadata->etapa_institucional')
                    ->orWhereIn('metadata->etapa_institucional', [
                        EtapaInstitucionalDocumento::EN_VALIDACION_CERTIFICADOR->value,
                    ]);
            })->whereNotIn('metadata->etapa_institucional', [
                EtapaInstitucionalDocumento::VALIDADO_POR_CERTIFICADOR->value,
                EtapaInstitucionalDocumento::OBSERVADO_POR_CERTIFICADOR->value,
            ]),

            EtapaInstitucionalDocumento::OBSERVADO_POR_CERTIFICADOR => $q->where(
                'metadata->etapa_institucional',
                EtapaInstitucionalDocumento::OBSERVADO_POR_CERTIFICADOR->value,
            ),

            EtapaInstitucionalDocumento::VALIDADO_POR_CERTIFICADOR => $q->where(
                'metadata->etapa_institucional',
                EtapaInstitucionalDocumento::VALIDADO_POR_CERTIFICADOR->value,
            ),

            EtapaInstitucionalDocumento::APROBADO_EDUCACION_SUPERIOR => $q->where('estado_workflow', EstadoWorkflow::APROBADO->value)
                ->where(function (Builder $m): void {
                    $m->whereNull('metadata->etapa_institucional')
                        ->orWhere('metadata->etapa_institucional', EtapaInstitucionalDocumento::APROBADO_EDUCACION_SUPERIOR->value);
                })
                ->whereNull('folio_interno')
                ->where('metadata->listo_para_firma', '!=', true),

            EtapaInstitucionalDocumento::FOLIO_ASIGNADO => $q->where('estado_workflow', EstadoWorkflow::APROBADO->value)
                ->whereNotNull('folio_interno')
                ->where('metadata->listo_para_firma', '!=', true)
                ->where(function (Builder $m): void {
                    $m->where('metadata->etapa_institucional', EtapaInstitucionalDocumento::FOLIO_ASIGNADO->value)
                        ->orWhereNull('metadata->etapa_institucional');
                }),

            EtapaInstitucionalDocumento::EN_PROCESAMIENTO => $q->where(
                'metadata->etapa_institucional',
                EtapaInstitucionalDocumento::EN_PROCESAMIENTO->value,
            ),

            EtapaInstitucionalDocumento::PENDIENTE_FIRMA => $q->where('estado_workflow', EstadoWorkflow::APROBADO->value)
                ->where(function (Builder $m): void {
                    $m->where('metadata->etapa_institucional', EtapaInstitucionalDocumento::PENDIENTE_FIRMA->value)
                        ->orWhere('metadata->listo_para_firma', true);
                }),

            EtapaInstitucionalDocumento::FIRMADO_TIMBRADO => $q->where(function (Builder $m): void {
                $m->where('metadata->etapa_institucional', EtapaInstitucionalDocumento::FIRMADO_TIMBRADO->value)
                    ->orWhere('estado_firma', EstadoFirma::FIRMADO->value);
            }),

            EtapaInstitucionalDocumento::FINALIZADO => $q->where(function (Builder $m): void {
                $m->where('metadata->etapa_institucional', EtapaInstitucionalDocumento::FINALIZADO->value)
                    ->orWhere('metadata->documento_finalizado', true);
            }),

            EtapaInstitucionalDocumento::INCIDENCIA_TECNICA => $q->where(function (Builder $m): void {
                $m->where('metadata->etapa_institucional', EtapaInstitucionalDocumento::INCIDENCIA_TECNICA->value)
                    ->orWhere('estado_firma', EstadoFirma::ERROR_FIRMA->value);
            }),

            EtapaInstitucionalDocumento::EN_REVISION_SISTEMAS => $q->where(
                'metadata->etapa_institucional',
                EtapaInstitucionalDocumento::EN_REVISION_SISTEMAS->value,
            ),

            EtapaInstitucionalDocumento::REINTENTADO => $q->where(
                'metadata->etapa_institucional',
                EtapaInstitucionalDocumento::REINTENTADO->value,
            ),

            EtapaInstitucionalDocumento::RECHAZADO => $q->where('estado_workflow', EstadoWorkflow::RECHAZADO->value),

            EtapaInstitucionalDocumento::CANCELADO => $q->where('estado_workflow', EstadoWorkflow::CANCELADO->value),
        };
    }

    /**
     * @return list<string>
     */
    protected function etapasInstitucionalesSlugs(): array
    {
        return array_map(
            static fn (EtapaInstitucionalDocumento $e) => str_replace('_', '-', $e->value),
            EtapaInstitucionalDocumento::cases(),
        );
    }
}
