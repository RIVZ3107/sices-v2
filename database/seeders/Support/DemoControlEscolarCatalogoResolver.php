<?php

declare(strict_types=1);

namespace Database\Seeders\Support;

use App\Models\Sede;

/**
 * Resuelve sedes del catálogo legacy por los nombres operativos requeridos en demo.
 *
 * Si no encuentra una sede esperada, lanza mensaje orientativo sin crear registros nuevos.
 */
final class DemoControlEscolarCatalogoResolver
{
    /** @var list<array{name: string, patterns: string[]}> */
    private const REGLAS_BUSQUEDA = [
        ['name' => 'U.P.N. UNIDAD 151 TOLUCA', 'patterns' => ['%151 TOLUCA%', '%UNIDAD 151%']],
        ['name' => 'U.P.N. UNIDAD 152 ATIZAPÁN', 'patterns' => ['%152 ATIZ%', '%152 ATIZAP%']],
        ['name' => 'U.P.N. UNIDAD 153 ECATEPEC', 'patterns' => ['%153 ECATEPEC%', '%153 ECATE%']],
        ['name' => 'REGIONAL ACAMBAY', 'patterns' => ['%REGIONAL ACAMBAY%']],
        ['name' => 'REGIONAL IXTLAHUACA', 'patterns' => ['%REGIONAL IXTLAHUACA%']],
        ['name' => 'REGIONAL JILOTEPEC', 'patterns' => ['%REGIONAL JILOTEPEC%']],
        ['name' => 'REGIONAL TEJUPILCO', 'patterns' => ['%REGIONAL TEJUPILCO%']],
        ['name' => 'REGIONAL TULTEPEC', 'patterns' => ['%REGIONAL TULTEPEC%']],
        ['name' => 'REGIONAL NEZAHUALCÓYOTL', 'patterns' => ['%REGIONAL NEZAHUALC%', '%REGIONAL NEZAHUALCO%']],
        ['name' => 'REGIONAL NICOLÁS ROMERO', 'patterns' => ['%REGIONAL NICOLÁS ROMERO%', '%REGIONAL NICOLAS ROMERO%']],
        ['name' => 'ESCUELA NORMAL SUPERIOR DEL VALLE DE TOLUCA', 'patterns' => ['%NORMAL SUPERIOR%DE TOLUCA%', '%VALLE DE TOLUCA%']],
        ['name' => 'ESCUELA NORMAL SUPERIOR DEL VALLE DE MÉXICO', 'patterns' => ['%NORMAL SUPERIOR%DE MÉXICO%', '%NORMAL SUPERIOR%DE MEXICO%']],
        ['name' => 'ESCUELA NORMAL RURAL “LÁZARO CÁRDENAS DEL RÍO”', 'patterns' => ['%LÁZARO CÁRDENAS%', '%LAZARO CARDENAS%']],
    ];

    /** @return list<Sede> */
    public static function obtenerSedesObligatorias(): array
    {
        /** @var list<Sede> $out */
        $out = [];
        foreach (self::REGLAS_BUSQUEDA as $regla) {
            $sede = null;
            foreach ($regla['patterns'] as $like) {
                $sede = Sede::query()
                    ->where('activo', true)
                    ->where('nombre', 'like', $like)
                    ->orderByDesc('legacy_kcve_subsede')
                    ->first();
                if ($sede !== null) {
                    break;
                }
            }
            if ($sede === null) {
                throw new \RuntimeException(
                    'Demo Control Escolar: no existe en catálogo la sede requerida ['.$regla['name'].']. '.
                    'Ejecute los seeders de instituciones/subsedes legacy (sin crear sedes sintéticas en demo).'
                );
            }
            $out[] = $sede;
        }

        return $out;
    }
}
