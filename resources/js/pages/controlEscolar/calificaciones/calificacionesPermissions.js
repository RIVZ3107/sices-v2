import { userCanAny } from '../../../utils/userPermissions';

export const CAL_PERM = {
    ver: ['calificaciones.ver', 'calificaciones.capturar', 'calificaciones.revisar', 'alumnos.ver'],
    capturar: ['calificaciones.capturar', 'calificaciones.editar'],
    importar: ['calificaciones.importar', 'importaciones_academicas.importar'],
    exportar: ['calificaciones.exportar', 'reportes.ver'],
    historial: ['calificaciones.historial.ver', 'calificaciones.ver'],
    correccion: ['calificaciones.correccion.solicitar'],
    cerrar: ['calificaciones.cerrar_captura', 'calificaciones.cerrar'],
    plantilla: ['calificaciones.plantilla.descargar', 'calificaciones.importar'],
};

export function canCal(action) {
    return userCanAny(CAL_PERM[action] ?? []);
}
