<?php

use App\Enums\Certificacion\EstadoCadena;
use App\Enums\Certificacion\EstadoFirma;
use App\Enums\Certificacion\EstadoPdf;
use App\Enums\Certificacion\EstadoWorkflow;
use App\Enums\Certificacion\EstadoXml;
use App\Enums\Certificacion\MotorDocumento;
use App\Enums\Certificacion\ProveedorFirma;
use App\Enums\Certificacion\TipoCertificacion;
use App\Enums\Certificacion\TipoDocumentoAcademico;

return [

    /*
    |--------------------------------------------------------------------------
    | Estados por etapa del documento académico
    |--------------------------------------------------------------------------
    | Los valores coinciden con enums en App\Enums\Certificacion y migraciones.
    */

    'estados' => [
        'workflow' => EstadoWorkflow::values(),
        'cadena' => EstadoCadena::values(),
        'xml' => EstadoXml::values(),
        'firma' => EstadoFirma::values(),
        'pdf' => EstadoPdf::values(),
    ],

    'tipos_documento' => TipoDocumentoAcademico::values(),

    'tipos_certificacion' => TipoCertificacion::values(),

    'motores_documento' => MotorDocumento::values(),

    'proveedores_firma' => ProveedorFirma::values(),

    /*
    |--------------------------------------------------------------------------
    | Integración SEP / since-service (firma electrónica)
    |--------------------------------------------------------------------------
    | Por defecto la firma es simulada en local; no implica validez oficial SEP.
    | SinceFirmaClient no debe llamar HTTP real mientras simulada=true o enabled=false.
    */

    'sep_firma' => [
        'enabled' => filter_var(env('SEP_FIRMA_ENABLED', false), FILTER_VALIDATE_BOOLEAN),
        'simulada' => filter_var(env('SEP_FIRMA_SIMULADA', true), FILTER_VALIDATE_BOOLEAN),
        'endpoint' => env('SEP_FIRMA_ENDPOINT', ''),
        'timeout' => (int) env('SEP_FIRMA_TIMEOUT', 30),
    ],

    /*
    |--------------------------------------------------------------------------
    | PDF (Jasper u otros motores)
    |--------------------------------------------------------------------------
    | Por defecto se simula la generación; no produce PDF oficial SEP.
    */

    'pdf' => [
        'generation_enabled' => filter_var(env('PDF_GENERATION_ENABLED', true), FILTER_VALIDATE_BOOLEAN),
        'simulada' => filter_var(env('PDF_GENERATION_SIMULADA', true), FILTER_VALIDATE_BOOLEAN),
        'default_engine' => strtolower((string) env('PDF_DEFAULT_ENGINE', 'jasper')),
    ],

    /*
    |--------------------------------------------------------------------------
    | Jasper (compilación + render; pendiente JavaBridge en despliegue real)
    |--------------------------------------------------------------------------
    */

    'jasper' => [
        'enabled' => filter_var(env('JASPER_ENABLED', false), FILTER_VALIDATE_BOOLEAN),
        'base_path' => env('JASPER_BASE_PATH', ''),
        'timeout' => (int) env('JASPER_TIMEOUT', 60),
    ],

    /*
    |--------------------------------------------------------------------------
    | Firma simulada (desarrollo / pruebas internas)
    |--------------------------------------------------------------------------
    | Sin endpoints reales. El servicio backend sustituirá valores en producción.
    */

    'firma_simulada' => [
        'proveedor_default' => ProveedorFirma::SIMULADO->value,
        'endpoint' => env('SEP_FIRMA_ENDPOINT'),
        'metodo' => 'POST',
        'timeout_segundos' => (int) env('SEP_FIRMA_TIMEOUT', 30),
        'requiere_revision_senior' => true,
        'pendiente_contrato_since_service' => true,
    ],

    /*
    |--------------------------------------------------------------------------
    | Rutas placeholder para plantillas (storage relativo / build)
    |--------------------------------------------------------------------------
    */

    'rutas_placeholder' => [
        'jasper_certificado_normal' => 'templates/jasper/certificado_normal_v1.jasper',
        'jasper_certificado_upn' => 'templates/jasper/certificado_upn_v1.jasper',
        'jasper_titulo' => 'templates/jasper/titulo_normal_v1.jasper',
        'jasper_grado' => 'templates/jasper/grado_normal_v1.jasper',
        'pdf_genericos' => 'templates/pdf/',
    ],

];
