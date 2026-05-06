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

];
