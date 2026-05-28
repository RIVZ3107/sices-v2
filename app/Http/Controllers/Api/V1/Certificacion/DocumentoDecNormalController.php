<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\V1\Certificacion;

use App\Enums\Certificacion\DocumentoVersionTipo;
use App\Http\Controllers\Controller;
use App\Models\DocumentoAcademico;
use App\Services\Certificacion\AuditoriaService;
use App\Services\Certificacion\DecNormal2025PipelineService;
use App\Services\Certificacion\DocumentoPreflightValidator;
use App\Support\Certificacion\Specs\DecNormal2025Spec;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DocumentoDecNormalController extends Controller
{
    public function __construct(
        protected DecNormal2025PipelineService $pipeline,
        protected DocumentoPreflightValidator $preflightValidator,
        protected AuditoriaService $auditoria,
    ) {}

    public function generarPayload(DocumentoAcademico $documento): JsonResponse
    {
        $this->authorize('view', $documento);
        abort_unless(auth()->user()?->can('generar_cadena'), 403);

        $payload = $this->pipeline->generarPayload($documento->fresh(), auth()->id());

        $this->auditoria->registrar(
            evento: 'documento_academico.payload_generado',
            entidadTipo: DocumentoAcademico::class,
            entidadId: $documento->id,
            payload: ['estado_cadena' => $documento->fresh()->estado_cadena, 'estado_xml' => $documento->fresh()->estado_xml],
            userId: auth()->id(),
        );

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

    public function generarCadena(Request $request, DocumentoAcademico $documento): JsonResponse
    {
        $this->authorize('generarCadena', $documento);

        $cadena = $this->pipeline->generarCadena($documento->fresh(), auth()->id());

        $this->auditoria->registrar(
            evento: 'documento_academico.cadena_generada',
            entidadTipo: DocumentoAcademico::class,
            entidadId: $documento->id,
            payload: ['estado_cadena' => $documento->fresh()->estado_cadena],
            userId: $request->user()?->id,
            ip: $request->ip(),
            userAgent: $request->userAgent(),
        );

        return response()->json([
            'data' => [
                'documento_id' => $documento->id,
                'cadena_original' => $cadena,
                'estado_cadena' => $documento->fresh()->estado_cadena,
            ],
        ]);
    }

    public function generarXml(Request $request, DocumentoAcademico $documento): JsonResponse
    {
        $this->authorize('generarXml', $documento);

        $version = $this->pipeline->generarXml($documento->fresh(), auth()->id());

        $this->auditoria->registrar(
            evento: 'documento_academico.xml_generado',
            entidadTipo: DocumentoAcademico::class,
            entidadId: $documento->id,
            payload: ['estado_xml' => $documento->fresh()->estado_xml, 'xml_version_id' => $version->id],
            userId: $request->user()?->id,
            ip: $request->ip(),
            userAgent: $request->userAgent(),
        );

        return response()->json([
            'data' => [
                'documento_id' => $documento->id,
                'xml_version_id' => $version->id,
                'xml' => $version->contenido,
                'estado_xml' => $documento->fresh()->estado_xml,
            ],
        ]);
    }

    public function validarXml(Request $request, DocumentoAcademico $documento): JsonResponse
    {
        $this->authorize('view', $documento);
        abort_unless(
            auth()->user()?->can('generar_xml')
            || auth()->user()?->can('xml.generar')
            || auth()->user()?->can('xml.validar'),
            403,
        );

        $resultado = $this->pipeline->validarUltimoXml($documento->fresh());

        $this->auditoria->registrar(
            evento: 'documento_academico.xml_validado',
            entidadTipo: DocumentoAcademico::class,
            entidadId: $documento->id,
            payload: ['ok' => $resultado['ok'], 'errores_count' => count($resultado['errores'] ?? [])],
            userId: $request->user()?->id,
            ip: $request->ip(),
            userAgent: $request->userAgent(),
        );

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

    public function preflight(Request $request, DocumentoAcademico $documento): JsonResponse
    {
        $this->authorize('view', $documento);
        abort_unless(
            auth()->user()?->can('xml.validar')
            || auth()->user()?->can('firma.preflight')
            || auth()->user()?->can('firma.ejecutar')
            || auth()->user()?->can('integraciones.ver')
            || auth()->user()?->can('sistemas.integraciones.ver'),
            403,
        );

        $errores = $this->preflightValidator->collectErrors($documento->fresh());
        $ok = $errores === [];

        $this->auditoria->registrar(
            evento: $ok ? 'documento_academico.preflight_ok' : 'documento_academico.preflight_con_errores',
            entidadTipo: DocumentoAcademico::class,
            entidadId: $documento->id,
            payload: [
                'ok' => $ok,
                'errores_count' => count($errores),
                'errores_resumen' => array_slice($errores, 0, 20),
            ],
            userId: $request->user()?->id,
            ip: $request->ip(),
            userAgent: $request->userAgent(),
        );

        return response()->json([
            'data' => [
                'documento_id' => $documento->id,
                'ok' => $ok,
                'estado' => $ok ? 'correcto' : 'con_errores',
                'errores' => $errores,
            ],
        ], $ok ? 200 : 422);
    }

    public function errores(DocumentoAcademico $documento): JsonResponse
    {
        $this->authorize('view', $documento);
        abort_unless(
            auth()->user()?->can('ver_xml')
            || auth()->user()?->can('xml.ver')
            || auth()->user()?->can('generar_xml')
            || auth()->user()?->can('xml.generar'),
            403,
        );

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
