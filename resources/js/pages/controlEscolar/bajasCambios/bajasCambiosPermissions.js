import { userCanAny } from '../../../utils/userPermissions';

export const BC_PERM = {
    ver: ['bajas_cambios.ver', 'expedientes.ver', 'alumnos.ver'],
    crear: ['bajas_cambios.crear'],
    editar: ['bajas_cambios.editar'],
    revisar: ['bajas_cambios.revisar'],
    aprobar: ['bajas_cambios.aprobar'],
    rechazar: ['bajas_cambios.rechazar'],
    observar: ['bajas_cambios.observar'],
    aplicar: ['bajas_cambios.aplicar'],
    exportar: ['bajas_cambios.exportar', 'reportes.ver'],
    masivoAprobar: ['bajas_cambios.aprobar_masivo', 'bajas_cambios.aprobar'],
    masivoRechazar: ['bajas_cambios.rechazar_masivo', 'bajas_cambios.rechazar'],
};

export function canBc(action) {
    return userCanAny(BC_PERM[action] ?? []);
}
