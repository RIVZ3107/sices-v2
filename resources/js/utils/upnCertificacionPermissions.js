import { userCanAny } from './userPermissions';

/** Permisos funcionales UPN (mismo criterio que Educación Superior). */
export const UPN_FUNCIONAL = {
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

/** Permisos UPN — permissions[], sin roles[0]. */
export const UPN_PERM = {
    ver: ['documentos.ver', 'ver_documentos', 'certificacion.ver'],
    validar: ['certificacion.validar', 'validaciones_normativas.aprobar'],
    aprobar: [
        'documentos.aprobar',
        'documentos.aprobar_institucionalmente',
        'certificacion.validar',
        'validaciones_normativas.aprobar',
    ],
    rechazar: [
        'documentos.rechazar',
        'documentos.rechazar_institucionalmente',
        'validaciones_normativas.rechazar',
    ],
    observar: ['observaciones.crear', 'documentos.observar'],
    devolver: ['observaciones.crear', 'documentos.observar'],
    folio: ['folios.asignar', 'preparar_documento_firma'],
    procesar: UPN_FUNCIONAL.procesar,
    firmar: UPN_FUNCIONAL.firmar,
    obtenerResultadoFinal: UPN_FUNCIONAL.obtenerResultadoFinal,
    enviarIncidenciaSistemas: UPN_FUNCIONAL.enviarIncidenciaSistemas,
    pdf: UPN_FUNCIONAL.obtenerResultadoFinal,
    legacy: ['sices_legacy.consultar'],
    expediente: ['expedientes.ver', 'alumnos.ver', 'documentos.ver'],
};

/** Permisos técnicos — no exponer en UI UPN / Educación Superior */
export const UPN_FORBIDDEN_UI = [
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
];

export function upnCan(action) {
    const list = UPN_PERM[action];
    return list ? userCanAny(list) : false;
}

/** Diagnóstico de incidencias técnicas (no operación diaria). */
export function upnCanVerDiagnosticoSistemas() {
    return upnCan('enviarIncidenciaSistemas');
}
