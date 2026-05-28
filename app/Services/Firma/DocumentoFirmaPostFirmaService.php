<?php

declare(strict_types=1);

namespace App\Services\Firma;

use App\Enums\Certificacion\EstadoFirma;
use App\Models\DocumentoAcademico;
use App\Services\Certificacion\AuditoriaService;
use App\Services\Certificacion\UrlShortTokenService;

/**
 * Emisión de token de consulta pública tras firma exitosa (url short).
 */
class DocumentoFirmaPostFirmaService
{
    public function __construct(
        protected UrlShortTokenService $urlShortTokens,
        protected AuditoriaService $auditoria,
    ) {}

    public function asegurarConsultaPublica(DocumentoAcademico $documento, ?int $usuarioId = null): ?string
    {
        $documento = $documento->fresh();
        if ($documento->estado_firma !== EstadoFirma::FIRMADO->value) {
            return null;
        }

        $tokenExistente = trim((string) ($documento->token_consulta_publica ?? ''));
        if ($tokenExistente !== '') {
            return $tokenExistente;
        }

        $meta = is_array($documento->metadata) ? $documento->metadata : [];
        $shadow = is_array($meta['legacy_shadow'] ?? null) ? $meta['legacy_shadow'] : [];
        $shadowToken = trim((string) ($shadow['url_short'] ?? ''));
        if ($shadowToken !== '') {
            $documento->forceFill(['token_consulta_publica' => $shadowToken])->save();

            return $shadowToken;
        }

        $registro = $this->urlShortTokens->emitirTokenConsulta($documento, null, [
            'emitido_tras_firma' => true,
            'canal' => 'post_firma_unificado',
        ]);

        $this->auditoria->registrar(
            evento: 'consulta_publica_token_emitido',
            entidadTipo: DocumentoAcademico::class,
            entidadId: $documento->id,
            payload: ['token' => $registro->token],
            userId: $usuarioId,
        );

        return $registro->token;
    }
}
