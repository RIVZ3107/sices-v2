<?php

declare(strict_types=1);

namespace Tests\Support\SicesLegacy;

use App\Data\SicesLegacy\SicesLegacyCertificadoData;
use Illuminate\Support\Collection;

/**
 * Respuestas controladas para tests (sin Informix ni red).
 */
final class SicesLegacyTestDoubles
{
    /**
     * @return array<string, mixed>
     */
    public static function healthOk(bool $reachable = true): array
    {
        return [
            'enabled' => true,
            'read_only' => true,
            'connection' => 'informix_sices',
            'reachable' => $reachable,
            'message' => $reachable
                ? 'Conexión simulada operativa (test).'
                : 'Conexión simulada no disponible (test).',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function healthDisabled(): array
    {
        return [
            'enabled' => false,
            'read_only' => true,
            'connection' => 'informix_sices',
            'reachable' => false,
            'message' => 'SICES legacy deshabilitado (SICES_LEGACY_ENABLED=false).',
        ];
    }

    public static function certificadoTimbrado(
        string $curp = 'LEGACY000000HDF00003',
        string $urlShort = 'abc123url',
        string $folio = 'FOLIO-DIG-SEP-001',
    ): SicesLegacyCertificadoData {
        return new SicesLegacyCertificadoData(
            idSices: 99,
            curp: $curp,
            matricula: 'MAT-LEG-01',
            nombreCompleto: 'Alumno Legacy',
            tipoCertificado: 'T',
            cicloEscolar: '2025-2026',
            urlShort: $urlShort,
            folioDigitalSep: $folio,
            osituac: 'F',
            istatus: '1',
            opdf: 1,
            tieneXmlLocal: true,
            tieneXmlSep: true,
            fechaModificacion: '2026-05-01',
            institucion: 'Escuela Normal',
            cct: '09DCC0001A',
            carrera: 'LIC',
            planEstudios: '2020',
        );
    }

    public static function certificadoPorCurp(): SicesLegacyCertificadoData
    {
        return new SicesLegacyCertificadoData(
            idSices: 10,
            curp: 'CURPLEG000000HDF00099',
            matricula: 'M99',
            nombreCompleto: 'Ejemplo CURP',
            tipoCertificado: 'T',
            cicloEscolar: '2024-2025',
            urlShort: 'urlshort99',
            folioDigitalSep: 'FOL-DIG-99',
            osituac: 'F',
            istatus: null,
            opdf: 1,
            tieneXmlLocal: false,
            tieneXmlSep: true,
            fechaModificacion: null,
            institucion: null,
            cct: null,
            carrera: null,
            planEstudios: null,
        );
    }

    public static function certificadoPorUrlShort(): SicesLegacyCertificadoData
    {
        return new SicesLegacyCertificadoData(
            idSices: 11,
            curp: 'CURPLEG000000HDF00100',
            matricula: 'M100',
            nombreCompleto: 'Ejemplo URL',
            tipoCertificado: 'P',
            cicloEscolar: '2023-2024',
            urlShort: 'tokenUrlShort100',
            folioDigitalSep: null,
            osituac: null,
            istatus: null,
            opdf: 0,
            tieneXmlLocal: false,
            tieneXmlSep: false,
            fechaModificacion: null,
            institucion: null,
            cct: null,
            carrera: null,
            planEstudios: null,
        );
    }

    /**
     * @return Collection<int, SicesLegacyCertificadoData>
     */
    public static function certificadosNoEncontrados(): Collection
    {
        return collect();
    }

    /**
     * @return Collection<int, SicesLegacyCertificadoData>
     */
    public static function certificadosEncontrados(SicesLegacyCertificadoData ...$items): Collection
    {
        return collect($items);
    }
}
