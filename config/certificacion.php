<?php

declare(strict_types=1);

return [

    /*
    |--------------------------------------------------------------------------
    | Umbral interno de acreditación (no es norma SEP)
    |--------------------------------------------------------------------------
    |
    | Placeholder configurable vía entorno para decisiones operativas de
    | consolidación de trayectoria (materias acreditadas vs no acreditadas).
    | Debe sustituirse/ajustarse cuando exista tabla de equivalencias oficial.
    |
    */
    'calificacion_aprobatoria_minima' => (float) env('CERT_CALIF_MIN', 6.0),

    /*
    |--------------------------------------------------------------------------
    | UPN — matrícula (sin patrón oficial inventado)
    |--------------------------------------------------------------------------
    |
    | Solo si la institución define generación automática y una expresión
    | explícita; si no, prevalece captura manual con unicidad global SICES.
    |
    */
    'upn' => [
        'generar_matricula_automatica' => filter_var(
            env('UPN_GENERAR_MATRICULA_AUTOMATICA', false),
            FILTER_VALIDATE_BOOL,
        ),
        /** Regex sin delimitadores PHP; vacío = sin generador configurado. */
        'patron_matricula_regex' => env('UPN_PATRON_MATRICULA_REGEX', ''),
    ],

    /*
    | Firma SEP/SINCE — servicio 34 (multipart urlshort + prod únicamente).
    */
    'sep_firma' => [
        'enabled' => filter_var(env('SEP_FIRMA_ENABLED', false), FILTER_VALIDATE_BOOL),
        'simulada' => filter_var(env('SEP_FIRMA_SIMULADA', true), FILTER_VALIDATE_BOOL),
        'endpoint' => env('SINCE_FIRMA_URL', env('SEP_FIRMA_ENDPOINT', '')),
        'timeout' => (int) env('SEP_FIRMA_TIMEOUT', 30),
        'produccion' => filter_var(env('SINCE_FIRMA_PROD', false), FILTER_VALIDATE_BOOL),
        'use_bridge' => filter_var(env('SEP_FIRMA_USE_BRIDGE', false), FILTER_VALIDATE_BOOL),
    ],

];
