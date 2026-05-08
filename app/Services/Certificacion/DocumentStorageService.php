<?php

declare(strict_types=1);

namespace App\Services\Certificacion;

use App\Enums\Certificacion\DocumentoVersionTipo;
use App\Models\DocumentoAcademico;
use App\Models\DocumentoPayload;
use App\Models\DocumentoVersion;
use Illuminate\Support\Facades\DB;

/**
 * Persistencia versionada de payloads y artefactos documentales base (sin Jasper ni firma real).
 */
class DocumentStorageService
{
    /** @var list<string> */
    private const TIPOS_PAYLOAD = [
        'CERTIFICADO_XML',
        'CERTIFICADO_PDF',
        'TITULO_XML',
        'TITULO_PDF',
        'GRADO_XML',
        'GRADO_PDF',
    ];

    /**
     * @param  array<string, mixed>  $payloadJson
     */
    public function guardarPayloadVersionado(
        DocumentoAcademico $documento,
        string $tipo,
        array $payloadJson,
        ?int $createdBy = null,
        bool $desactivarAnteriores = true,
    ): DocumentoPayload {
        if (! in_array($tipo, self::TIPOS_PAYLOAD, true)) {
            throw new \InvalidArgumentException("Tipo de payload inválido: {$tipo}");
        }

        return DB::transaction(function () use ($documento, $tipo, $payloadJson, $createdBy, $desactivarAnteriores) {
            $documento->refresh();

            if ($desactivarAnteriores) {
                DocumentoPayload::query()
                    ->where('documento_academico_id', $documento->id)
                    ->where('tipo', $tipo)
                    ->where('activo', true)
                    ->update(['activo' => false]);
            }

            $max = (int) DocumentoPayload::query()
                ->where('documento_academico_id', $documento->id)
                ->where('tipo', $tipo)
                ->max('version');

            $version = $max + 1;
            $canon = $this->canonicalizar($payloadJson);
            $json = json_encode($canon, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            if ($json === false) {
                throw new \RuntimeException('No se pudo serializar el payload para hash.');
            }
            $hash = hash('sha256', $json);

            return DocumentoPayload::query()->create([
                'documento_academico_id' => $documento->id,
                'tipo' => $tipo,
                'version' => $version,
                'payload_json' => $payloadJson,
                'payload_hash' => $hash,
                'activo' => true,
                'created_by' => $createdBy,
            ]);
        });
    }

    /**
     * @param  array<string, mixed>  $atributos
     */
    public function registrarVersionDocumental(
        DocumentoAcademico $documento,
        string $tipo,
        array $atributos = [],
        ?int $createdBy = null,
        bool $desactivarAnteriores = true,
    ): DocumentoVersion {
        $tiposVersion = [
            'XML_ORIGINAL',
            'XML_SELLADO',
            'XML_FIRMADO_SEP',
            'PDF_OFICIAL',
            'QR',
            'EVIDENCIA',
            DocumentoVersionTipo::XML_DEC_LOCAL->value,
            DocumentoVersionTipo::XML_DEC_FIRMADO_RESPONSABLE->value,
            DocumentoVersionTipo::XML_DEC_TIMBRADO_SEP->value,
            DocumentoVersionTipo::PDF_REGENERADO->value,
            DocumentoVersionTipo::PAYLOAD_DEC->value,
            DocumentoVersionTipo::CADENA_ORIGINAL_DEC->value,
        ];
        if (! in_array($tipo, $tiposVersion, true)) {
            throw new \InvalidArgumentException("Tipo de versión documental inválido: {$tipo}");
        }

        return DB::transaction(function () use ($documento, $tipo, $atributos, $createdBy, $desactivarAnteriores) {
            $documento->refresh();

            if ($desactivarAnteriores) {
                DocumentoVersion::query()
                    ->where('documento_academico_id', $documento->id)
                    ->where('tipo', $tipo)
                    ->where('activo', true)
                    ->update(['activo' => false]);
            }

            $max = (int) DocumentoVersion::query()
                ->where('documento_academico_id', $documento->id)
                ->where('tipo', $tipo)
                ->max('version');

            $version = $max + 1;

            return DocumentoVersion::query()->create([
                'documento_academico_id' => $documento->id,
                'documento_payload_id' => $atributos['documento_payload_id'] ?? null,
                'cadena_original_generada_id' => $atributos['cadena_original_generada_id'] ?? null,
                'tipo' => $tipo,
                'spec_code' => $atributos['spec_code'] ?? null,
                'spec_version' => $atributos['spec_version'] ?? null,
                'version' => $version,
                'contenido' => $atributos['contenido'] ?? null,
                'storage_disk' => $atributos['storage_disk'] ?? null,
                'storage_path' => $atributos['storage_path'] ?? null,
                'sha256' => $atributos['sha256'] ?? null,
                'size_bytes' => $atributos['size_bytes'] ?? null,
                'activo' => true,
                'metadata' => $atributos['metadata'] ?? null,
                'created_by' => $createdBy ?? ($atributos['created_by'] ?? null),
                'generado_por' => $atributos['generado_por'] ?? ($createdBy ?? null),
                'generado_en' => $atributos['generado_en'] ?? now(),
            ]);
        });
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function canonicalizar(array $data): array
    {
        ksort($data);

        foreach ($data as $key => $value) {
            if (is_array($value)) {
                $data[$key] = $this->canonicalizar($value);
            }
        }

        return $data;
    }
}
