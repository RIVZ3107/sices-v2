<?php

declare(strict_types=1);

namespace App\Services\Certificacion;

use App\Models\DocumentoAcademico;
use App\Models\UrlShortToken;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class UrlShortTokenService
{
    /**
     * Genera un token público no predecible y lo asocia al documento (tabla dedicada + campo denormalizado).
     * Revoca tokens activos previos del mismo documento.
     *
     * @param  array<string, mixed>  $metadata
     */
    public function emitirTokenConsulta(
        DocumentoAcademico $documento,
        ?\DateTimeInterface $expiresAt = null,
        array $metadata = [],
    ): UrlShortToken {
        return DB::transaction(function () use ($documento, $expiresAt, $metadata) {
            $documento->refresh();

            UrlShortToken::query()
                ->where('documento_academico_id', $documento->id)
                ->where('estado', 'activo')
                ->update([
                    'estado' => 'revocado',
                    'revoked_at' => now(),
                ]);

            $token = $this->generarTokenUnico();

            $registro = UrlShortToken::query()->create([
                'documento_academico_id' => $documento->id,
                'token' => $token,
                'estado' => 'activo',
                'expires_at' => $expiresAt,
                'revoked_at' => null,
                'metadata' => array_merge($metadata, [
                    'emitido_por' => self::class,
                ]),
            ]);

            $documento->forceFill(['token_consulta_publica' => $token])->save();

            return $registro;
        });
    }

    private function generarTokenUnico(): string
    {
        do {
            $token = Str::upper(Str::random(12));
        } while (UrlShortToken::query()->where('token', $token)->exists());

        return $token;
    }
}
