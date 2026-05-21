import { userCan, userCanAny } from './userPermissions';

export const REV_PERM = {
    ver: ['ver_documentos', 'documentos.ver', 'certificacion.ver'],
    validar: [
        'ver_documentos',
        'documentos.ver',
        'certificacion.ver',
        'certificacion.validar',
        'validaciones_normativas.ver',
    ],
    observar: [
        'rechazar_documentos',
        'documentos.rechazar',
        'documentos.rechazar_institucionalmente',
        'validaciones_normativas.rechazar',
        'certificacion.validar',
        'documentos.observar',
        'observaciones.crear',
    ],
    aprobar: [
        'aprobar_documentos',
        'documentos.aprobar',
        'documentos.aprobar_institucionalmente',
        'validaciones_normativas.aprobar',
        'certificacion.autorizar_emision',
        'certificacion.validar',
    ],
    rechazar: [
        'rechazar_documentos',
        'documentos.rechazar',
        'documentos.rechazar_institucionalmente',
        'validaciones_normativas.rechazar',
    ],
    liberar: [
        'documentos.liberar_proceso_tecnico',
        'preparar_documento_firma',
        'certificacion.enviar_a_proceso_tecnico',
        'certificacion.autorizar_emision',
        'folios.asignar',
    ],
    folio: ['folios.asignar', 'preparar_documento_firma', 'certificacion.autorizar_emision'],
};

export function canRevision(action) {
    const list = REV_PERM[action];
    return list ? userCanAny(list) : false;
}

export function canRevisionVer() {
    return canRevision('ver');
}
