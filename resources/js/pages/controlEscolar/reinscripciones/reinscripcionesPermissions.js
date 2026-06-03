import { userCanAny } from '../../../utils/userPermissions';

export const REI_PERM = {
    ver: ['reinscripciones.ver', 'reinscripciones.revisar', 'ver_alumnos', 'alumnos.ver'],
    crear: ['reinscripciones.crear', 'reinscripciones.editar'],
    desbloquear: ['reinscripciones.desbloquear', 'reinscripciones.autorizar_excepcion'],
    completar: ['reinscripciones.completar'],
    observar: ['reinscripciones.observar'],
    cancelar: ['reinscripciones.cancelar'],
    exportar: ['reinscripciones.exportar', 'reportes.ver', 'exportar_reportes'],
    ficha: ['reinscripciones.ficha.generar', 'reinscripciones.ficha.descargar', 'reinscripciones.completar'],
    expediente: ['expedientes.ver', 'ver_alumnos', 'alumnos.ver'],
    trayectoria: ['trayectoria.ver', 'kardex.ver'],
};

export function canRei(action) {
    return userCanAny(REI_PERM[action] ?? []);
}
