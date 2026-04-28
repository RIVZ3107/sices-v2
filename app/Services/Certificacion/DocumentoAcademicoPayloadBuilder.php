<?php

declare(strict_types=1);

namespace App\Services\Certificacion;

use App\Models\DocumentoAcademico;
use InvalidArgumentException;

/**
 * Construye un JSON canónico de contexto para payloads versionados (no es cadena SEP ni XML definitivo).
 */
class DocumentoAcademicoPayloadBuilder
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
     * @return array<string, mixed>
     */
    public function construir(DocumentoAcademico $documento, string $tipo): array
    {
        if (! in_array($tipo, self::TIPOS_PAYLOAD, true)) {
            throw new InvalidArgumentException("Tipo de payload no soportado: {$tipo}");
        }

        $documento->loadMissing([
            'alumno',
            'matricula',
            'ofertaAcademica',
            'cicloEscolar',
            'subsistema',
            'region',
            'institucion',
            'sede',
        ]);

        return [
            'schema_version' => '1.0-placeholder',
            'tipo_payload' => $tipo,
            'generado_en' => now()->toIso8601String(),
            'documento_academico' => [
                'id' => $documento->id,
                'tipo_documento' => $documento->tipo_documento,
                'tipo_certificacion' => $documento->tipo_certificacion,
                'folio_interno' => $documento->folio_interno,
                'estado_workflow' => $documento->estado_workflow,
                'estado_cadena' => $documento->estado_cadena,
                'estado_xml' => $documento->estado_xml,
                'estado_firma' => $documento->estado_firma,
                'estado_pdf' => $documento->estado_pdf,
            ],
            'alumno' => $documento->alumno ? [
                'id' => $documento->alumno->id,
                'curp' => $documento->alumno->curp,
                'nombre_completo' => trim(implode(' ', array_filter([
                    $documento->alumno->nombre,
                    $documento->alumno->primer_apellido,
                    $documento->alumno->segundo_apellido,
                ]))),
            ] : null,
            'contexto_institucional' => [
                'subsistema_id' => $documento->subsistema_id,
                'region_id' => $documento->region_id,
                'institucion_id' => $documento->institucion_id,
                'sede_id' => $documento->sede_id,
                'ciclo_escolar_id' => $documento->ciclo_escolar_id,
                'oferta_academica_id' => $documento->oferta_academica_id,
                'matricula_id' => $documento->matricula_id,
            ],
            'metadata' => [
                'nota' => 'Payload base de dominio; cadena SEP y XML oficiales se integran en bloques posteriores.',
            ],
        ];
    }
}
