<?php

declare(strict_types=1);

return [

    'enabled' => filter_var(env('CONTROL_ESCOLAR_ENABLED', false), FILTER_VALIDATE_BOOL),

    'connection' => env('CONTROL_ESCOLAR_CONNECTION', 'control_escolar'),

    'driver' => env('CONTROL_ESCOLAR_DRIVER', 'mysql'),

    'read_only' => filter_var(env('CONTROL_ESCOLAR_READ_ONLY', true), FILTER_VALIDATE_BOOL),

    'timeout' => (int) env('CONTROL_ESCOLAR_TIMEOUT', 10),

    'encoding' => env('CONTROL_ESCOLAR_ENCODING', 'UTF-8'),

];
