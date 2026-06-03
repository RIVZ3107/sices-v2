/** Permisos por pantalla del módulo Certificación (permissions[], no roles). */

export const CERT_PERM = {
    /** Sin `documentos.ver` aislado: Control Escolar no entra al layout institucional completo. */
    module: [
        'certificacion.ver',
        'validaciones_normativas.ver',
        'certificacion.validar',
        'certificacion.autorizar_emision',
        'certificacion.enviar_a_proceso_tecnico',
        'preparar_documento_firma',
        'folios.asignar',
    ],
    dashboard: ['certificacion.ver', 'documentos.ver', 'ver_documentos'],
    solicitudes: [
        'documentos.ver',
        'ver_documentos',
        'certificacion.validar',
        'validaciones_normativas.ver',
        'certificacion.ver',
    ],
    documentosACertificar: [
        'documentos.ver',
        'ver_documentos',
        'certificacion.ver',
        'certificacion.validar',
        'certificacion.revisar',
    ],
    generacion: ['documentos.ver', 'ver_documentos', 'pdf.ver', 'certificacion.ver'],
    firmaElectronica: ['firma.ver', 'documentos.ver', 'ver_documentos', 'certificacion.ver'],
    /** Procesamiento automático desde Certificación / Educación Superior */
    procesarCertificacion: [
        'certificacion.procesar',
        'certificacion.enviar_a_proceso_tecnico',
        'preparar_documento_firma',
        'documentos.liberar_proceso_tecnico',
    ],
    firmarCertificacion: ['certificacion.firmar'],
    obtenerResultadoFinal: ['certificacion.obtener_resultado_final', 'pdf.ver', 'ver_pdf'],
    enviarIncidenciaSistemas: [
        'certificacion.enviar_incidencia_sistemas',
        'logs.ver',
        'integraciones.ver',
    ],
    /** Bandeja de incidencias y diagnóstico — solo Sistemas */
    procesoTecnico: [
        'generar_cadena',
        'cadena_original.generar',
        'generar_xml',
        'xml.generar',
        'firma.ver',
        'integraciones.ver',
        'sistemas.integraciones.ver',
    ],
    entrega: ['pdf.ver', 'consulta_publica.ver', 'documentos.ver', 'ver_documentos'],
    reportes: ['reportes.ver', 'certificacion.ver'],
    configuracion: [
        'configuracion.ver',
        'configuracion.configurar',
        'catalogos.configurar',
        'sistemas.integraciones.ver',
    ],
    notificaciones: ['notificaciones.ver', 'documentos.ver', 'ver_documentos'],
    /** @deprecated Usar procesarCertificacion */
    liberarProceso: [
        'certificacion.procesar',
        'documentos.liberar_proceso_tecnico',
        'preparar_documento_firma',
        'certificacion.enviar_a_proceso_tecnico',
    ],
    revision: [
        'ver_documentos',
        'documentos.ver',
        'certificacion.ver',
        'validaciones_normativas.ver',
    ],
};
