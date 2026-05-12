/**
 * Dataset visual semirreal para Dirección de Escuela (Normal / UPN).
 * Importar desde páginas del rol director_escuela; no duplicar arrays en componentes.
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
} from './controlEscolarDemoData';

export const DE_ESCUELA_ACTIVA =
    'Escuela Normal Superior del Valle de Toluca — subsistema Educación Normal';

export const DE_DASHBOARD_MATRICULA_POR_PROGRAMA = [
    { key: 'p1', label: CE_PROGRAMAS[0], color: '#2563eb', count: 1052, pct: 37.0 },
    { key: 'p2', label: CE_PROGRAMAS[1], color: '#16a34a', count: 842, pct: 29.6 },
    { key: 'p3', label: CE_PROGRAMAS[7], color: '#7c3aed', count: 572, pct: 20.1 },
    { key: 'p4', label: CE_PROGRAMAS[10], color: '#ea580c', count: 301, pct: 10.6 },
    { key: 'p5', label: 'Otros programas', color: '#64748b', count: 78, pct: 2.7 },
];

export function deTotalMatriculaPrograma() {
    return DE_DASHBOARD_MATRICULA_POR_PROGRAMA.reduce((s, r) => s + r.count, 0);
}

export function deBuildDonutGradient(segments) {
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

/** Avance de procesos (referencia visual) */
export const DE_AVANCE_PROCESOS_REF = [
    { clave: 'ins', etiqueta: 'Inscripciones', avance: 78, hecho: 400, total: 512 },
    { clave: 'rein', etiqueta: 'Reinscripciones', avance: 64, hecho: 1360, total: 2126 },
    { clave: 'cal', etiqueta: 'Captura de calificaciones', avance: 71, hecho: 2020, total: 2845 },
    { clave: 'eg', etiqueta: 'Egreso y titulación', avance: 45, hecho: 84, total: 186 },
];

export const DE_PENDIENTES_CRITICOS = [
    { label: 'Calificaciones sin capturar', n: 128, to: '/app/direccion/calificaciones' },
    { label: 'Expedientes incompletos', n: 96, to: '/app/expedientes' },
    { label: 'Trámites próximos a vencer', n: 34, to: '/app/direccion/autorizaciones-observaciones' },
    { label: 'Documentos por validar', n: 57, to: '/app/direccion/documentos' },
    { label: 'Candidatos a egreso pendientes', n: 51, to: '/app/direccion/egreso-titulacion' },
    { label: 'Incidencias académicas', n: 23, to: '/app/direccion/autorizaciones-observaciones' },
];

export const DE_DECISIONES_RECientes = [
    {
        fecha: '20/05/2025 09:12',
        tipo: 'Inscripción',
        asunto: 'Autorización de inscripción extemporánea',
        descripcion: 'Caso ENSVT-2024-0142 — documentación completa y dictamen académico favorable.',
        autor: 'Dirección',
        estatus: 'Completado',
    },
    {
        fecha: '19/05/2025 16:40',
        tipo: 'Reinscripción',
        asunto: 'Aprobación de reinscripción excepcional',
        descripcion: 'UPN151-2023-0891 — excepción por trayectoria consolidada en periodo previo.',
        autor: 'Dirección',
        estatus: 'En proceso',
    },
    {
        fecha: '19/05/2025 11:05',
        tipo: 'Calificaciones',
        asunto: 'Validación institucional de calificaciones',
        descripcion: 'Acta 6° A Educación Primaria — cierre validado sin observaciones.',
        autor: 'Dirección',
        estatus: 'Completado',
    },
    {
        fecha: '18/05/2025 14:22',
        tipo: 'Documentos',
        asunto: 'Autorización de documento',
        descripcion: 'Constancia de estudios — revisión institucional conforme a lineamientos.',
        autor: 'Dirección',
        estatus: 'En revisión',
    },
    {
        fecha: '18/05/2025 10:01',
        tipo: 'Incidencias',
        asunto: 'Atención de incidencia',
        descripcion: 'Seguimiento a reporte de trayectoria no consolidada en 4° semestre.',
        autor: 'Dirección',
        estatus: 'En proceso',
    },
    {
        fecha: '17/05/2025 15:33',
        tipo: 'Egreso',
        asunto: 'Autorización de egreso',
        descripcion: 'EG-2025-0248 — expediente académico completo y dictamen favorable.',
        autor: 'Dirección',
        estatus: 'Completado',
    },
];

export const DE_REPORTES_FRECUENTES = [
    { titulo: 'Reporte de matrícula', ruta: '/app/direccion/reportes' },
    { titulo: 'Reporte de inscripciones', ruta: '/app/direccion/reportes' },
    { titulo: 'Reporte de reinscripciones', ruta: '/app/direccion/reportes' },
    { titulo: 'Reporte de expedientes completos', ruta: '/app/direccion/reportes' },
    { titulo: 'Reporte de calificaciones pendientes', ruta: '/app/direccion/calificaciones' },
    { titulo: 'Reporte de candidatos a egreso', ruta: '/app/direccion/egreso-titulacion' },
    { titulo: 'Reporte de indicadores institucionales', ruta: '/app/direccion/indicadores' },
];

export const DE_DASHBOARD_METRICAS_TRENDS = [
    { key: 'alumnos_activos', title: 'Alumnos activos', trend: '↑ 6% vs. ciclo anterior', tone: 'blue' },
    { key: 'inscripciones_pendientes', title: 'Inscripciones', trend: '↑ 4% vs. ciclo anterior', tone: 'green' },
    { key: 'reinscripciones_seguimiento', title: 'Reinscripciones', trend: '↓ 2% vs. ciclo anterior', tone: 'purple' },
    { key: 'calificaciones_pendientes', title: 'Calificaciones pendientes', trend: '↑ 8% vs. ciclo anterior', tone: 'orange' },
    { key: 'candidatos_egreso', title: 'Candidatos a egreso', trend: '↑ 10% vs. ciclo anterior', tone: 'green' },
    { key: 'incidencias', title: 'Incidencias', trend: '↓ 5% vs. ciclo anterior', tone: 'red' },
];

/** Seguimiento de alumnos — con riesgo académico */
export const DE_DEMO_ALUMNOS = [
    { matricula: 'ENSVT-2024-0142', nombre: 'María Fernanda López Ruiz', programa: CE_PROGRAMAS[0], periodo: '6°', estatus: 'Activo', riesgo: 'Bajo' },
    { matricula: 'UPN151-2023-0891', nombre: 'José Andrés Martínez Díaz', programa: CE_PROGRAMAS[6], periodo: '4°', estatus: 'Activo', riesgo: 'Medio' },
    { matricula: 'ENSVM-2024-0201', nombre: 'Ana Paula García Torres', programa: CE_PROGRAMAS[1], periodo: '2°', estatus: 'Baja temporal', riesgo: 'Medio' },
    { matricula: 'UPN152-2022-0550', nombre: 'Diego Alejandro Pérez Soto', programa: CE_PROGRAMAS[8], periodo: '8°', estatus: 'Egresado', riesgo: 'Bajo' },
    { matricula: 'LRIO-2024-0033', nombre: 'Valeria Hernández Cruz', programa: CE_PROGRAMAS[3], periodo: '1°', estatus: 'Activo', riesgo: 'Alto' },
    { matricula: 'UPN153-2023-0104', nombre: 'Lucía Morales Ibarra', programa: CE_PROGRAMAS[10], periodo: '5°', estatus: 'Activo', riesgo: 'Alto' },
];

export const DE_ALERTAS_ALUMNOS = [
    { label: 'Alumnos en riesgo alto', n: 12, tone: 'red' },
    { label: 'Expedientes incompletos', n: 128, tone: 'orange' },
    { label: 'Seguimiento pedagógico activo', n: 64, tone: 'blue' },
];

export const DE_DISTRIBUCION_ESTATUS = [
    { key: 'act', label: 'Activos', color: '#16a34a', count: 2124, pct: 74.7 },
    { key: 'bt', label: 'Bajas temporales', color: '#ca8a04', count: 196, pct: 6.9 },
    { key: 'riesgo', label: 'En riesgo', color: '#dc2626', count: 87, pct: 3.1 },
    { key: 'eg', label: 'Egresados', color: '#7c3aed', count: 312, pct: 11.0 },
    { key: 'inac', label: 'Inactivos', color: '#64748b', count: 126, pct: 4.4 },
];

export function deTotalAlumnosEstatus() {
    return DE_DISTRIBUCION_ESTATUS.reduce((s, r) => s + r.count, 0);
}

/** Indicadores — tendencia mensual (etiquetas) */
export const DE_TENDENCIA_MENSUAL = [
    { mes: 'Ago', actual: 2650, anterior: 2480 },
    { mes: 'Sep', actual: 2710, anterior: 2520 },
    { mes: 'Oct', actual: 2760, anterior: 2580 },
    { mes: 'Nov', actual: 2795, anterior: 2610 },
    { mes: 'Dic', actual: 2810, anterior: 2630 },
    { mes: 'Ene', actual: 2820, anterior: 2640 },
    { mes: 'Feb', actual: 2828, anterior: 2650 },
    { mes: 'Mar', actual: 2835, anterior: 2660 },
    { mes: 'Abr', actual: 2840, anterior: 2670 },
    { mes: 'May', actual: 2845, anterior: 2680 },
];

export const DE_INDICADORES_MONITOREADOS = [
    { nombre: 'Matrícula mínima operativa', meta: '≥ 2,800', avance: 96, variacion: '↑ 4%', estatus: 'Cumplido' },
    { nombre: 'Eficiencia terminal', meta: '≥ 65%', avance: 72, variacion: '↑ 2.1 pp', estatus: 'Cumplido' },
    { nombre: 'Expedientes completos', meta: '≥ 90%', avance: 68, variacion: '↑ 3.2 pp', estatus: 'En riesgo' },
    { nombre: 'Reinscripciones en tiempo', meta: '≥ 92%', avance: 88, variacion: '↓ 1.0 pp', estatus: 'En riesgo' },
];

export const DE_INDICADORES_CLAVE = [
    { titulo: 'Eficiencia terminal', desc: 'Estudiantes que concluyen en tiempo normativo', pct: '68.4%', estatus: 'Cumplido' },
    { titulo: 'Tasa de reinscripción', desc: 'Continuidad en el ciclo vigente', pct: '92.1%', estatus: 'Cumplido' },
    { titulo: 'Promedio institucional', desc: 'Resultado global por periodo', pct: '8.76', estatus: 'Cumplido' },
];

export const DE_COMPARATIVO_SEMESTRE = [
    { sem: '1º', ant: 720, act: 748 },
    { sem: '2º', ant: 680, act: 702 },
    { sem: '3º', ant: 540, act: 568 },
    { sem: '4º', ant: 420, act: 445 },
];

export const DE_EGRESO_DONA = [
    { label: 'Egresado', color: '#16a34a', count: 71, pct: 38.2 },
    { label: 'En trámite', color: '#ca8a04', count: 67, pct: 36.0 },
    { label: 'Documentación', color: '#7c3aed', count: 31, pct: 16.7 },
    { label: 'Pendiente', color: '#2563eb', count: 17, pct: 9.1 },
];

export const DE_EGRESO_PROCESO = [
    { etiqueta: 'Registro de solicitud', pct: 100 },
    { etiqueta: 'Revisión de expediente', pct: 73 },
    { etiqueta: 'Validación académica', pct: 60 },
    { etiqueta: 'Autorización de egreso', pct: 45 },
    { etiqueta: 'Generación de documentación', pct: 36 },
    { etiqueta: 'Titulación / entrega', pct: 22 },
];

export const DE_EGRESO_PRIORITARIOS = [
    { label: 'Expedientes con observaciones', n: 23, to: '/app/direccion/egreso-titulacion' },
    { label: 'Pendientes de autorización', n: 12, to: '/app/direccion/egreso-titulacion' },
    { label: 'Documentos por proceso técnico', n: 18, to: '/app/direccion/documentos' },
    { label: 'Candidatos próximos a egresar', n: 14, to: '/app/direccion/egreso-titulacion' },
    { label: 'Titulaciones programadas', n: 7, to: '/app/direccion/egreso-titulacion' },
];

export const DE_EGRESO_TRAMITES = [
    {
        alumno: 'María Fernanda López Ruiz',
        matricula: 'ENSVT-2024-0142',
        programa: CE_PROGRAMAS[0],
        tramite: 'Egreso',
        fase: 'Autorización institucional',
        fecha: '19/05/2025',
        estatus: 'En trámite',
        folio: 'EG-2025-0248',
    },
    {
        alumno: 'José Andrés Martínez Díaz',
        matricula: 'UPN151-2023-0891',
        programa: CE_PROGRAMAS[6],
        tramite: 'Titulación',
        fase: 'Revisión de expediente',
        fecha: '18/05/2025',
        estatus: 'En proceso',
        folio: 'EG-2025-0231',
    },
    {
        alumno: 'Ana Paula García Torres',
        matricula: 'ENSVM-2024-0201',
        programa: CE_PROGRAMAS[1],
        tramite: 'Egreso',
        fase: 'Documentación',
        fecha: '17/05/2025',
        estatus: 'Autorizado',
        folio: 'EG-2025-0198',
    },
];

export const DE_EGRESO_ACTIVIDAD = [
    { texto: 'Se autorizó el egreso de José Martínez Díaz', hora: '09:41 a. m.' },
    { texto: 'Se solicitó revisión de expediente — UPN 151', hora: '08:15 a. m.' },
    { texto: 'Documento institucional observado en trámite EG-2025-0190', hora: 'Ayer' },
];

export const DE_INSCRIPCION_ETAPAS = [
    { n: 1, titulo: 'Registro de solicitud', estado: 'completo', count: 476 },
    { n: 2, titulo: 'Entrega de documentos', estado: 'completo', count: 468 },
    { n: 3, titulo: 'Validación documental', estado: 'activo', count: 57 },
    { n: 4, titulo: 'Confirmación institucional', estado: 'pendiente', count: 312 },
    { n: 5, titulo: 'Autorización final (Dirección)', estado: 'pendiente', count: 312 },
    { n: 6, titulo: 'Inscripción concluida', estado: 'pendiente', count: 312 },
];

export const DE_FECHAS_INSCRIPCION = CE_FECHAS_IMPORTANTES.map((f) =>
    f.titulo.includes('confirmar')
        ? { ...f, titulo: 'Fecha límite de confirmación institucional', badge: f.badge }
        : f,
);

export const DE_REINSCRIPCION_FLUJO = [
    { paso: 'Solicitud', estado: 'completo' },
    { paso: 'Validación', estado: 'completo' },
    { paso: 'Trayectoria', estado: 'proceso' },
    { paso: 'Autorización', estado: 'pendiente' },
    { paso: 'Completada', estado: 'pendiente' },
];

export const DE_NOTIFICACIONES_LISTA = [
    {
        tipo: 'Incidencia',
        mensaje: 'Incidencia crítica reportada — riesgo de abandono detectado',
        relacion: 'María Fernanda López Ruiz (ENSVT-2024-0142)',
        fecha: '20/05/2025 08:40',
        prioridad: 'Crítica',
        estatus: 'No leída',
    },
    {
        tipo: 'Inscripciones',
        mensaje: 'Solicitud extemporánea pendiente de dictamen',
        relacion: 'Lucía Morales Ibarra (UPN153-2023-0104)',
        fecha: '19/05/2025 16:02',
        prioridad: 'Alta',
        estatus: 'No leída',
    },
    {
        tipo: 'Calificaciones',
        mensaje: 'Acta 4° B con captura incompleta',
        relacion: 'Grupo 4° B — Educación Primaria',
        fecha: '19/05/2025 11:20',
        prioridad: 'Media',
        estatus: 'Leída',
    },
];

export const DE_NOTIFICACION_CATEGORIAS = [
    { key: 'all', label: 'Todas', n: 89, activo: true },
    { key: 'inc', label: 'Incidencias', n: 9 },
    { key: 'ins', label: 'Inscripciones', n: 11 },
    { key: 'rein', label: 'Reinscripciones', n: 7 },
    { key: 'cal', label: 'Calificaciones', n: 10 },
    { key: 'doc', label: 'Documentos', n: 8 },
    { key: 'eg', label: 'Egreso y titulación', n: 6 },
    { key: 'rec', label: 'Recordatorios', n: 14 },
    { key: 'sys', label: 'Sistema', n: 18 },
    { key: 'com', label: 'Comunicaciones', n: 6 },
];

export const DE_NOTIFICACION_DETALLE = {
    id: 'NTF-2025-000452',
    prioridad: 'Crítica',
    titulo: 'Incidencia crítica reportada — riesgo de abandono detectado',
    descripcion:
        'Se detectó ausentismo recurrente y bajo desempeño en evaluaciones parciales. Se recomienda revisión del expediente académico y seguimiento socioemocional institucional.',
    usuario: 'María Fernanda López Ruiz',
    fecha: '20/05/2025 08:40',
    categoria: 'Incidencias',
    estatus: 'No leída',
    acciones: ['Revisar expediente académico', 'Coordinar entrevista con tutoría', 'Registrar seguimiento en observaciones'],
};

export const DE_AUTORIZACIONES_FILAS = [
    { folio: 'AUT-2025-014', tipo: 'Inscripción extemporánea', solicitante: 'Control Escolar', fecha: '20/05/2025', estatus: 'Pendiente' },
    { folio: 'AUT-2025-011', tipo: 'Reinscripción excepcional', solicitante: 'Servicios escolares', fecha: '19/05/2025', estatus: 'En revisión' },
    { folio: 'AUT-2025-009', tipo: 'Corrección de calificación', solicitante: 'Coordinación', fecha: '18/05/2025', estatus: 'Autorizada' },
    { folio: 'AUT-2025-006', tipo: 'Egreso institucional', solicitante: 'Titulación', fecha: '17/05/2025', estatus: 'Pendiente' },
];

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
