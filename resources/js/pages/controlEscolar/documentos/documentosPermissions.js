import { userCanAny } from '../../../utils/userPermissions';

export const DOC_PERM = {
    ver: ['documentos.ver', 'ver_documentos', 'documentos.crear_borrador', 'expedientes.ver', 'alumnos.ver'],
    crear: ['documentos.crear', 'documentos.crear_borrador', 'crear_documentos'],
    editar: ['documentos.editar', 'editar_documentos'],
    enviar: ['documentos.enviar_validacion', 'documentos.enviar_revision', 'enviar_revision'],
    atender: ['documentos.observaciones.atender', 'observaciones.atender', 'editar_documentos'],
    cancelar: ['documentos.cancelar', 'rechazar_documentos'],
    descargar: ['documentos.descargar', 'expedientes.documentos.descargar'],
    acuse: ['documentos.acuse.descargar'],
    exportar: ['documentos.exportar', 'reportes.ver'],
    expedientes: ['expedientes.ver', 'alumnos.ver'],
    pendientes: ['documentos.pendientes.ver', 'documentos.ver'],
};

export function canDoc(action) {
    return userCanAny(DOC_PERM[action] ?? []);
}
