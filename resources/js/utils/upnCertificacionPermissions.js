import { userCanAny } from './userPermissions';

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
    liberar: [
        'documentos.liberar_proceso_tecnico',
        'certificacion.enviar_a_proceso_tecnico',
        'preparar_documento_firma',
    ],
    pdf: ['pdf.ver', 'ver_pdf'],
    legacy: ['sices_legacy.consultar'],
    expediente: ['expedientes.ver', 'alumnos.ver', 'documentos.ver'],
    procesoTecnico: [
        'generar_cadena',
        'cadena_original.generar',
        'xml.generar',
        'firma.ver',
        'firma.ejecutar',
    ],
};

/** Acciones técnicas prohibidas en vista UPN (Educación Superior / RC). */
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

export function upnCanProcesoTecnico() {
    return userCanAny(UPN_PERM.procesoTecnico);
}
