<?php

declare(strict_types=1);

return [

    'enabled' => filter_var(env('INFORMIX_ENABLED', false), FILTER_VALIDATE_BOOL),

    'write_enabled' => filter_var(env('INFORMIX_WRITE_ENABLED', false), FILTER_VALIDATE_BOOL),

    'connection' => env('INFORMIX_CONNECTION', 'informix_legacy'),

    'timeout' => (int) env('INFORMIX_TIMEOUT', 15),

    /*
    | Tablas legacy esperadas por el servicio 34 (mapeo pendiente de esquema real).
    */
    'tables' => [
        'certificado' => env('INFORMIX_TABLE_CERT', 'e11superior_cert'),
        'materias_cert' => env('INFORMIX_TABLE_MATERIAS', 'e11materias_cert'),
    ],

];
