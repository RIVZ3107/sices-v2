import { userCanAny } from './userPermissions';

export const PROC_TEC_PERM = {
    verBandeja: [
        'firma.ver',
        'ver_documentos',
        'documentos.ver',
        'generar_cadena',
        'cadena_original.generar',
        'integraciones.ver',
        'sistemas.integraciones.ver',
    ],
    payload: ['generar_cadena', 'cadena_original.generar', 'documentos.ver', 'ver_documentos'],
    cadena: ['generar_cadena', 'cadena_original.generar'],
    xml: ['generar_xml', 'xml.generar'],
    validarXml: ['xml.validar', 'xml.generar', 'generar_xml'],
    errores: ['xml.ver', 'ver_xml', 'xml.validar', 'documentos.ver', 'ver_documentos'],
    preflight: ['xml.validar', 'firma.preflight', 'firma.ejecutar', 'integraciones.ver', 'sistemas.integraciones.ver'],
    shadowExport: ['sices_legacy.exportar', 'sistemas.integraciones.ver', 'firma.preflight'],
    firmaSep: ['firma.ejecutar'],
};

export function canProcesoTecnico(action) {
    const list = PROC_TEC_PERM[action];
    return list ? userCanAny(list) : false;
}

export function puedeEjecutarTecnico() {
    return (
        canProcesoTecnico('payload')
        || canProcesoTecnico('cadena')
        || canProcesoTecnico('xml')
        || canProcesoTecnico('validarXml')
        || canProcesoTecnico('preflight')
    );
}
