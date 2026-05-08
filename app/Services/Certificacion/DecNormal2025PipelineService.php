<?php

declare(strict_types=1);

namespace App\Services\Certificacion;

use App\Enums\Certificacion\DocumentoVersionTipo;
use App\Enums\Certificacion\EstadoCadena;
use App\Enums\Certificacion\EstadoXml;
use App\Models\DocumentoAcademico;
use App\Models\DocumentoVersion;
use App\Support\Certificacion\Specs\DecNormal2025Spec;
use Illuminate\Support\Arr;

class DecNormal2025PipelineService
{
    public function __construct(
        protected DecNormal2025PayloadBuilder $payloadBuilder,
        protected CadenaOriginalDecNormal2025Builder $cadenaBuilder,
        protected XmlDecNormal2025Builder $xmlBuilder,
        protected ValidacionDecNormal2025Service $validacion,
        protected DocumentStorageService $storage,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function generarPayload(DocumentoAcademico $documento, ?int $actorId = null): array
    {
        $payload = $this->payloadBuilder->build($documento->fresh());

        $json = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT);
        $contenido = $json === false ? '{}' : $json;
        $this->storage->registrarVersionDocumental($documento, DocumentoVersionTipo::PAYLOAD_DEC->value, [
            'contenido' => $contenido,
            'sha256' => hash('sha256', $contenido),
            'size_bytes' => strlen($contenido),
            'spec_code' => DecNormal2025Spec::SPEC_CODE,
            'spec_version' => DecNormal2025Spec::SPEC_VERSION,
            'generado_por' => $actorId,
            'generado_en' => now(),
        ], $actorId);

        return $payload;
    }

    public function generarCadena(DocumentoAcademico $documento, ?int $actorId = null): string
    {
        $payload = $this->generarPayload($documento, $actorId);
        $cadena = $this->cadenaBuilder->build($payload);

        $this->storage->registrarVersionDocumental($documento, DocumentoVersionTipo::CADENA_ORIGINAL_DEC->value, [
            'contenido' => $cadena,
            'sha256' => hash('sha256', $cadena),
            'size_bytes' => strlen($cadena),
            'spec_code' => DecNormal2025Spec::SPEC_CODE,
            'spec_version' => DecNormal2025Spec::SPEC_VERSION,
            'generado_por' => $actorId,
            'generado_en' => now(),
        ], $actorId);

        $documento->forceFill(['estado_cadena' => EstadoCadena::GENERADA->value])->save();

        return $cadena;
    }

    public function generarXml(DocumentoAcademico $documento, ?int $actorId = null): DocumentoVersion
    {
        $payload = $this->generarPayload($documento, $actorId);
        $cadena = $this->cadenaBuilder->build($payload);

        $this->storage->registrarVersionDocumental($documento, DocumentoVersionTipo::CADENA_ORIGINAL_DEC->value, [
            'contenido' => $cadena,
            'sha256' => hash('sha256', $cadena),
            'size_bytes' => strlen($cadena),
            'spec_code' => DecNormal2025Spec::SPEC_CODE,
            'spec_version' => DecNormal2025Spec::SPEC_VERSION,
            'generado_por' => $actorId,
            'generado_en' => now(),
        ], $actorId);

        $versionXml = $this->xmlBuilder->generarYGuardar($documento->fresh(), $payload, $cadena, $actorId);

        $documento->forceFill([
            'estado_cadena' => EstadoCadena::GENERADA->value,
            'estado_xml' => EstadoXml::GENERADO->value,
        ])->save();

        return $versionXml->fresh();
    }

    /**
     * @return array{ok:bool,errores:list<string>,xml_version_id:int|null}
     */
    public function validarUltimoXml(DocumentoAcademico $documento): array
    {
        $version = $this->ultimaVersionActiva($documento, DocumentoVersionTipo::XML_DEC_LOCAL->value);
        if ($version === null || trim((string) $version->contenido) === '') {
            return [
                'ok' => false,
                'errores' => ['No existe XML_DEC_LOCAL activo para validar.'],
                'xml_version_id' => null,
            ];
        }

        $resultado = $this->validacion->validarXmlContraXsd((string) $version->contenido);

        $metadata = array_merge($version->metadata ?? [], [
            'xsd' => DecNormal2025Spec::XSD,
            'validacion_xsd' => [
                'ok' => $resultado['ok'],
                'errores' => $resultado['errores'],
                'validado_en' => now()->toIso8601String(),
            ],
        ]);
        $version->metadata = Arr::wrap($metadata);
        $version->save();

        $documento->forceFill([
            'estado_xml' => $resultado['ok'] ? EstadoXml::VALIDADO->value : EstadoXml::ERROR_XML->value,
        ])->save();

        return [
            'ok' => $resultado['ok'],
            'errores' => $resultado['errores'],
            'xml_version_id' => $version->id,
        ];
    }

    /**
     * @return list<string>
     */
    public function erroresUltimoXml(DocumentoAcademico $documento): array
    {
        $version = $this->ultimaVersionActiva($documento, DocumentoVersionTipo::XML_DEC_LOCAL->value);
        if ($version === null) {
            return ['No existe XML_DEC_LOCAL activo.'];
        }

        $errores = Arr::get($version->metadata ?? [], 'validacion_xsd.errores', []);

        return is_array($errores) ? array_values($errores) : [];
    }

    public function ultimaVersionActiva(DocumentoAcademico $documento, string $tipo): ?DocumentoVersion
    {
        return DocumentoVersion::query()
            ->where('documento_academico_id', $documento->id)
            ->where('tipo', $tipo)
            ->where('activo', true)
            ->latest('id')
            ->first();
    }
}
