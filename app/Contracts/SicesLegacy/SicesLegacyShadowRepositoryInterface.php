<?php

declare(strict_types=1);

namespace App\Contracts\SicesLegacy;

use Illuminate\Validation\ValidationException;

interface SicesLegacyShadowRepositoryInterface
{
    /**
     * @return array<string, mixed>|null Fila legacy del certificado (claves lógicas).
     */
    public function findCertificadoByUrlShort(string $urlShort): ?array;

    /**
     * @param  array<string, mixed>  $row
     */
    public function isCertificadoTimbrado(array $row): bool;

    /**
     * Inserta o actualiza certificado legacy (idempotente por url_short).
     * No debe tocar filas timbradas.
     *
     * @param  array<string, mixed>  $data
     * @return string|int legacy_id
     *
     * @throws ValidationException si el registro está timbrado o bloqueado
     */
    public function upsertCertificado(array $data): string|int;

    /**
     * Sincroniza materias (idempotente por url_short + clave + periodo + semestre).
     *
     * @param  list<array<string, mixed>>  $materias
     */
    public function syncMaterias(string $urlShort, array $materias): int;

    /**
     * Post-firma SEP: actualiza solo campos de timbrado en legacy (si writeback habilitado).
     */
    public function writebackFirmaSep(
        string $urlShort,
        string $folioDigitalSep,
        ?string $xmlSep = null,
        ?string $selloSep = null,
    ): void;
}
