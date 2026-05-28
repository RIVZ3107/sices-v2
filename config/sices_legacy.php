<?php

declare(strict_types=1);

return [

    'enabled' => filter_var(env('SICES_LEGACY_ENABLED', false), FILTER_VALIDATE_BOOL),

    'connection' => env('SICES_LEGACY_CONNECTION', 'informix_sices'),

    'read_only' => filter_var(env('SICES_LEGACY_READ_ONLY', true), FILTER_VALIDATE_BOOL),

    'write_enabled' => filter_var(env('SICES_LEGACY_WRITE_ENABLED', false), FILTER_VALIDATE_BOOL),

    'shadow_enabled' => filter_var(env('SICES_LEGACY_SHADOW_ENABLED', false), FILTER_VALIDATE_BOOL),

    'writeback_enabled' => filter_var(env('SICES_LEGACY_WRITEBACK_ENABLED', false), FILTER_VALIDATE_BOOL),

    'timeout' => (int) env('SICES_LEGACY_TIMEOUT', 10),

    'encoding' => env('SICES_LEGACY_ENCODING', 'ISO-8859-1'),

    /*
    | URL base del SICES PHP legacy (solo enlaces de consulta; no modifica el sistema viejo).
    */
    'base_url' => env('SICES_LEGACY_BASE_URL', ''),

    'consulta_publica_sep_url' => env('SICES_LEGACY_CONSULTA_SEP_URL', 'https://www.seiem.gob.mx/certificados/index.php'),

    'tables' => [
        'certificado' => env('SICES_LEGACY_TABLE_CERT', 'e11superior_cert'),
        'materias' => env('SICES_LEGACY_TABLE_MATERIAS', 'e11materias_cert'),
        'instituciones' => env('SICES_LEGACY_TABLE_INSTITUCIONES', 'e11instituciones'),
    ],

    /*
    | Columnas Informix documentadas (esquema SICES normales). Ajustables por .env sin tocar código.
    */
    'columns' => [
        'certificado' => [
            'id' => env('SICES_LEGACY_COL_CERT_ID', 'id'),
            'curp' => env('SICES_LEGACY_COL_CURP', 'ocurp_completa'),
            'matricula' => env('SICES_LEGACY_COL_MATRICULA', 'omatricula_alumno'),
            'nombre' => env('SICES_LEGACY_COL_NOMBRE', 'onombre'),
            'primer_apellido' => env('SICES_LEGACY_COL_PRIMER_APELLIDO', 'oprimerapellido'),
            'segundo_apellido' => env('SICES_LEGACY_COL_SEGUNDO_APELLIDO', 'osegundoapellido'),
            'tipo_cert' => env('SICES_LEGACY_COL_TIPO_CERT', 'otipocert'),
            'ciclo' => env('SICES_LEGACY_COL_CICLO', 'ocicloescolar'),
            'url_short' => env('SICES_LEGACY_COL_URL_SHORT', 'ourl_short'),
            'folio_digital' => env('SICES_LEGACY_COL_FOLIO_DIGITAL', 'ofoliodigitalsep'),
            'situacion' => env('SICES_LEGACY_COL_SITUACION', 'osituac'),
            'status' => env('SICES_LEGACY_COL_STATUS', 'istatus'),
            'pdf' => env('SICES_LEGACY_COL_PDF', 'opdf'),
            'xml_local' => env('SICES_LEGACY_COL_XML_LOCAL', 'oxml'),
            'xml_sep' => env('SICES_LEGACY_COL_XML_SEP', 'oxml_sep'),
            'fecha_mod' => env('SICES_LEGACY_COL_FECHA_MOD', 'ofechamodificacion'),
            'cve_institucion' => env('SICES_LEGACY_COL_CVE_INST', 'rcve_institucion'),
            'cve_carrera' => env('SICES_LEGACY_COL_CVE_CARRERA', 'rcve_carrera'),
            'plan' => env('SICES_LEGACY_COL_PLAN', 'oplan_estudios'),
            'cadena_original' => env('SICES_LEGACY_COL_CADENA', 'ocadena_original'),
            'sello_certificado' => env('SICES_LEGACY_COL_SELLO', 'osellocertficado'),
            'cct' => env('SICES_LEGACY_COL_CCT', 'occt'),
            'nombre_ct' => env('SICES_LEGACY_COL_NOMBRE_CT', 'onombre_ct'),
            'licenciatura' => env('SICES_LEGACY_COL_LICENCIATURA', 'olicenciatura'),
            'modalidad' => env('SICES_LEGACY_COL_MODALIDAD', 'omodalidad'),
            'tipo_cert_label' => env('SICES_LEGACY_COL_TIPO_CERT_LABEL', 'otipo_cert'),
            'cve_tipo_cert' => env('SICES_LEGACY_COL_CVE_TIPO_CERT', 'rcve_tipo_cert'),
            'promedio' => env('SICES_LEGACY_COL_PROMEDIO', 'opromedio'),
            'creditos' => env('SICES_LEGACY_COL_CREDITOS', 'ocreditos'),
            'total_asignaturas' => env('SICES_LEGACY_COL_TOTAL_ASIG', 'ototalasignaturas'),
            'fecha_expedicion' => env('SICES_LEGACY_COL_FECHA_EXP', 'ofechaexpedicion'),
            'estado_inicial' => env('SICES_LEGACY_COL_ESTADO_INICIAL', 'osituac'),
        ],
        'materias' => [
            'matricula' => env('SICES_LEGACY_COL_MAT_MATRICULA', 'omatricula_alumno'),
            'curp' => env('SICES_LEGACY_COL_MAT_CURP', 'ocurp_completa'),
            'ciclo' => env('SICES_LEGACY_COL_MAT_CICLO', 'ocicloescolar_materia'),
            'tipo_cert' => env('SICES_LEGACY_COL_MAT_TIPO', 'otipocert_materia'),
            'clave' => env('SICES_LEGACY_COL_MAT_CLAVE', 'oclave_materia'),
            'nombre' => env('SICES_LEGACY_COL_MAT_NOMBRE', 'onombre_materia'),
            'calificacion' => env('SICES_LEGACY_COL_MAT_CALIF', 'ocalificacionfinal_materia'),
            'semestre' => env('SICES_LEGACY_COL_MAT_SEM', 'osemestre_materia'),
            'periodo' => env('SICES_LEGACY_COL_MAT_PERIODO', 'operiodo'),
            'url_short_materia' => env('SICES_LEGACY_COL_MAT_URL_SHORT', 'ourl_short_materia'),
        ],
        'instituciones' => [
            'cve_institucion' => env('SICES_LEGACY_COL_INST_CVE', 'rcve_institucion'),
            'cve_carrera' => env('SICES_LEGACY_COL_INST_CARRERA', 'rcve_carrera'),
            'nombre' => env('SICES_LEGACY_COL_INST_NOMBRE', 'onombre_institucion'),
            'cct' => env('SICES_LEGACY_COL_INST_CCT', 'occt'),
            'plan_cat' => env('SICES_LEGACY_COL_INST_PLAN', 'oplan_estudios_cat'),
        ],
    ],

];
