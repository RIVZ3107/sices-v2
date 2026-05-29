import { userCanAny } from './userPermissions';

/**
 * Permisos funcionales de Educación Superior (certificación).
 * No incluir permisos técnicos crudos (cadena, XML, firma.ejecutar).
 */
export const ES_CERT_FUNCIONAL = {
    procesar: [
        'certificacion.procesar',
        'certificacion.enviar_a_proceso_tecnico',
        'preparar_documento_firma',
        'documentos.liberar_proceso_tecnico',
    ],
    firmar: ['certificacion.firmar'],
    obtenerResultadoFinal: ['certificacion.obtener_resultado_final', 'pdf.ver', 'ver_pdf'],
    enviarIncidenciaSistemas: [
        'certificacion.enviar_incidencia_sistemas',
        'logs.ver',
        'integraciones.ver',
    ],
};

/** Permisos permitidos — Educación Superior / supervisión certificación */
export const ES_CERT_PERM = {
    ver: ['documentos.ver', 'ver_documentos', 'certificacion.ver'],
    validar: [
        'certificacion.validar',
        'validaciones_normativas.aprobar',
        'documentos.aprobar',
        'documentos.aprobar_institucionalmente',
    ],
    observar: [
        'observaciones.crear',
        'documentos.observar',
        'documentos.rechazar',
        'documentos.rechazar_institucionalmente',
        'validaciones_normativas.rechazar',
    ],
    folio: ['folios.asignar', 'preparar_documento_firma'],
    procesar: ES_CERT_FUNCIONAL.procesar,
    firmar: ES_CERT_FUNCIONAL.firmar,
    obtenerResultadoFinal: ES_CERT_FUNCIONAL.obtenerResultadoFinal,
    enviarIncidenciaSistemas: ES_CERT_FUNCIONAL.enviarIncidenciaSistemas,
    aprobar: [
        'documentos.aprobar',
        'documentos.aprobar_institucionalmente',
        'certificacion.validar',
        'certificacion.aprobar',
    ],
    expediente: ['documentos.ver', 'ver_documentos', 'expedientes.ver', 'alumnos.ver'],
    reportes: ['reportes.ver'],
    consultaLegacy: ['sices_legacy.consultar'],
    /** @deprecated Usar obtenerResultadoFinal */
    lecturaPdf: ES_CERT_FUNCIONAL.obtenerResultadoFinal,
};

/** Permisos técnicos — no usar en UI de Educación Superior */
export const ES_CERT_FORBIDDEN = [
    'generar_cadena',
    'cadena_original.generar',
    'generar_xml',
    'xml.generar',
    'xml.validar',
    'firma.preflight',
    'firma.ejecutar',
    'solicitar_firma',
    'reintentar_firma',
    'sices_legacy.exportar',
    'sistemas.integraciones.ver',
];

export function esCan(action) {
    const list = ES_CERT_PERM[action];
    return list ? userCanAny(list) : false;
}

/** Diagnóstico de incidencias (solo cuando hay error técnico). */
export function esCanVerDiagnosticoIncidencia() {
    return esCan('enviarIncidenciaSistemas');
}
