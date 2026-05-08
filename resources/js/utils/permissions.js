const ACTIONS_BY_ROLE = {
    control_escolar_escuela: [
        'crear_alumno',
        'editar_alumno',
        'ver_alumno',
        'crear_matricula',
        'editar_matricula',
        'cambiar_estatus_matricula',
        'crear_inscripcion_periodo',
        'editar_inscripcion_periodo',
        'generar_carga_academica',
        'capturar_calificaciones',
        'importar_calificaciones',
        'prevalidar_importacion',
        'confirmar_importacion',
        'recalcular_trayectoria',
        'solicitar_certificacion',
        'crear_documento_borrador',
        'enviar_documento_revision',
    ],
    director_escuela: [
        'ver_alumno',
        'aprobar_documento',
        'rechazar_documento',
    ],
    educacion_superior: [
        'ver_alumno',
        'validar_normativamente',
        'revisar_importacion_legacy_normativa',
        'aprobar_importacion_legacy_normativa',
        'rechazar_importacion_legacy_normativa',
        'liberar_proceso_tecnico',
        'rechazar_documento',
    ],
    sistemas: [
        'ver_alumno',
        'generar_cadena',
        'generar_xml',
        'firmar_documento',
        'generar_pdf',
    ],
    auditor: [
        'ver_alumno',
        'ver_auditoria',
        'exportar_reportes',
    ],
    superadmin: [
        'crear_alumno',
        'editar_alumno',
        'ver_alumno',
        'crear_matricula',
        'editar_matricula',
        'cambiar_estatus_matricula',
        'crear_inscripcion_periodo',
        'editar_inscripcion_periodo',
        'generar_carga_academica',
        'capturar_calificaciones',
        'importar_calificaciones',
        'prevalidar_importacion',
        'confirmar_importacion',
        'recalcular_trayectoria',
        'solicitar_certificacion',
        'crear_documento_borrador',
        'enviar_documento_revision',
        'aprobar_documento',
        'rechazar_documento',
        'validar_normativamente',
        'liberar_proceso_tecnico',
        'revisar_importacion_legacy_normativa',
        'aprobar_importacion_legacy_normativa',
        'rechazar_importacion_legacy_normativa',
        'generar_cadena',
        'generar_xml',
        'firmar_documento',
        'generar_pdf',
        'ver_auditoria',
        'exportar_reportes',
    ],
    admin: [
        'ver_alumno',
        'ver_auditoria',
        'exportar_reportes',
    ],
};

/**
 * @param {string[]|undefined|null} roles
 * @param {string} action
 */
export function canAction(roles, action) {
    const list = Array.isArray(roles) ? roles : [];
    return list.some((role) => (ACTIONS_BY_ROLE[role] ?? []).includes(action));
}

/**
 * @param {string[]|undefined|null} roles
 * @returns {string[]}
 */
export function actionsForRoles(roles) {
    const list = Array.isArray(roles) ? roles : [];
    return [...new Set(list.flatMap((role) => ACTIONS_BY_ROLE[role] ?? []))];
}

