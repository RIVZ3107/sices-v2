import { getUser } from '../../../authStore';
import { userCanAny } from '../../../utils/userPermissions';

export const ALUMNOS_PERM = {
    ver: ['ver_alumnos', 'alumnos.ver', 'expedientes.ver'],
    crear: ['gestionar_alumnos', 'alumnos.crear', 'expedientes.crear'],
    editar: ['gestionar_alumnos', 'alumnos.editar', 'expedientes.editar'],
    importar: ['alumnos.importar', 'importaciones_academicas.importar', 'control_escolar.importar'],
    exportar: ['alumnos.exportar', 'reportes.ver', 'exportar_reportes'],
    kardex: ['kardex.ver', 'trayectoria.ver', 'alumnos.kardex.ver'],
    constancia: ['constancias.generar', 'documentos.crear_borrador', 'documentos.crear'],
    reinscripcion: ['reinscripciones.crear', 'reinscripciones.ver'],
    cambiarEstatus: ['alumnos.editar', 'expedientes.editar'],
};

export function canAlumnos(action) {
    return userCanAny(ALUMNOS_PERM[action] ?? []);
}

export function canVerDetalleTecnicoError() {
    const user = getUser();
    const roles = user?.roles ?? [];
    return roles.some((r) => ['superadmin', 'admin', 'sistemas'].includes(String(r)));
}
