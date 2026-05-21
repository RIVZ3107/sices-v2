/**
 * Dataset visual semirreal — Responsable de Admisión (UPN / Escuelas Normales).
 * Consumo centralizado; no incluir matrícula oficial ni certificación.
 */

export const ADM_SUBSISTEMAS = ['UPN', 'Normal', 'UPN y Normal'];

export const ADM_INSTITUCIONES = [
    { id: 'upn151', nombre: 'Universidad Pedagógica Nacional Unidad 151 Toluca', tipo: 'UPN' },
    { id: 'upn152', nombre: 'Universidad Pedagógica Nacional Unidad 152 Atizapán', tipo: 'UPN' },
    { id: 'upn153', nombre: 'Universidad Pedagógica Nacional Unidad 153 Ecatepec', tipo: 'UPN' },
    { id: 'enlr', nombre: 'Escuela Normal Rural “Lázaro Cárdenas del Río”', tipo: 'Normal' },
    { id: 'ensvm', nombre: 'Escuela Normal Superior del Valle de México', tipo: 'Normal' },
    { id: 'ensvt', nombre: 'Escuela Normal Superior del Valle de Toluca', tipo: 'Normal' },
];

export const ADM_PROGRAMAS_NORMAL = [
    'Licenciatura en Educación Primaria',
    'Licenciatura en Educación Preescolar',
    'Licenciatura en Enseñanza y Aprendizaje en Telesecundaria',
    'Licenciatura en Inclusión Educativa',
    'Licenciatura en Educación Física',
];

export const ADM_PROGRAMAS_UPN = [
    'Licenciatura en Pedagogía',
    'Licenciatura en Psicología Educativa',
    'Licenciatura en Intervención Educativa',
    'Licenciatura en Educación e Innovación Pedagógica',
    'Maestría en Educación',
];

export const ADM_DASHBOARD_METRICS = [
    { title: 'Convocatorias activas', value: '3', tone: 'blue', trend: 'Ver detalle' },
    { title: 'Aspirantes registrados', value: '1.245', tone: 'green', trend: '↑ 4% vs. ciclo anterior' },
    { title: 'Preinscripciones', value: '892', tone: 'purple', trend: 'Embudo actualizado' },
    { title: 'Expedientes completos', value: '612', tone: 'orange', trend: '49,2% del total' },
    { title: 'Evaluados', value: '478', tone: 'green', trend: 'En revisión normativa' },
    { title: 'Admitidos', value: '356', tone: 'red', trend: 'Pendiente matrícula ES' },
    { title: 'Observados', value: '76', tone: 'orange', trend: 'Seguimiento documental' },
    { title: 'Rechazados', value: '52', tone: 'red', trend: 'Motivos registrados' },
];

/** Embudo proceso de admisión (pasos 1–7 + cierre hacia Educación Superior). */
export const ADM_EMBUDO_PASOS = [
    { etapa: 'Aspirante registrado', n: 1245, pct: 100, color: '#2563eb' },
    { etapa: 'Preinscripción iniciada', n: 1088, pct: 87.4, color: '#059669' },
    { etapa: 'Documentos cargados', n: 956, pct: 76.8, color: '#0d9488' },
    { etapa: 'Expediente completo', n: 612, pct: 49.2, color: '#ca8a04' },
    { etapa: 'Evaluado', n: 478, pct: 38.4, color: '#ea580c' },
    { etapa: 'Admitido', n: 356, pct: 28.6, color: '#9333ea' },
    { etapa: 'Listo para matrícula', n: 312, pct: 25.1, color: '#16a34a' },
];

export const ADM_EMBUDO_CIERRE_ES =
    'Pendiente de asignación de matrícula por Educación Superior — el aspirante admitido no genera matrícula oficial desde Admisión.';

export const ADM_PREINSC_POR_CONVOCATORIA = [
    { nombre: 'Enero — Junio 2025', n: 526, pct: 59.0, color: '#2563eb' },
    { nombre: 'Agosto — Diciembre 2025', n: 281, pct: 31.5, color: '#059669' },
    { nombre: 'Posgrados UPN 2025', n: 85, pct: 9.5, color: '#ca8a04' },
];

export const ADM_PREINSC_RECIENTES = [
    { folio: 'PRE-2025-000892', aspirante: 'María Fernanda López Ruiz', convocatoria: 'Enero — Junio 2025', programa: 'Licenciatura en Educación Primaria', fecha: '20/05/2025 10:32', estatus: 'En revisión' },
    { folio: 'PRE-2025-000891', aspirante: 'Carlos Alberto Méndez Ortiz', convocatoria: 'Enero — Junio 2025', programa: 'Licenciatura en Pedagogía', fecha: '20/05/2025 09:15', estatus: 'Validada' },
    { folio: 'PRE-2025-000890', aspirante: 'Ana Lucía Hernández García', convocatoria: 'Agosto — Diciembre 2025', programa: 'Maestría en Educación', fecha: '19/05/2025 16:40', estatus: 'Incompleta' },
];

export const ADM_EXPEDIENTES_ESTATUS = [
    { estatus: 'Completo', n: 612, pct: 49.2, color: '#16a34a' },
    { estatus: 'En revisión', n: 286, pct: 23.0, color: '#ca8a04' },
    { estatus: 'Documentos pendientes', n: 198, pct: 15.9, color: '#6366f1' },
    { estatus: 'Observado', n: 76, pct: 6.1, color: '#dc2626' },
    { estatus: 'Rechazado', n: 52, pct: 4.2, color: '#64748b' },
];

export const ADM_PROXIMAS_ACTIVIDADES = [
    { titulo: 'Último día de registro — Conv. Ene–Jun 2025', fecha: '20 may', prioridad: 'alta' },
    { titulo: 'Inicio de registro — Conv. Ago–Dic 2025', fecha: '02 jun', prioridad: 'media' },
    { titulo: 'Examen de ingreso — sede UPN 151', fecha: '08 jun', prioridad: 'media' },
    { titulo: 'Publicación de resultados — Normal Valle México', fecha: '18 jun', prioridad: 'baja' },
];

export const ADM_NOTIF_RECIENTES = [
    { titulo: 'Nueva convocatoria publicada', texto: 'Agosto — Diciembre 2025 (UPN 152).', hora: 'Hace 2 h' },
    { titulo: 'Documentos pendientes', texto: '12 expedientes requieren comprobante.', hora: 'Hace 5 h' },
    { titulo: 'Transición a Educación Superior', texto: '8 admitidos pendientes de asignación de matrícula.', hora: 'Ayer' },
];

export const ADM_CONVOCATORIAS = [
    {
        nombre: 'Enero — Junio 2025',
        periodo: 'Ene — Jun 2025',
        subsistema: 'UPN y Normal',
        institucion: 'UPN 151 Toluca / ENS Valle de Toluca',
        programas: 'Primaria, Preescolar, Pedagogía',
        registro: '08/01/2025 — 14/02/2025',
        evaluacion: '01/03/2025 — 15/06/2025',
        publicacion: '20/06/2025',
        cupo: 1350,
        estatus: 'Activa',
    },
    {
        nombre: 'Agosto — Diciembre 2025',
        periodo: 'Ago — Dic 2025',
        subsistema: 'UPN',
        institucion: 'UPN 152 Atizapán',
        programas: 'Psicología Educativa, Intervención Educativa',
        registro: '01/07/2025 — 15/08/2025',
        evaluacion: '20/08/2025 — 30/11/2025',
        publicacion: '05/12/2025',
        cupo: 420,
        estatus: 'Próxima',
    },
    {
        nombre: 'Normal Valle de México 2025',
        periodo: 'Feb — Jul 2025',
        subsistema: 'Normal',
        institucion: 'ENS Valle de México',
        programas: 'Telesecundaria, Inclusión Educativa',
        registro: '10/02/2025 — 28/02/2025',
        evaluacion: '10/03/2025 — 30/04/2025',
        publicacion: '12/05/2025',
        cupo: 280,
        estatus: 'Activa',
    },
    {
        nombre: 'Borrador posgrado UPN 153',
        periodo: '2025',
        subsistema: 'UPN',
        institucion: 'UPN 153 Ecatepec',
        programas: 'Maestría en Educación',
        registro: '—',
        evaluacion: '—',
        publicacion: '—',
        cupo: 60,
        estatus: 'Borrador',
    },
];

export const ADM_ASPIRANTES = [
    { folio: 'ASP-2025-0001245', nombre: 'María Fernanda López Ruiz', curp: 'LORM850101MDFPLR09', convocatoria: 'Enero — Junio 2025', subsistema: 'Normal', programa: 'Licenciatura en Educación Primaria', sede: 'ENS Valle de Toluca', fecha: '20/05/2025 10:32', estatus: 'Registrado' },
    { folio: 'ASP-2025-0001244', nombre: 'Carlos Alberto Méndez Ortiz', curp: 'MEOC920315HDFRRL08', convocatoria: 'Enero — Junio 2025', subsistema: 'UPN', programa: 'Licenciatura en Pedagogía', sede: 'UPN 151 Toluca', fecha: '19/05/2025 14:20', estatus: 'En revisión' },
    { folio: 'ASP-2025-0001243', nombre: 'Ana Lucía Hernández García', curp: 'HEGA881112MDFRNN07', convocatoria: 'Agosto — Diciembre 2025', subsistema: 'UPN', programa: 'Maestría en Educación', sede: 'UPN 152 Atizapán', fecha: '18/05/2025 09:05', estatus: 'Documentos pendientes' },
    { folio: 'ASP-2025-0001242', nombre: 'Brandon Isaías Cruz Ríos', curp: 'CURB010101HDFRRR01', convocatoria: 'Enero — Junio 2025', subsistema: 'Normal', programa: 'Licenciatura en Educación Física', sede: 'Normal Rural Lázaro Cárdenas', fecha: '17/05/2025 11:40', estatus: 'Duplicado probable' },
];

export const ADM_PREINSCRIPCIONES = [
    { folio: 'PRE-2025-000124', aspirante: 'Sofía Guadalupe Ortega Peña', convocatoria: 'Enero — Junio 2025', subsistema: 'Normal', programa: 'Licenciatura en Educación Preescolar', sede: 'ENS Valle de México', fecha: '20/05/2025 08:10', docsPct: 100, docsLabel: '9/9', estatus: 'Validada' },
    { folio: 'PRE-2025-000123', aspirante: 'Jorge Luis Ramírez Soto', convocatoria: 'Enero — Junio 2025', subsistema: 'UPN', programa: 'Licenciatura en Psicología Educativa', sede: 'UPN 153 Ecatepec', fecha: '19/05/2025 16:22', docsPct: 67, docsLabel: '6/9', estatus: 'En revisión' },
    { folio: 'PRE-2025-000122', aspirante: 'Diana Paola Núñez Ibarra', convocatoria: 'Normal Valle de México 2025', subsistema: 'Normal', programa: 'Licenciatura en Inclusión Educativa', sede: 'ENS Valle de México', fecha: '19/05/2025 12:01', docsPct: 33, docsLabel: '3/9', estatus: 'Incompleta' },
];

export const ADM_EXPEDIENTES = [
    { folio: 'EXP-2025-000124', aspirante: 'Carlos Alberto Méndez Ortiz', convocatoria: 'Enero — Junio 2025', subsistema: 'UPN', programa: 'Licenciatura en Pedagogía', progreso: 86, responsable: 'M. en E. Laura Rivas', estatus: 'En revisión' },
    { folio: 'EXP-2025-000123', aspirante: 'María Fernanda López Ruiz', convocatoria: 'Enero — Junio 2025', subsistema: 'Normal', programa: 'Licenciatura en Educación Primaria', progreso: 100, responsable: 'Lcda. Irene Fuentes', estatus: 'Completo' },
    { folio: 'EXP-2025-000122', aspirante: 'Ana Lucía Hernández García', convocatoria: 'Agosto — Diciembre 2025', subsistema: 'UPN', programa: 'Maestría en Educación', progreso: 40, responsable: 'Mtro. Hugo Sánchez', estatus: 'Documentos pendientes' },
];

export const ADM_EXPEDIENTE_DETALLE_DOC = [
    { doc: 'Acta de nacimiento', estado: 'Validado' },
    { doc: 'CURP', estado: 'Validado' },
    { doc: 'Certificado de bachillerato', estado: 'Validado' },
    { doc: 'Identificación oficial', estado: 'Validado' },
    { doc: 'Comprobante de domicilio', estado: 'Validado' },
    { doc: 'Fotografía', estado: 'Validado' },
    { doc: 'Comprobante de pago', estado: 'Pendiente' },
];

export const ADM_EVALUACIONES = [
    { folio: 'PRE-2025-000892', aspirante: 'María Fernanda López Ruiz', convocatoria: 'Enero — Junio 2025', programa: 'Licenciatura en Educación Primaria', tipo: 'Examen de ingreso', fecha: '08/06/2025', puntaje: '88', recomendacion: 'Aprobado', estatus: 'Evaluado' },
    { folio: 'PRE-2025-000891', aspirante: 'Carlos Alberto Méndez Ortiz', convocatoria: 'Enero — Junio 2025', programa: 'Licenciatura en Pedagogía', tipo: 'Entrevista', fecha: '10/06/2025', puntaje: '—', recomendacion: 'En espera', estatus: 'Pendiente' },
    { folio: 'PRE-2025-000890', aspirante: 'Jorge Luis Ramírez Soto', convocatoria: 'Enero — Junio 2025', programa: 'Licenciatura en Psicología Educativa', tipo: 'Evaluación documental', fecha: '05/06/2025', puntaje: '92', recomendacion: 'Aprobado', estatus: 'Evaluado' },
];

export const ADM_RESULTADOS = [
    { folio: 'RES-2025-000501', aspirante: 'María Fernanda López Ruiz', convocatoria: 'Enero — Junio 2025', programa: 'Licenciatura en Educación Primaria', puntaje: '88', resultado: 'Admitido', publicacion: '18/06/2025', transicion: 'Pendiente de asignación de matrícula por Educación Superior' },
    { folio: 'RES-2025-000500', aspirante: 'Carlos Alberto Méndez Ortiz', convocatoria: 'Enero — Junio 2025', programa: 'Licenciatura en Pedagogía', puntaje: '81', resultado: 'Lista de espera', publicacion: '—', transicion: '—' },
    { folio: 'RES-2025-000499', aspirante: 'Diana Paola Núñez Ibarra', convocatoria: 'Normal Valle de México 2025', programa: 'Licenciatura en Inclusión Educativa', puntaje: '74', resultado: 'No admitido', publicacion: '12/05/2025', transicion: '—' },
];

export const ADM_REPORTES_CATALOGO = [
    { nombre: 'Aspirantes por convocatoria', desc: 'Corte por periodo y subsistema.', formato: 'PDF', ultima: '19/05/2025 14:10' },
    { nombre: 'Conversión por programa', desc: 'Embudo y tasas por programa UPN/Normal.', formato: 'XLS', ultima: '18/05/2025 09:00' },
    { nombre: 'Expedientes pendientes', desc: 'Faltantes documentales y responsables.', formato: 'PDF', ultima: '17/05/2025 11:22' },
];

export const ADM_NOTIFICACIONES = [
    { tipo: 'Preinscripción recibida', destinatario: 'aspirante.892@correo.edu.mx', asunto: 'Recepción de preinscripción PRE-2025-000892', canal: 'Correo', fecha: '20/05/2025 10:35', estado: 'Enviada' },
    { tipo: 'Resultado publicado', destinatario: 'm.lopez@correo aspirante', asunto: 'Resultado admitido — pendiente matrícula ES', canal: 'Correo', fecha: '18/06/2025 08:00', estado: 'Leída' },
    { tipo: 'Documento pendiente', destinatario: 'c.mendez@correo aspirante', asunto: 'Falta comprobante de pago', canal: 'Sistema', fecha: '19/05/2025 15:40', estado: 'No leída' },
];

export const ADM_ACTIVIDAD_RECIENTE = [
    { texto: "Convocatoria 'Agosto — Diciembre 2025' actualizada", usuario: 'Responsable de Admisión', hora: 'Hace 1 día' },
    { texto: "Se validó preinscripción PRE-2025-000891", usuario: 'Laura Rivas', hora: 'Hace 2 h' },
];

export const ADM_CALENDARIO_CLAVES = [
    { fecha: 'Hoy, 20 de mayo', texto: 'Último día de registro — Ene–Jun 2025', tono: 'rojo' },
    { fecha: '02 de junio', texto: 'Inicio de registro — Ago–Dic 2025', tono: 'naranja' },
    { fecha: '11 de agosto', texto: 'Inicio de evaluación documental UPN 152', tono: 'azul' },
];

export const ADM_FUNNEL_PREINSCRIPCION = [
    { etapa: 'Iniciadas', n: 2148, pct: 100, color: '#2563eb' },
    { etapa: 'En revisión', n: 1026, pct: 47.8, color: '#ca8a04' },
    { etapa: 'Documentos completos', n: 812, pct: 37.8, color: '#059669' },
    { etapa: 'Validadas', n: 557, pct: 25.9, color: '#16a34a' },
    { etapa: 'Convertidas', n: 356, pct: 16.6, color: '#9333ea' },
];

export const ADM_CONVOCATORIAS_METRICS = [
    { title: 'Convocatorias activas', value: '3', tone: 'blue', trend: 'Ver activas' },
    { title: 'Borradores', value: '2', tone: 'neutral', trend: 'Ver borradores' },
    { title: 'Próximas por abrir', value: '1', tone: 'orange', trend: 'Ver próximas' },
    { title: 'Cerradas', value: '7', tone: 'green', trend: 'Ver cerradas' },
];

export const ADM_ASPIRANTES_METRICS = [
    { title: 'Aspirantes registrados', value: '1.245', tone: 'green', trend: 'Ver todos' },
    { title: 'Nuevos hoy', value: '37', tone: 'blue', trend: 'Ver detalles' },
    { title: 'Pendientes de revisión', value: '286', tone: 'orange', trend: 'Ver pendientes' },
    { title: 'Duplicados detectados', value: '52', tone: 'red', trend: 'Revisar duplicados' },
    { title: 'Con documentos pendientes', value: '198', tone: 'purple', trend: 'Ver documentos' },
];

export const ADM_PREINSCRIPCIONES_METRICS = [
    { title: 'Preinscripciones totales', value: '2.148', tone: 'blue', trend: 'Ver detalle' },
    { title: 'En revisión', value: '1.026', tone: 'orange', trend: '47,7% del total' },
    { title: 'Incompletas', value: '462', tone: 'red', trend: '21,5% del total' },
    { title: 'Rechazadas', value: '103', tone: 'red', trend: '4,8% del total' },
    { title: 'Validadas', value: '557', tone: 'green', trend: '25,9% del total' },
];

export const ADM_EXPEDIENTES_METRICS = [
    { title: 'Expedientes completos', value: '612', tone: 'blue', trend: '49,2% del total' },
    { title: 'En revisión', value: '286', tone: 'orange', trend: '23,0% del total' },
    { title: 'Observados', value: '76', tone: 'red', trend: '6,1% del total' },
    { title: 'Documentos pendientes', value: '198', tone: 'purple', trend: '15,9% del total' },
    { title: 'Rechazados', value: '52', tone: 'neutral', trend: '4,2% del total' },
];

export const ADM_EVALUACIONES_METRICS = [
    { title: 'Evaluaciones programadas', value: '48', tone: 'blue', trend: 'Ver calendario' },
    { title: 'Evaluados', value: '612', tone: 'green', trend: 'Ver detalle' },
    { title: 'Pendientes', value: '286', tone: 'orange', trend: 'Ver pendientes' },
    { title: 'Aprobados', value: '378', tone: 'green', trend: 'Ver aprobados' },
    { title: 'No presentados', value: '76', tone: 'red', trend: 'Ver no presentados' },
];

export const ADM_RESULTADOS_METRICS = [
    { title: 'Admitidos', value: '478', tone: 'green', trend: '46,2% del total' },
    { title: 'Lista de espera', value: '186', tone: 'orange', trend: '18,0% del total' },
    { title: 'No admitidos', value: '324', tone: 'red', trend: '31,3% del total' },
    { title: 'Resultados publicados', value: '712', tone: 'blue', trend: '68,8% del total' },
    { title: 'Pendientes de publicación', value: '324', tone: 'purple', trend: '31,2% del total' },
];

export const ADM_REPORTES_METRICS = [
    { title: 'Tasa de conversión', value: '28,6%', tone: 'green', trend: '+4,2 pp' },
    { title: 'Aspirantes por programa', value: '1.245', tone: 'blue', trend: 'Total registrados' },
    { title: 'Expedientes completos', value: '612', tone: 'orange', trend: '49,2% del total' },
    { title: 'Índice de admisión', value: '18,7%', tone: 'purple', trend: '+2,1 pp' },
];

export const ADM_NOTIFICACIONES_METRICS = [
    { title: 'No leídas', value: '28', tone: 'blue', trend: 'Ver detalle' },
    { title: 'Enviadas hoy', value: '36', tone: 'green', trend: 'Ver detalle' },
    { title: 'Recordatorios programados', value: '12', tone: 'orange', trend: 'Ver detalle' },
    { title: 'Errores de envío', value: '3', tone: 'red', trend: 'Ver detalle' },
];

export const ADM_EVAL_RESULTADOS_PROGRAMA = [
    { nombre: 'Licenciatura en Educación Primaria', n: 196, pct: 32.0, color: '#2563eb' },
    { nombre: 'Licenciatura en Pedagogía', n: 142, pct: 23.2, color: '#059669' },
    { nombre: 'Licenciatura en Educación Preescolar', n: 98, pct: 16.0, color: '#ca8a04' },
    { nombre: 'Maestría en Educación', n: 76, pct: 12.4, color: '#9333ea' },
    { nombre: 'Otros programas UPN/Normal', n: 100, pct: 16.4, color: '#64748b' },
];

export const ADM_RESULTADOS_POR_CONVOCATORIA = [
    { nombre: 'Enero — Junio 2025', n: 612, pct: 59.0, color: '#2563eb' },
    { nombre: 'Agosto — Diciembre 2025', n: 327, pct: 31.6, color: '#059669' },
    { nombre: 'Normal Valle México 2025', n: 97, pct: 9.2, color: '#ca8a04' },
];
