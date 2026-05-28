import { userCanAny } from './userPermissions';

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
    liberar: [
        'documentos.liberar_proceso_tecnico',
        'preparar_documento_firma',
        'certificacion.enviar_a_proceso_tecnico',
    ],
    expediente: ['documentos.ver', 'ver_documentos', 'expedientes.ver', 'alumnos.ver'],
    reportes: ['reportes.ver'],
    consultaLegacy: ['sices_legacy.consultar'],
    lecturaPdf: ['pdf.ver'],
    lecturaXml: ['xml.ver'],
};

/** Permisos técnicos — nunca mostrar botones */
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
