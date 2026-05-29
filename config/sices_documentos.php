<?php

declare(strict_types=1);

/**
 * Catálogo institucional de tipos de documentos académicos y reglas de procesamiento.
 * Sin ejecución de pipeline, firma, XML ni Informix — solo configuración y capacidades.
 */

$estadosFlujo = [
    'captura',
    'pendiente_certificador',
    'validado_certificador',
    'observado_certificador',
    'aprobado_es',
    'folio_asignado',
    'en_procesamiento',
    'pendiente_firma',
    'firmado',
    'finalizado',
    'incidencia_tecnica',
    'revision_sistemas',
    'reintentado',
    'rechazado',
    'cancelado',
];

$regla = static function (array $overrides): array {
    $base = [
        'requiere_payload_json' => true,
        'requiere_xml_sep' => false,
        'requiere_firma_sep' => false,
        'requiere_firma_local' => false,
        'requiere_folio_control' => false,
        'requiere_url_short' => false,
        'requiere_pdf' => true,
        'requiere_consulta_publica' => false,
        'permite_jasper_fallback' => false,
        'permite_editor_plantilla_futuro' => true,
        'permite_puente_informix' => false,
        'pipeline_key' => 'generico_pdf',
        'plantilla_key_default' => null,
    ];

    return array_merge($base, $overrides);
};

return [
    'subsistemas' => [
        'NORMAL' => [
            'key' => 'NORMAL',
            'label' => 'Escuelas Normales',
            'descripcion' => 'Subsistema de Escuelas Normales (certificados, títulos, constancias propias).',
        ],
        'UPN' => [
            'key' => 'UPN',
            'label' => 'Universidad Pedagógica Nacional',
            'descripcion' => 'Subsistema UPN — flujo documental separado de Normales.',
        ],
    ],

    'tipos_minimos' => [
        'certificado',
        'certificacion',
        'certificado_terminal',
        'certificacion_parcial',
        'titulo',
        'grado_academico',
        'constancia',
        'otro',
    ],

    'tipos' => [
        'certificado' => [
            'key' => 'certificado',
            'label' => 'Certificado',
            'descripcion' => 'Certificado de estudios o profesionista según normativa aplicable.',
            'subsistemas_permitidos' => ['NORMAL', 'UPN'],
            'estados_aplicables' => $estadosFlujo,
            'reglas' => [
                'NORMAL' => $regla([
                    'requiere_xml_sep' => true,
                    'requiere_firma_sep' => true,
                    'requiere_folio_control' => true,
                    'requiere_url_short' => true,
                    'requiere_consulta_publica' => true,
                    'permite_jasper_fallback' => true,
                    'permite_puente_informix' => true,
                    'pipeline_key' => 'normal_certificado_sep',
                    'plantilla_key_default' => 'normal.certificado',
                ]),
                'UPN' => $regla([
                    'requiere_firma_local' => true,
                    'requiere_folio_control' => true,
                    'requiere_url_short' => true,
                    'requiere_consulta_publica' => true,
                    'pipeline_key' => 'upn_certificado_pdf',
                    'plantilla_key_default' => 'upn.certificado',
                ]),
            ],
        ],

        'certificacion' => [
            'key' => 'certificacion',
            'label' => 'Certificación',
            'descripcion' => 'Certificación de estudios (documento de certificación académica).',
            'subsistemas_permitidos' => ['NORMAL', 'UPN'],
            'estados_aplicables' => $estadosFlujo,
            'reglas' => [
                'NORMAL' => $regla([
                    'requiere_xml_sep' => true,
                    'requiere_firma_sep' => true,
                    'requiere_folio_control' => true,
                    'requiere_url_short' => true,
                    'requiere_consulta_publica' => true,
                    'permite_jasper_fallback' => true,
                    'permite_puente_informix' => true,
                    'pipeline_key' => 'normal_certificacion_sep',
                    'plantilla_key_default' => 'normal.certificacion',
                ]),
                'UPN' => $regla([
                    'requiere_firma_local' => true,
                    'requiere_folio_control' => true,
                    'requiere_url_short' => true,
                    'pipeline_key' => 'upn_certificacion_pdf',
                    'plantilla_key_default' => 'upn.certificacion',
                ]),
            ],
        ],

        'certificado_terminal' => [
            'key' => 'certificado_terminal',
            'label' => 'Certificado terminal',
            'descripcion' => 'Certificado de terminación de estudios con trámite SEP cuando aplica.',
            'subsistemas_permitidos' => ['NORMAL'],
            'estados_aplicables' => $estadosFlujo,
            'reglas' => [
                'NORMAL' => $regla([
                    'requiere_xml_sep' => true,
                    'requiere_firma_sep' => true,
                    'requiere_folio_control' => true,
                    'requiere_url_short' => true,
                    'requiere_consulta_publica' => true,
                    'permite_jasper_fallback' => true,
                    'permite_puente_informix' => true,
                    'pipeline_key' => 'normal_certificado_terminal_sep',
                    'plantilla_key_default' => 'normal.certificado_terminal',
                ]),
            ],
        ],

        'certificacion_parcial' => [
            'key' => 'certificacion_parcial',
            'label' => 'Certificación parcial',
            'descripcion' => 'Certificación parcial de estudios realizados.',
            'subsistemas_permitidos' => ['NORMAL', 'UPN'],
            'estados_aplicables' => $estadosFlujo,
            'reglas' => [
                'NORMAL' => $regla([
                    'requiere_xml_sep' => true,
                    'requiere_firma_sep' => true,
                    'requiere_folio_control' => true,
                    'requiere_url_short' => true,
                    'requiere_consulta_publica' => true,
                    'permite_jasper_fallback' => true,
                    'permite_puente_informix' => true,
                    'pipeline_key' => 'normal_certificacion_parcial_sep',
                    'plantilla_key_default' => 'normal.certificacion_parcial',
                ]),
                'UPN' => $regla([
                    'requiere_firma_local' => true,
                    'requiere_folio_control' => true,
                    'pipeline_key' => 'upn_certificacion_parcial_pdf',
                    'plantilla_key_default' => 'upn.certificacion_parcial',
                ]),
            ],
        ],

        'titulo' => [
            'key' => 'titulo',
            'label' => 'Título',
            'descripcion' => 'Título profesional o de posgrado según normativa.',
            'subsistemas_permitidos' => ['NORMAL', 'UPN'],
            'estados_aplicables' => $estadosFlujo,
            'reglas' => [
                'NORMAL' => $regla([
                    'requiere_xml_sep' => true,
                    'requiere_firma_sep' => true,
                    'requiere_folio_control' => true,
                    'requiere_url_short' => true,
                    'requiere_consulta_publica' => true,
                    'permite_jasper_fallback' => true,
                    'permite_puente_informix' => true,
                    'pipeline_key' => 'normal_titulo_sep',
                    'plantilla_key_default' => 'normal.titulo',
                ]),
                'UPN' => $regla([
                    'requiere_xml_sep' => true,
                    'requiere_firma_sep' => true,
                    'requiere_folio_control' => true,
                    'requiere_url_short' => true,
                    'requiere_consulta_publica' => true,
                    'pipeline_key' => 'upn_titulo_sep',
                    'plantilla_key_default' => 'upn.titulo',
                ]),
            ],
        ],

        'grado_academico' => [
            'key' => 'grado_academico',
            'label' => 'Grado académico',
            'descripcion' => 'Documento de grado académico (licenciatura, maestría, etc.).',
            'subsistemas_permitidos' => ['NORMAL', 'UPN'],
            'estados_aplicables' => $estadosFlujo,
            'reglas' => [
                'NORMAL' => $regla([
                    'requiere_xml_sep' => true,
                    'requiere_firma_sep' => true,
                    'requiere_folio_control' => true,
                    'requiere_url_short' => true,
                    'requiere_consulta_publica' => true,
                    'permite_jasper_fallback' => true,
                    'permite_puente_informix' => true,
                    'pipeline_key' => 'normal_grado_academico_sep',
                    'plantilla_key_default' => 'normal.grado_academico',
                ]),
                'UPN' => $regla([
                    'requiere_firma_local' => true,
                    'requiere_folio_control' => true,
                    'requiere_url_short' => true,
                    'pipeline_key' => 'upn_grado_academico_pdf',
                    'plantilla_key_default' => 'upn.grado_academico',
                ]),
            ],
        ],

        'constancia' => [
            'key' => 'constancia',
            'label' => 'Constancia',
            'descripcion' => 'Constancia académica u otra constancia institucional.',
            'subsistemas_permitidos' => ['NORMAL', 'UPN'],
            'estados_aplicables' => $estadosFlujo,
            'reglas' => [
                'NORMAL' => $regla([
                    'requiere_firma_local' => true,
                    'requiere_folio_control' => true,
                    'requiere_url_short' => false,
                    'requiere_consulta_publica' => false,
                    'permite_jasper_fallback' => true,
                    'pipeline_key' => 'normal_constancia_pdf',
                    'plantilla_key_default' => 'normal.constancia',
                ]),
                'UPN' => $regla([
                    'requiere_firma_local' => true,
                    'requiere_folio_control' => true,
                    'requiere_url_short' => false,
                    'requiere_consulta_publica' => false,
                    'permite_jasper_fallback' => false,
                    'permite_puente_informix' => false,
                    'pipeline_key' => 'upn_constancia_pdf',
                    'plantilla_key_default' => 'upn.constancia',
                ]),
            ],
        ],

        'otro' => [
            'key' => 'otro',
            'label' => 'Otro documento académico',
            'descripcion' => 'Tipo genérico para documentos no catalogados aún de forma específica.',
            'subsistemas_permitidos' => ['NORMAL', 'UPN'],
            'estados_aplicables' => $estadosFlujo,
            'reglas' => [
                'NORMAL' => $regla([
                    'requiere_folio_control' => true,
                    'permite_jasper_fallback' => true,
                    'pipeline_key' => 'normal_otro_pdf',
                    'plantilla_key_default' => 'normal.otro',
                ]),
                'UPN' => $regla([
                    'requiere_folio_control' => true,
                    'pipeline_key' => 'upn_otro_pdf',
                    'plantilla_key_default' => 'upn.otro',
                ]),
            ],
        ],
    ],
];
