/**
 * Valores por defecto vacíos para la UI de Dirección de Escuela.
 */

import {
    CE_DEMO_CALIFICACIONES_TABLA,
    CE_DEMO_DOCUMENTOS_EMITIDOS,
    CE_DEMO_GRUPOS_CALIFICACION,
    CE_DEMO_INSCRIPCIONES,
    CE_DEMO_REINSCRIPCIONES,
    CE_FECHAS_IMPORTANTES,
    CE_INSTITUCIONES,
    CE_MATERIAS,
    CE_MOTIVOS_BLOQUEO,
    CE_PROGRAMAS,
} from './controlEscolarUiDefaults';

export const DE_ESCUELA_ACTIVA = '—';

export const DE_DASHBOARD_MATRICULA_POR_PROGRAMA = [];

export function deTotalMatriculaPrograma() {
    return DE_DASHBOARD_MATRICULA_POR_PROGRAMA.reduce((s, r) => s + r.count, 0);
}

export function deBuildDonutGradient(segments) {
    if (!Array.isArray(segments) || segments.length === 0) {
        return 'conic-gradient(#e5e7eb 0deg 360deg)';
    }
    const total = segments.reduce((s, r) => s + r.count, 0) || 1;
    let acc = 0;
    const parts = segments.map((s) => {
        const start = acc;
        const span = (s.count / total) * 360;
        acc += span;
        return `${s.color} ${start}deg ${acc}deg`;
    });
    return `conic-gradient(${parts.join(', ')})`;
}

export const DE_AVANCE_PROCESOS_REF = [];
export const DE_PENDIENTES_CRITICOS = [];
export const DE_DECISIONES_RECientes = [];
export const DE_REPORTES_FRECUENTES = [];
export const DE_DASHBOARD_METRICAS_TRENDS = [];
export const DE_DEMO_ALUMNOS = [];
export const DE_ALERTAS_ALUMNOS = [];
export const DE_DISTRIBUCION_ESTATUS = [];

export function deTotalAlumnosEstatus() {
    return DE_DISTRIBUCION_ESTATUS.reduce((s, r) => s + r.count, 0);
}

export const DE_TENDENCIA_MENSUAL = [];
export const DE_INDICADORES_MONITOREADOS = [];
export const DE_INDICADORES_CLAVE = [];
export const DE_COMPARATIVO_SEMESTRE = [];
export const DE_EGRESO_DONA = [];
export const DE_EGRESO_PROCESO = [];
export const DE_EGRESO_PRIORITARIOS = [];
export const DE_EGRESO_TRAMITES = [];
export const DE_EGRESO_ACTIVIDAD = [];
export const DE_INSCRIPCION_ETAPAS = [];
export const DE_FECHAS_INSCRIPCION = CE_FECHAS_IMPORTANTES.map((f) =>
    f.titulo?.includes?.('confirmar')
        ? { ...f, titulo: 'Fecha límite de confirmación institucional', badge: f.badge }
        : f,
);
export const DE_REINSCRIPCION_FLUJO = [];
export const DE_NOTIFICACIONES_LISTA = [];
export const DE_NOTIFICACION_CATEGORIAS = [];
export const DE_NOTIFICACION_DETALLE = {
    id: '—',
    prioridad: '—',
    titulo: '—',
    descripcion: '—',
    usuario: '—',
    fecha: '—',
    categoria: '—',
    estatus: '—',
    acciones: [],
};

export const DE_AUTORIZACIONES_FILAS = [];

export {
    CE_DEMO_CALIFICACIONES_TABLA,
    CE_DEMO_DOCUMENTOS_EMITIDOS,
    CE_DEMO_GRUPOS_CALIFICACION,
    CE_DEMO_INSCRIPCIONES,
    CE_DEMO_REINSCRIPCIONES,
    CE_INSTITUCIONES,
    CE_MATERIAS,
    CE_MOTIVOS_BLOQUEO,
    CE_PROGRAMAS,
};
