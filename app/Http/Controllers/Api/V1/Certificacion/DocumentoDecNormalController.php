<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Certificacion;

use App\Enums\Certificacion\DocumentoVersionTipo;
use App\Http\Controllers\Controller;
use App\Models\DocumentoAcademico;
use App\Services\Certificacion\DecNormal2025PipelineService;
use App\Support\Certificacion\Specs\DecNormal2025Spec;
use Illuminate\Http\JsonResponse;

class DocumentoDecNormalController extends Controller
{
    public function __construct(
        protected DecNormal2025PipelineService $pipeline,
    ) {}

    public function generarPayload(DocumentoAcademico $documento): JsonResponse
    {
        $this->authorize('view', $documento);
        abort_unless(auth()->user()?->can('generar_cadena'), 403);

        $payload = $this->pipeline->generarPayload($documento->fresh(), auth()->id());

        return response()->json([
            'data' => [
                'documento_id' => $documento->id,
                'spec_code' => DecNormal2025Spec::SPEC_CODE,
                'spec_version' => DecNormal2025Spec::SPEC_VERSION,
                'payload' => $payload,
                'estado_cadena' => $documento->fresh()->estado_cadena,
                'estado_xml' => $documento->fresh()->estado_xml,
            ],
        ]);
    }

    public function generarCadena(DocumentoAcademico $documento): JsonResponse
    {
        $this->authorize('view', $documento);
        abort_unless(auth()->user()?->can('generar_cadena'), 403);

        $cadena = $this->pipeline->generarCadena($documento->fresh(), auth()->id());

        return response()->json([
            'data' => [
                'documento_id' => $documento->id,
                'cadena_original' => $cadena,
                'estado_cadena' => $documento->fresh()->estado_cadena,
            ],
        ]);
    }

    public function generarXml(DocumentoAcademico $documento): JsonResponse
    {
        $this->authorize('view', $documento);
        abort_unless(auth()->user()?->can('generar_xml'), 403);

        $version = $this->pipeline->generarXml($documento->fresh(), auth()->id());

        return response()->json([
            'data' => [
                'documento_id' => $documento->id,
                'xml_version_id' => $version->id,
                'xml' => $version->contenido,
                'estado_xml' => $documento->fresh()->estado_xml,
            ],
        ]);
    }

    public function validarXml(DocumentoAcademico $documento): JsonResponse
    {
        $this->authorize('view', $documento);
        abort_unless(auth()->user()?->can('generar_xml'), 403);

        $resultado = $this->pipeline->validarUltimoXml($documento->fresh());

        return response()->json([
            'data' => [
                'documento_id' => $documento->id,
                'xsd' => DecNormal2025Spec::XSD,
                'ok' => $resultado['ok'],
                'errores' => $resultado['errores'],
                'estado_xml' => $documento->fresh()->estado_xml,
                'xml_version_id' => $resultado['xml_version_id'],
            ],
        ]);
    }

    public function errores(DocumentoAcademico $documento): JsonResponse
    {
        $this->authorize('view', $documento);
        abort_unless(auth()->user()?->can('ver_xml') || auth()->user()?->can('generar_xml'), 403);

        $xml = $this->pipeline->ultimaVersionActiva($documento, DocumentoVersionTipo::XML_DEC_LOCAL->value);
        $cadena = $this->pipeline->ultimaVersionActiva($documento, DocumentoVersionTipo::CADENA_ORIGINAL_DEC->value);

        return response()->json([
            'data' => [
                'documento_id' => $documento->id,
                'estado_cadena' => $documento->estado_cadena,
                'estado_xml' => $documento->estado_xml,
                'errores_xml' => $this->pipeline->erroresUltimoXml($documento),
                'cadena_original' => $cadena?->contenido,
                'xml' => $xml?->contenido,
            ],
        ]);
    }
}
