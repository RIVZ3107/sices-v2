/**
 * Valores por defecto vacíos para la UI de Control Escolar.
 * Sustituye datos de demostración; las pantallas deben tomar datos reales del API cuando existan.
 */

export const CE_SUBSISTEMAS = [];
export const CE_INSTITUCIONES = [];
export const CE_SEDES = [];
export const CE_PROGRAMAS = [];
export const CE_MATERIAS = [];

export const CE_DEMO_ALUMNOS = [];
export const CE_DEMO_ALUMNOS_RECENTES = [];
export const CE_DEMO_EXPEDIENTES = [];
export const CE_DOCUMENTOS_REQUERIDOS = [];
export const CE_ACTIVIDAD_RECIENTE = [];
export const CE_DEMO_INSCRIPCIONES = [];
export const CE_FECHAS_IMPORTANTES = [];
export const CE_DEMO_REINSCRIPCIONES = [];
export const CE_MOTIVOS_BLOQUEO = [];

export const CE_DEMO_ALUMNO_TRAYECTORIA = {
    nombre: '—',
    matricula: '—',
    curp: '—',
    programa: '—',
    periodo: '—',
    estatus: '—',
};

export const CE_DEMO_MATERIAS_HISTORIAL = [];
export const CE_DEMO_DOCUMENTOS_EMITIDOS = [];
export const CE_PLANTILLAS_RAPIDAS = [];
export const CE_DEMO_BAJAS = [];
export const CE_DEMO_SOLICITUDES = [];
export const CE_TIPOS_SOLICITUD = [];
export const CE_DEMO_COMENTARIOS_SOL = [];
export const CE_DEMO_GRUPOS_CALIFICACION = [];
export const CE_DEMO_CALIFICACIONES_TABLA = [];
export const CE_DEMO_ERRORES_IMPORT = [];
export const CE_DEMO_REPORTES_FRECUENTES = [];
export const CE_DEMO_IMPORTACIONES = [];
export const CE_DEMO_OBSERVACIONES = [];
export const CE_DEMO_NOTIFICACIONES = [];

export const CE_DASHBOARD_ESTATUS_ALUMNOS = [];

export function ceTotalAlumnosEstatus() {
    return CE_DASHBOARD_ESTATUS_ALUMNOS.reduce((s, r) => s + r.count, 0);
}

export const CE_DEMO_PROCESOS_RECIENTES = [];
