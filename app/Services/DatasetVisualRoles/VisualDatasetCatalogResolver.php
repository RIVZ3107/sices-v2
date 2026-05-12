<?php

declare(strict_types=1);

namespace App\Services\DatasetVisualRoles;

use App\Models\Institucion;
use App\Models\ProgramaEstudio;
use App\Models\Sede;
use App\Models\Subsistema;
use Illuminate\Support\Collection;

final class VisualDatasetCatalogResolver
{
    /** @var list<array{name: string, patterns: list<string>}> */
    public const SEDES_PATRONES = [
        ['name' => 'U.P.N. UNIDAD 151 TOLUCA', 'patterns' => ['%151 TOLUCA%', '%UNIDAD 151%']],
        ['name' => 'REGIONAL ACAMBAY', 'patterns' => ['%REGIONAL ACAMBAY%']],
        ['name' => 'REGIONAL IXTLAHUACA', 'patterns' => ['%REGIONAL IXTLAHUACA%']],
        ['name' => 'REGIONAL JILOTEPEC', 'patterns' => ['%REGIONAL JILOTEPEC%']],
        ['name' => 'REGIONAL TEJUPILCO', 'patterns' => ['%REGIONAL TEJUPILCO%']],
        ['name' => 'U.P.N. UNIDAD 152 ATIZAPÁN', 'patterns' => ['%152 ATIZ%', '%152 ATIZAP%']],
        ['name' => 'REGIONAL TULTEPEC', 'patterns' => ['%REGIONAL TULTEPEC%']],
        ['name' => 'REGIONAL NEZAHUALCÓYOTL', 'patterns' => ['%REGIONAL NEZAHUALC%', '%REGIONAL NEZAHUALCO%']],
        ['name' => 'REGIONAL NICOLÁS ROMERO', 'patterns' => ['%REGIONAL NICOLÁS ROMERO%', '%REGIONAL NICOLAS ROMERO%']],
        ['name' => 'U.P.N. UNIDAD 153 ECATEPEC', 'patterns' => ['%153 ECATEPEC%', '%153 ECATE%']],
        ['name' => 'ESCUELA NORMAL SUPERIOR DEL VALLE DE TOLUCA', 'patterns' => ['%NORMAL SUPERIOR%DE TOLUCA%', '%VALLE DE TOLUCA%']],
        ['name' => 'ESCUELA NORMAL SUPERIOR DEL VALLE DE MÉXICO. NEZAHUALCÓYOTL', 'patterns' => ['%VALLE DE MÉXICO%NEZAHUAL%', '%VALLE DE MEXICO%NEZAHUAL%', '%NORMAL SUPERIOR%DE MÉXICO%']],
        ['name' => 'TLALNEPANTLA', 'patterns' => ['%TLALNEPANTLA%']],
        ['name' => 'ESCUELA NORMAL RURAL "LÁZARO CÁRDENAS DEL RÍO"', 'patterns' => ['%LÁZARO CÁRDENAS%', '%LAZARO CARDENAS%']],
    ];

    /** @var list<string> */
    public const INSTITUCIONES_PATRONES = [
        '%NORMAL SUPERIOR DEL VALLE DE TOLUCA%',
        '%NORMAL SUPERIOR DEL VALLE DE MÉXICO%',
        '%LÁZARO CÁRDENAS DEL RÍO%',
        '%LAZARO CARDENAS%',
        '%PEDAGÓGICA NACIONAL%151%TOLUCA%',
        '%PEDAGOGICA NACIONAL%151%TOLUCA%',
        '%PEDAGÓGICA NACIONAL%152%ATIZ%',
        '%PEDAGÓGICA NACIONAL%153%ECATEPEC%',
    ];

    /** @var list<string> fragmentos de nombre de programa (LIKE) */
    public const PROGRAMA_FRAGMENTOS = [
        'EDUCACIÓN PRIMARIA',
        'EDUCACIÓN PREESCOLAR',
        'PEDAGOGÍA',
        'INTERVENCIÓN EDUCATIVA',
        'LICENCIATURA EN EDUCACIÓN BÁSICA',
        'PSICOLOGÍA EDUCATIVA',
        'MATEMÁTICAS',
        'ENSEÑANZA Y APRENDIZAJE DEL ESPAÑOL',
        'ENSEÑANZA Y APRENDIZAJE DEL INGLÉS',
    ];

    /**
     * @return Collection<int, Sede>
     */
    public function sedesDesdeCatalogo(): Collection
    {
        $out = collect();
        foreach (self::SEDES_PATRONES as $def) {
            $sede = null;
            foreach ($def['patterns'] as $pat) {
                $sede = Sede::query()->where('nombre', 'like', $pat)->with('institucion.subsistema')->first();
                if ($sede !== null) {
                    break;
                }
            }
            if ($sede !== null && ! $out->pluck('id')->contains($sede->id)) {
                $out->push($sede);
            }
        }

        return $out;
    }

    /**
     * @return Collection<int, Institucion>
     */
    public function institucionesDesdeCatalogo(): Collection
    {
        $ids = collect();
        foreach (self::INSTITUCIONES_PATRONES as $pat) {
            Institucion::query()->where('nombre', 'like', $pat)->each(function (Institucion $i) use ($ids): void {
                if (! $ids->contains($i->id)) {
                    $ids->push($i->id);
                }
            });
        }

        return Institucion::query()->whereIn('id', $ids->all())->with('subsistema')->get();
    }

    /**
     * @return array<string, ProgramaEstudio>
     */
    public function programasPorClaveSubsistema(Subsistema $normal, Subsistema $upn): array
    {
        $pick = static function (Subsistema $sub): ?ProgramaEstudio {
            foreach (self::PROGRAMA_FRAGMENTOS as $frag) {
                $p = ProgramaEstudio::query()
                    ->where('subsistema_id', $sub->id)
                    ->where('nombre', 'like', '%'.$frag.'%')
                    ->where('activo', true)
                    ->orderBy('id')
                    ->first();
                if ($p !== null) {
                    return $p;
                }
            }

            return ProgramaEstudio::query()
                ->where('subsistema_id', $sub->id)
                ->where('activo', true)
                ->orderBy('id')
                ->first();
        };

        return [
            strtoupper((string) $normal->clave) => $pick($normal) ?? throw new \RuntimeException('No hay programa de catálogo para subsistema Normal.'),
            strtoupper((string) $upn->clave) => $pick($upn) ?? throw new \RuntimeException('No hay programa de catálogo para subsistema UPN.'),
        ];
    }
}
