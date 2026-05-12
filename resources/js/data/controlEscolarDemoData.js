/**
 * Dataset visual semirreal Normal / UPN para Control Escolar de Escuela.
 * No duplicar en componentes: importar desde aquí.
 */

export const CE_SUBSISTEMAS = ['Educación Normal', 'UPN'];

export const CE_INSTITUCIONES = [
    'ESCUELA NORMAL SUPERIOR DEL VALLE DE TOLUCA',
    'ESCUELA NORMAL SUPERIOR DEL VALLE DE MÉXICO',
    'ESCUELA NORMAL RURAL "LÁZARO CÁRDENAS DEL RÍO"',
    'UNIVERSIDAD PEDAGÓGICA NACIONAL UNIDAD 151 TOLUCA',
    'UNIVERSIDAD PEDAGÓGICA NACIONAL UNIDAD 152 ATIZAPÁN',
    'UNIVERSIDAD PEDAGÓGICA NACIONAL UNIDAD 153 ECATEPEC',
];

export const CE_SEDES = [
    'UPN UNIDAD 151 TOLUCA',
    'UPN UNIDAD 152 ATIZAPÁN',
    'UPN UNIDAD 153 ECATEPEC',
    'REGIONAL ACAMBAY',
    'REGIONAL IXTLAHUACA',
    'REGIONAL JILOTEPEC',
    'REGIONAL TEJUPILCO',
    'REGIONAL TULTEPEC',
    'REGIONAL NEZAHUALCÓYOTL',
    'REGIONAL NICOLÁS ROMERO',
    'ESCUELA NORMAL SUPERIOR DEL VALLE DE TOLUCA',
    'ESCUELA NORMAL SUPERIOR DEL VALLE DE MÉXICO',
    'ESCUELA NORMAL RURAL "LÁZARO CÁRDENAS DEL RÍO"',
];

export const CE_PROGRAMAS = [
    'Lic. en Educación Primaria',
    'Lic. en Educación Preescolar',
    'Lic. en Pedagogía',
    'Lic. en Intervención Educativa',
    'Lic. en Educación',
    'Lic. en Educación Básica',
    'Lic. en Psicología Educativa',
    'Lic. en Educación Secundaria',
    'Lic. en Enseñanza y Aprendizaje del Español en Educación Secundaria',
    'Lic. en Enseñanza y Aprendizaje del Inglés en Educación Secundaria',
    'Lic. en Inclusión Educativa',
];

export const CE_MATERIAS = [
    'Observación y análisis de prácticas educativas',
    'Bases filosóficas, legales y organizativas del sistema educativo',
    'Desarrollo infantil y aprendizaje',
    'Planeación educativa',
    'Evaluación para el aprendizaje',
    'Práctica profesional',
    'Gestión escolar',
    'Inclusión educativa',
    'Investigación educativa',
    'Didáctica general',
    'Psicología educativa',
    'Teorías pedagógicas',
    'Diseño curricular',
    'Educación socioemocional',
];

/** Filas tipo tabla alumnos */
export const CE_DEMO_ALUMNOS = [
    { matricula: 'ENSVT-2024-0142', nombre: 'María Fernanda López Ruiz', programa: CE_PROGRAMAS[0], periodo: '6°', estatus: 'Activo' },
    { matricula: 'UPN151-2023-0891', nombre: 'José Andrés Martínez Díaz', programa: CE_PROGRAMAS[6], periodo: '4°', estatus: 'En revisión' },
    { matricula: 'ENSVM-2024-0201', nombre: 'Ana Paula García Torres', programa: CE_PROGRAMAS[1], periodo: '2°', estatus: 'Baja temporal' },
    { matricula: 'UPN152-2022-0550', nombre: 'Diego Alejandro Pérez Soto', programa: CE_PROGRAMAS[8], periodo: '8°', estatus: 'Egresado' },
    { matricula: 'LRIO-2024-0033', nombre: 'Valeria Hernández Cruz', programa: CE_PROGRAMAS[3], periodo: '1°', estatus: 'Activo' },
];

export const CE_DEMO_ALUMNOS_RECENTES = CE_DEMO_ALUMNOS.slice(0, 3);

/** Expedientes */
export const CE_DEMO_EXPEDIENTES = [
    { folio: 'EXP-2025-0048', alumno: 'María Fernanda López Ruiz', programa: CE_PROGRAMAS[0], actualizado: '20/05/2025 09:12', usuario: 'Control Escolar', estatus: 'Completo' },
    { folio: 'EXP-2025-0041', alumno: 'José Andrés Martínez Díaz', programa: CE_PROGRAMAS[6], actualizado: '19/05/2025 16:40', usuario: 'Control Escolar', estatus: 'Con observaciones' },
    { folio: 'EXP-2025-0039', alumno: 'Ana Paula García Torres', programa: CE_PROGRAMAS[1], actualizado: '19/05/2025 11:05', usuario: 'Control Escolar', estatus: 'Pendiente' },
];

export const CE_DOCUMENTOS_REQUERIDOS = [
    { nombre: 'Acta de nacimiento', pct: 100, ok: true },
    { nombre: 'CURP', pct: 100, ok: true },
    { nombre: 'Certificado de bachillerato', pct: 88, ok: false },
    { nombre: 'Comprobante de domicilio', pct: 92, ok: false },
    { nombre: 'INE / Identificación oficial', pct: 76, ok: false },
    { nombre: 'Fotografía tamaño infantil', pct: 100, ok: true },
    { nombre: 'Carta de buena conducta', pct: 45, ok: false },
    { nombre: 'Documento académico previo', pct: 60, ok: false },
];

export const CE_ACTIVIDAD_RECIENTE = [
    { texto: 'Se cargó certificado de bachillerato en expediente EXP-2025-0041', hora: 'Hace 2 h' },
    { texto: 'Se validó expediente operativo de Ana Paula García Torres', hora: 'Ayer' },
    { texto: 'Observación atendida en documentos — folio EXP-2025-0039', hora: 'Hace 3 días' },
];

/** Inscripciones */
export const CE_DEMO_INSCRIPCIONES = [
    { folio: 'INS-2025-000258', alumno: 'María Fernanda López Ruiz', id: 'CURP …RA3', programa: CE_PROGRAMAS[0], fecha: '18/05/2025', estatus: 'Por validar' },
    { folio: 'INS-2025-000241', alumno: 'José Andrés Martínez Díaz', id: 'CURP …DZ8', programa: CE_PROGRAMAS[6], fecha: '17/05/2025', estatus: 'Observada' },
    { folio: 'INS-2025-000198', alumno: 'Ana Paula García Torres', id: 'CURP …TR1', programa: CE_PROGRAMAS[1], fecha: '15/05/2025', estatus: 'Confirmada' },
];

export const CE_FECHAS_IMPORTANTES = [
    { fecha: '22 MAY', titulo: 'Cierre de validación documental', badge: 'Próximo' },
    { fecha: '26 MAY', titulo: 'Límite para confirmar inscripciones', badge: 'Próximo' },
    { fecha: '30 MAY', titulo: 'Inicio de clases', badge: 'Programado' },
];

/** Reinscripciones — sin adeudos financieros */
export const CE_DEMO_REINSCRIPCIONES = [
    { alumno: 'María Fernanda López Ruiz', matricula: 'ENSVT-2024-0142', periodo: '2024-2025', motivo: '—', estatus: 'En proceso' },
    { alumno: 'José Andrés Martínez Díaz', matricula: 'UPN151-2023-0891', periodo: '2024-2025', motivo: 'Documentos incompletos', estatus: 'Bloqueada' },
    { alumno: 'Ana Paula García Torres', matricula: 'ENSVM-2024-0201', periodo: '2024-2025', motivo: 'Observaciones pendientes', estatus: 'Bloqueada' },
];

export const CE_MOTIVOS_BLOQUEO = [
    { label: 'Documentos incompletos', n: 18 },
    { label: 'Calificaciones pendientes', n: 12 },
    { label: 'Trayectoria no consolidada', n: 9 },
    { label: 'Observaciones pendientes', n: 7 },
    { label: 'Datos del alumno inconsistentes', n: 5 },
    { label: 'Validación normativa pendiente', n: 4 },
    { label: 'Firma de responsiva pendiente', n: 2 },
];

/** Trayectoria */
export const CE_DEMO_ALUMNO_TRAYECTORIA = {
    nombre: 'María Fernanda López Ruiz',
    matricula: 'ENSVT-2024-0142',
    curp: 'LORM060820MDFPZRA3',
    programa: CE_PROGRAMAS[0],
    periodo: '6°',
    estatus: 'Activo',
};

export const CE_DEMO_MATERIAS_HISTORIAL = CE_MATERIAS.slice(0, 6).map((nombre, i) => ({
    clave: `PED-${100 + i}`,
    nombre,
    periodo: `202${3 + (i % 3)}-${4 + (i % 3)}`,
    calificacion: i === 2 ? '5.0' : `${8 + (i % 2)}.${i}`,
    creditos: 6,
    estatus: i === 2 ? 'Reprobada' : 'Aprobada',
}));

/** Documentos */
export const CE_DEMO_DOCUMENTOS_EMITIDOS = [
    { tipo: 'Constancia de estudios', alumno: 'María Fernanda López Ruiz', fecha: '20/05/2025', estatus: 'Concluido' },
    { tipo: 'Historial académico', alumno: 'José Andrés Martínez Díaz', fecha: '19/05/2025', estatus: 'En proceso' },
    { tipo: 'Boleta de calificaciones', alumno: 'Ana Paula García Torres', fecha: '18/05/2025', estatus: 'En revisión' },
    { tipo: 'Kardex académico', alumno: 'Diego Alejandro Pérez Soto', fecha: '17/05/2025', estatus: 'Concluido' },
    { tipo: 'Constancia de inscripción', alumno: 'Valeria Hernández Cruz', fecha: '16/05/2025', estatus: 'Concluido' },
    { tipo: 'Constancia de baja', alumno: 'Diego Alejandro Pérez Soto', fecha: '15/05/2025', estatus: 'Observada' },
];

export const CE_PLANTILLAS_RAPIDAS = [
    'Constancia de estudios',
    'Historial académico',
    'Boleta de calificaciones',
    'Kardex académico',
    'Constancia de inscripción',
];

/** Bajas y cambios */
export const CE_DEMO_BAJAS = [
    { alumno: 'María Fernanda López Ruiz', tipo: 'Baja temporal', motivo: 'Problemas de salud', fecha: '20/05/2025 09:32', estatus: 'Pendiente' },
    { alumno: 'José Andrés Martínez Díaz', tipo: 'Cambio de grupo', motivo: 'Reorganización académica', fecha: '19/05/2025 14:10', estatus: 'En revisión' },
    { alumno: 'Ana Paula García Torres', tipo: 'Cambio de programa', motivo: 'Ajuste curricular autorizado en borrador', fecha: '18/05/2025 11:22', estatus: 'Observada' },
];

/** Solicitudes */
export const CE_DEMO_SOLICITUDES = [
    { folio: 'SOL-2025-0058', tipo: 'Constancia', alumno: 'María Fernanda López Ruiz', prioridad: 'Media', fecha: '20/05/2025', estatus: 'Pendiente' },
    { folio: 'SOL-2025-0044', tipo: 'Solicitud de matrícula', alumno: 'José Andrés Martínez Díaz', prioridad: 'Alta', fecha: '19/05/2025', estatus: 'En revisión' },
    { folio: 'SOL-2025-0031', tipo: 'Cambio de turno', alumno: 'Ana Paula García Torres', prioridad: 'Baja', fecha: '18/05/2025', estatus: 'Resuelto' },
];

export const CE_TIPOS_SOLICITUD = [
    { tipo: 'Solicitud de matrícula', n: 14 },
    { tipo: 'Constancia', n: 18 },
    { tipo: 'Baja temporal', n: 10 },
    { tipo: 'Cambio de grupo', n: 9 },
    { tipo: 'Cambio de turno', n: 5 },
    { tipo: 'Cambio de programa', n: 4 },
    { tipo: 'Certificado parcial/total', n: 6 },
    { tipo: 'Corrección de datos', n: 5 },
    { tipo: 'Revisión de trayectoria', n: 3 },
];

export const CE_DEMO_COMENTARIOS_SOL = [
    { autor: 'José Luis Martínez (Control Escolar)', folio: 'SOL-2025-0058', texto: 'Se adjuntó constancia solicitada.', hora: 'Hace 1 h' },
    { autor: 'María R. (Dirección)', folio: 'SOL-2025-0044', texto: 'Falta validar datos en expediente antes de enviar a ES.', hora: 'Ayer' },
];

/** Calificaciones — captura por grupo */
export const CE_DEMO_GRUPOS_CALIFICACION = [
    { grupo: '6° A — Lic. en Educación Primaria', sede: CE_SEDES[0], avancePct: 82, pendientes: 6 },
    { grupo: '4° B — Lic. en Psicología Educativa', sede: CE_SEDES[1], avancePct: 64, pendientes: 12 },
];

export const CE_DEMO_CALIFICACIONES_TABLA = [
    { alumno: 'María Fernanda López Ruiz', matricula: 'ENSVT-2024-0142', materia: CE_MATERIAS[0], calif: '9.2', estatus: 'Capturada' },
    { alumno: 'José Andrés Martínez Díaz', matricula: 'UPN151-2023-0891', materia: CE_MATERIAS[2], calif: '—', estatus: 'Pendiente' },
    { alumno: 'Ana Paula García Torres', matricula: 'ENSVM-2024-0201', materia: CE_MATERIAS[4], calif: '8.0', estatus: 'Corrección solicitada' },
];

export const CE_DEMO_ERRORES_IMPORT = [
    { label: 'CURP con formato inconsistente', n: 12 },
    { label: 'Clave de materia no catalogada', n: 8 },
    { label: 'Matrícula inexistente en ciclo', n: 5 },
];

export const CE_DEMO_REPORTES_FRECUENTES = [
    { nombre: 'Reporte de matrícula', ciclo: '2024-2025', estatus: 'Disponible' },
    { nombre: 'Reporte de inscripciones', ciclo: '2024-2025', estatus: 'Disponible' },
    { nombre: 'Reporte de reinscripciones', ciclo: '2024-2025', estatus: 'En proceso' },
    { nombre: 'Reporte de expedientes incompletos', ciclo: '2024-2025', estatus: 'Disponible' },
    { nombre: 'Reporte de calificaciones pendientes', ciclo: '2024-2025', estatus: 'Disponible' },
    { nombre: 'Reporte de documentos observados', ciclo: '2024-2025', estatus: 'Disponible' },
    { nombre: 'Reporte de solicitudes de matrícula', ciclo: '2024-2025', estatus: 'Disponible' },
    { nombre: 'Reporte de importaciones con error', ciclo: '2024-2025', estatus: 'Disponible' },
    { nombre: 'Reporte de trayectoria académica', ciclo: '2024-2025', estatus: 'Disponible' },
];

/** Importaciones */
export const CE_DEMO_IMPORTACIONES = [
    { folio: 'IMP-2025-012', archivo: 'calificaciones_6to_semestre.csv', alumno: 'Varios / 6° — Primaria', registros: 48, errores: 2, estado: 'Con errores' },
    { folio: 'IMP-2025-011', archivo: 'kardex_lote1.xlsx', alumno: 'UPN 151 / Pedagogía', registros: 120, errores: 0, estado: 'Prevalidada' },
    { folio: 'IMP-2025-010', archivo: 'altas_aspirantes.xlsx', alumno: 'Normal Valle Toluca', registros: 34, errores: 0, estado: 'Pendiente de conciliación' },
    { folio: 'IMP-2025-009', archivo: 'equivalencias_periodo.xlsx', alumno: 'UPN 153 Ecatepec', registros: 56, errores: 0, estado: 'Confirmada' },
];

/** Observaciones */
export const CE_DEMO_OBSERVACIONES = [
    { folio: 'OBS-2025-033', alumno: 'María Fernanda López Ruiz', modulo: 'Expediente', texto: 'Falta digitalizar acta de nacimiento legible.', prioridad: 'Alta', estado: 'Pendiente', fecha: '20/05/2025' },
    { folio: 'OBS-2025-028', alumno: 'José Andrés Martínez Díaz', modulo: 'Calificaciones', texto: 'Captura incompleta en periodo 2024-1.', prioridad: 'Media', estado: 'Devuelta', fecha: '19/05/2025' },
];

/** Notificaciones */
export const CE_DEMO_NOTIFICACIONES = [
    { titulo: 'Recordatorio: cierre de validación documental', cat: 'Académicas', fecha: '20/05/2025', leida: false, critica: false },
    { titulo: 'Solicitud SOL-2025-0044 en revisión', cat: 'Solicitudes', fecha: '19/05/2025', leida: false, critica: true },
    { titulo: 'Importación IMP-2025-012 con errores', cat: 'Importaciones', fecha: '18/05/2025', leida: true, critica: false },
];

/** Dashboard — donut alumnos por estatus (proporciones referencia) */
export const CE_DASHBOARD_ESTATUS_ALUMNOS = [
    { key: 'activos', label: 'Activos', color: '#16a34a', count: 2124, pct: 74.6 },
    { key: 'baja_temp', label: 'Baja temporal', color: '#ca8a04', count: 196, pct: 6.9 },
    { key: 'baja_def', label: 'Baja definitiva', count: 142, pct: 5.0, color: '#dc2626' },
    { key: 'egresado', label: 'Egresado', color: '#7c3aed', count: 312, pct: 11.0 },
    { key: 'inactivos', label: 'Inactivos', color: '#64748b', count: 71, pct: 2.5 },
];

export function ceTotalAlumnosEstatus() {
    return CE_DASHBOARD_ESTATUS_ALUMNOS.reduce((s, r) => s + r.count, 0);
}

/** Procesos recientes (tabla dashboard) */
export const CE_DEMO_PROCESOS_RECIENTES = [
    { alumno: 'María Fernanda López Ruiz', matricula: 'ENSVT-2024-0142', tramite: 'Inscripción de periodo', fecha: '20/05/2025 08:50', estatus: 'En proceso' },
    { alumno: 'José Andrés Martínez Díaz', matricula: 'UPN151-2023-0891', tramite: 'Carga académica', fecha: '19/05/2025 15:22', estatus: 'En revisión' },
    { alumno: 'Ana Paula García Torres', matricula: 'ENSVM-2024-0201', tramite: 'Reinscripción', fecha: '19/05/2025 10:11', estatus: 'Concluido' },
    { alumno: 'Diego Alejandro Pérez Soto', matricula: 'UPN152-2022-0550', tramite: 'Constancia de estudios', fecha: '18/05/2025 12:03', estatus: 'Concluido' },
];
