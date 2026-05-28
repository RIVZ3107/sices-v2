<?php

declare(strict_types=1);

return [

    /*
    | Servicio 34 SINCE/SEP — firma por urlshort + prod (multipart únicamente).
    */
    'firma' => [
        'enabled' => filter_var(env('SINCE_FIRMA_ENABLED', false), FILTER_VALIDATE_BOOL),

        'simulated' => filter_var(env('SINCE_FIRMA_SIMULATED', false), FILTER_VALIDATE_BOOL),

        'env' => env('SINCE_FIRMA_ENV', 'dev'),

        'prod_url' => env(
            'SINCE_FIRMA_PROD_URL',
            'http://10.15.10.34:9090/since-service/servicios/firma/certificado/normales/firma',
        ),

        'dev_url' => env(
            'SINCE_FIRMA_DEV_URL',
            'http://10.15.10.38:9090/since-service/servicios/firma/certificado/normales/firma',
        ),

        'timeout' => (int) env('SINCE_FIRMA_TIMEOUT', 120),

        'connect_timeout' => (int) env('SINCE_FIRMA_CONNECT_TIMEOUT', 10),

        'prod_flag' => (string) env('SINCE_FIRMA_PROD_FLAG', '1'),
    ],

    /*
    | since-títulos — timbrado SEP para título y grado (multipart urlshort + prod).
    */
    'titulos' => [
        'enabled' => filter_var(env('SINCE_TITULOS_ENABLED', env('SINCE_FIRMA_ENABLED', false)), FILTER_VALIDATE_BOOL),

        'simulated' => filter_var(env('SINCE_TITULOS_SIMULATED', env('SINCE_FIRMA_SIMULATED', false)), FILTER_VALIDATE_BOOL),

        'env' => env('SINCE_TITULOS_ENV', env('SINCE_FIRMA_ENV', 'dev')),

        'titulo_prod_url' => env(
            'SINCE_TITULOS_TITULO_PROD_URL',
            'http://10.15.10.34:9090/since-titulos/servicios/firma/titulo/firma',
        ),

        'titulo_dev_url' => env(
            'SINCE_TITULOS_TITULO_DEV_URL',
            'http://10.15.10.38:9090/since-titulos/servicios/firma/titulo/firma',
        ),

        'grado_prod_url' => env(
            'SINCE_TITULOS_GRADO_PROD_URL',
            'http://10.15.10.34:9090/since-titulos/servicios/firma/grado/firma',
        ),

        'grado_dev_url' => env(
            'SINCE_TITULOS_GRADO_DEV_URL',
            'http://10.15.10.38:9090/since-titulos/servicios/firma/grado/firma',
        ),

        'timeout' => (int) env('SINCE_TITULOS_TIMEOUT', env('SINCE_FIRMA_TIMEOUT', 120)),

        'connect_timeout' => (int) env('SINCE_TITULOS_CONNECT_TIMEOUT', env('SINCE_FIRMA_CONNECT_TIMEOUT', 10)),
    ],

    /*
    | UPN — firma local (estilo firma-bin) sin servicio 34.
    */
    'upn' => [
        'firma_local_enabled' => filter_var(env('SICES_UPN_FIRMA_LOCAL_ENABLED', true), FILTER_VALIDATE_BOOL),

        'generar_pdf_tras_firma' => filter_var(env('SICES_UPN_GENERAR_PDF_TRAS_FIRMA', true), FILTER_VALIDATE_BOOL),
    ],

];
