<?php

declare(strict_types=1);

namespace App\Services\Certificacion;

use App\Enums\Certificacion\EstadoCadena;
use App\Enums\Certificacion\EstadoFirma;
use App\Enums\Certificacion\EstadoWorkflow;
use App\Enums\Certificacion\EstadoXml;
use App\Models\CadenaOriginalGenerada;
use App\Models\DocumentoAcademico;
use App\Models\DocumentoPayload;
use App\Models\DocumentoVersion;
use App\Models\UrlShortToken;
use App\Services\ControlEscolar\ControlEscolarDecDataValidator;
use Illuminate\Validation\ValidationException;

/**
 * Validación pre-flight antes de shadow Informix y servicio 34.
 * No usa Control Escolar en vivo: solo snapshot y artefactos congelados en SICES v2.
 */
class DocumentoPreflightValidator
{
    public function __construct(
        protected ControlEscolarDecDataValidator $decValidator,
    ) {}

    /**
     * @throws ValidationException
     */
    public function assertListoParaFirmaTecnica(DocumentoAcademico $documento): void
    {
        $documento->refresh();
        $errores = $this->collectErrors($documento);

        if ($errores !== []) {
            throw ValidationException::withMessages(['preflight' => $errores]);
        }
    }

    /**
     * @return list<string>
     */
    public function collectErrors(DocumentoAcademico $documento): array
    {
        $errores = [];

        if (! in_array($documento->estado_workflow, [
            EstadoWorkflow::APROBADO->value,
            'listo_para_firma',
        ], true)) {
            $errores[] = 'El documento debe estar aprobado o listo para firma.';
        }

        if (in_array($documento->estado_firma, [
            EstadoFirma::FIRMADO->value,
            EstadoFirma::FIRMANDO->value,
        ], true)) {
            $errores[] = 'El documento ya está en proceso de firma o firmado.';
        }

        if ($documento->estado_cadena !== EstadoCadena::GENERADA->value) {
            $errores[] = 'La cadena original debe estar generada.';
        }

        if ($documento->estado_xml !== EstadoXml::GENERADO->value) {
            $errores[] = 'El XML local debe estar generado.';
        }

        $errores = array_merge($errores, $this->decValidator->validarDocumento($documento));

        $payload = DocumentoPayload::query()
            ->where('documento_academico_id', $documento->id)
            ->orderByDesc('id')
            ->first();
        if ($payload === null || empty($payload->payload_json)) {
            $errores[] = 'Falta payload_json congelado.';
        } elseif ($payload->payload_hash !== null && $payload->payload_hash !== '') {
            $hashCalc = hash('sha256', json_encode($payload->payload_json, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
            if (! hash_equals($payload->payload_hash, $hashCalc)) {
                $errores[] = 'payload_hash no coincide con payload_json.';
            }
        }

        $cadena = CadenaOriginalGenerada::query()
            ->where('documento_academico_id', $documento->id)
            ->orderByDesc('version')
            ->first();
        if ($cadena === null || trim((string) $cadena->cadena_original) === '') {
            $errores[] = 'Falta cadena_original congelada.';
        } elseif ($cadena->cadena_hash !== null && $cadena->cadena_hash !== '') {
            $hashCadena = hash('sha256', (string) $cadena->cadena_original);
            if (! hash_equals($cadena->cadena_hash, $hashCadena)) {
                $errores[] = 'cadena_hash no coincide con cadena_original.';
            }
        }

        $xml = DocumentoVersion::query()
            ->where('documento_academico_id', $documento->id)
            ->where('tipo', 'XML_ORIGINAL')
            ->where('activo', true)
            ->orderByDesc('version')
            ->first();
        if ($xml === null || trim((string) $xml->contenido) === '') {
            $errores[] = 'Falta xml_local (versión XML_ORIGINAL activa).';
        } elseif ($xml->sha256 !== null && $xml->sha256 !== '') {
            $hashXml = hash('sha256', (string) $xml->contenido);
            if (! hash_equals($xml->sha256, $hashXml)) {
                $errores[] = 'xml_hash no coincide con contenido XML.';
            }
        }

        $meta = is_array($documento->metadata) ? $documento->metadata : [];
        if (empty($meta['sello_local']) && empty($meta['sello_local_base64'])) {
            $errores[] = 'Falta sello_local en metadata del documento.';
        }

        $token = $documento->token_consulta_publica
            ?? UrlShortToken::query()
                ->where('documento_academico_id', $documento->id)
                ->where('estado', 'activo')
                ->value('token');
        if ($token === null || trim((string) $token) === '') {
            $errores[] = 'Falta url_short / token de consulta pública.';
        }

        return $errores;
    }
}
