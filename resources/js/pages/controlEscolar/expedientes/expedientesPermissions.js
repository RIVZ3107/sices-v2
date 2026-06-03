import { getUser } from '../../../authStore';
import { userCanAny } from '../../../utils/userPermissions';

export const EXP_PERM = {
    ver: ['expedientes.ver', 'ver_alumnos', 'alumnos.ver'],
    crear: ['expedientes.crear', 'gestionar_alumnos'],
    editar: ['expedientes.editar', 'gestionar_alumnos'],
    validar: ['expedientes.validar', 'expedientes.revisar'],
    observar: ['expedientes.observar', 'observaciones.crear'],
    exportar: ['expedientes.exportar', 'reportes.ver', 'exportar_reportes'],
    cargar: ['expedientes.documentos.cargar', 'documentos.crear_borrador', 'documentos.crear'],
    descargar: ['expedientes.documentos.descargar', 'documentos.ver'],
};

export function canExp(action) {
    return userCanAny(EXP_PERM[action] ?? []);
}

export function canVerDetalleTecnicoError() {
    const roles = getUser()?.roles ?? [];
    return roles.some((r) => ['superadmin', 'admin', 'sistemas'].includes(String(r)));
}
