<?php

declare(strict_types=1);

namespace App\Support\Catalogos;

final class CatalogoAcademicoPresenter
{
    public const ORIGEN_SISEES = 'import_sisees_legacy';

    public const ETIQUETA_TRAZABILIDAD = 'Trazabilidad disponible';

    /** @var list<string> */
    private const CAMPOS_ETIQUETA = [
        'nombre', 'region', 'subsistema', 'institucion', 'programa', 'plan', 'sede',
        'nivel', 'nombre_materia', 'nombre_corto', 'modalidad', 'programa_clave',
    ];

    public static function esImportadoSisees(?array $metadata): bool
    {
        if ($metadata === null || $metadata === []) {
            return false;
        }

        $origin = $metadata['origin'] ?? $metadata['origen'] ?? null;

        return $origin === self::ORIGEN_SISEES;
    }

    public static function normalizarRegion(?string $nombre, ?string $clave): ?string
    {
        $combinado = trim((string) ($nombre ?? $clave ?? ''));
        if ($combinado === '') {
            return null;
        }

        $lower = mb_strtolower($combinado, 'UTF-8');

        if (str_contains($lower, 'normal') && (str_contains($lower, 'legacy') || str_contains($lower, 'import'))) {
            return 'Educación Normal';
        }

        if (str_contains($lower, 'upn') && (str_contains($lower, 'legacy') || str_contains($lower, 'import'))) {
            return 'Universidad Pedagógica Nacional';
        }

        if (str_contains($lower, 'importación') || str_contains($lower, 'importacion') || str_contains($lower, 'sisees')) {
            return null;
        }

        $limpio = self::limpiarTextoInstitucional($combinado, '');

        return $limpio !== '' && $limpio !== '—' ? $limpio : null;
    }

    public static function limpiarTextoInstitucional(?string $value, string $fallback = '—'): string
    {
        if ($value === null) {
            return $fallback;
        }

        $texto = trim($value);
        if ($texto === '') {
            return $fallback;
        }

        $exactos = [
            'REGIÓN NORMAL LEGACY' => 'Educación Normal',
            'REGIÓN UPN LEGACY' => 'Universidad Pedagógica Nacional',
            'Región importación SISEES' => 'Sin región asignada',
            'Catálogo maestro materias SISEES' => 'Catálogo maestro de materias',
        ];

        foreach ($exactos as $origen => $destino) {
            if (strcasecmp($texto, $origen) === 0) {
                return $destino;
            }
        }

        $lower = mb_strtolower($texto, 'UTF-8');

        if (preg_match('/regi[oó]n\s+normal\s+legacy/u', $lower)) {
            return 'Educación Normal';
        }

        if (preg_match('/regi[oó]n\s+upn\s+legacy/u', $lower)) {
            return 'Universidad Pedagógica Nacional';
        }

        if (preg_match('/importaci[oó]n/u', $lower) || str_contains($lower, 'sisees')) {
            return $fallback;
        }

        if (preg_match('/\blegacy\b/u', $lower)) {
            $sinLegacy = preg_replace('/\s*legacy\s*/iu', ' ', $texto) ?? $texto;
            $sinLegacy = preg_replace('/\s+/u', ' ', trim($sinLegacy));
            if ($sinLegacy !== '') {
                return $sinLegacy;
            }

            return $fallback;
        }

        return $texto;
    }

    /**
     * @param  array<string, mixed>  $row
     * @return array<string, mixed>
     */
    public static function enriquecer(array $row, ?array $metadata, bool $modoTecnico): array
    {
        $row = self::limpiarFilasInstitucionales($row);
        $importado = self::esImportadoSisees($metadata);

        if ($modoTecnico) {
            $row['trazabilidad_disponible'] = $importado;
            $row['etiqueta_origen_visible'] = $importado ? self::ETIQUETA_TRAZABILIDAD : null;
            if ($metadata !== null) {
                $row['informacion_tecnica'] = $metadata;
            }
        } else {
            $row['etiqueta_origen_visible'] = null;
        }

        return $row;
    }

    /**
     * @param  array<string, mixed>  $plan
     * @return array<string, mixed>
     */
    public static function enriquecerPlanResumen(array $plan, ?array $metadata, bool $modoTecnico): array
    {
        if (isset($plan['nombre']) && is_string($plan['nombre'])) {
            $plan['nombre'] = self::limpiarTextoInstitucional($plan['nombre']);
        }
        if (isset($plan['programa']) && is_string($plan['programa'])) {
            $plan['programa'] = self::limpiarTextoInstitucional($plan['programa']);
        }

        unset($plan['importado_sisees']);

        if ($modoTecnico && self::esImportadoSisees($metadata)) {
            $plan['trazabilidad_disponible'] = true;
        }

        return $plan;
    }

    /**
     * @param  array<string, array<string, int>>  $resumen
     * @return array<string, array<string, int>>
     */
    public static function sanitizarResumen(array $resumen, bool $modoTecnico): array
    {
        if ($modoTecnico) {
            return $resumen;
        }

        foreach ($resumen as $key => $item) {
            unset($resumen[$key]['importados_sisees']);
        }

        return $resumen;
    }

    public static function estatusLabel(bool $activo): string
    {
        return $activo ? 'activo' : 'inactivo';
    }

    /**
     * @return array{data: list<array<string, mixed>>, meta: array<string, int|null>}
     */
    public static function respuestaPaginada(mixed $paginator, callable $mapper): array
    {
        return [
            'data' => collect($paginator->items())->map($mapper)->values()->all(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'last_page' => $paginator->lastPage(),
            ],
        ];
    }

    /**
     * @param  array<string, mixed>  $row
     * @return array<string, mixed>
     */
    private static function limpiarFilasInstitucionales(array $row): array
    {
        foreach (self::CAMPOS_ETIQUETA as $key) {
            if (! isset($row[$key]) || ! is_string($row[$key])) {
                continue;
            }

            if ($key === 'region') {
                $row[$key] = self::normalizarRegion($row[$key], null) ?? '—';

                continue;
            }

            $row[$key] = self::limpiarTextoInstitucional($row[$key]);
        }

        if (isset($row['clave']) && is_string($row['clave'])) {
            $clave = $row['clave'];
            if (preg_match('/^(LEGACY|SISEES|SINCLAVE)-/i', $clave)) {
                // Mantener clave operativa sin prefijo técnico visible cuando aplique
                $row['clave'] = preg_replace('/^(LEGACY|SISEES)-/i', '', $clave) ?? $clave;
            }
        }

        return $row;
    }
}
