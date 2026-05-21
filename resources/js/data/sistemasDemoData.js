/**
 * Dataset visual técnico centralizado para el rol Sistemas (semirreal, no operación académica).
 * Las páginas consumen estos datos hasta que los endpoints estén completos.
 */

export const SIS_ROLES_LIST = [
    'superadmin',
    'sistemas',
    'educacion_superior',
    'director_escuela',
    'control_escolar_escuela',
    'responsable_admision',
    'responsable_evaluacion',
    'docente',
    'auditor',
    'alumno',
    'aspirante',
];

export const SIS_USUARIOS = [
    {
        usuario: 'admin.tecnico',
        nombre: 'Mariana Rivas Ortega',
        correo: 'mrivas@sices.gob.mx',
        rol: 'sistemas',
        alcance: 'Global',
        institucionSede: 'SEP / Coordinación técnica',
        estado: 'Activo',
        ultimoAcceso: '20/05/2025 09:12',
        mfa: 'Sí',
    },
    {
        usuario: 'super.sices',
        nombre: 'Carlos Méndez Lira',
        correo: 'cmendez@sices.gob.mx',
        rol: 'superadmin',
        alcance: 'Global',
        institucionSede: '—',
        estado: 'Activo',
        ultimoAcceso: '20/05/2025 08:55',
        mfa: 'Sí',
    },
    {
        usuario: 'es.normativa',
        nombre: 'Laura Hernández Ruiz',
        correo: 'lhernandez@sices.gob.mx',
        rol: 'educacion_superior',
        alcance: 'Institución',
        institucionSede: 'ENSVT — Planteles Normal',
        estado: 'Activo',
        ultimoAcceso: '19/05/2025 17:40',
        mfa: 'No',
    },
    {
        usuario: 'dir.ensvt',
        nombre: 'Jorge Pineda Soto',
        correo: 'jpineda@ensvt.edu.mx',
        rol: 'director_escuela',
        alcance: 'Escuela',
        institucionSede: 'ENSVT — Toluca',
        estado: 'Activo',
        ultimoAcceso: '19/05/2025 16:02',
        mfa: 'Sí',
    },
    {
        usuario: 'ce.ensvt',
        nombre: 'Ana Gómez Ferrer',
        correo: 'agomez@ensvt.edu.mx',
        rol: 'control_escolar_escuela',
        alcance: 'Escuela',
        institucionSede: 'ENSVT — Toluca',
        estado: 'Activo',
        ultimoAcceso: '20/05/2025 07:58',
        mfa: 'No',
    },
    {
        usuario: 'auditor.sep',
        nombre: 'Ricardo Vázquez Neri',
        correo: 'rvazquez@sices.gob.mx',
        rol: 'auditor',
        alcance: 'Lectura',
        institucionSede: 'SEP / Auditoría',
        estado: 'Activo',
        ultimoAcceso: '18/05/2025 11:20',
        mfa: 'Sí',
    },
];

export const SIS_DASHBOARD_METRICS = [
    { title: 'Usuarios activos', value: '128', trend: '↑ 12% vs. ayer', tone: 'blue' },
    { title: 'Roles configurados', value: '18', trend: '— sin cambios', tone: 'green' },
    { title: 'Jobs en cola', value: '24', trend: '↓ 8% vs. ayer', tone: 'orange' },
    { title: 'Integraciones operativas', value: '7/7', trend: '100% operativas', tone: 'purple' },
    { title: 'Alertas críticas', value: '3', trend: '↑ 1 vs. ayer', tone: 'red' },
    { title: 'Eventos de auditoría', value: '1,356', trend: '↑ 15% vs. ayer', tone: 'gray' },
    { title: 'Errores críticos (24 h)', value: '24', trend: '↑ 20% vs. ayer', tone: 'red' },
    { title: 'Uso almacenamiento doc.', value: '68%', trend: 'Dentro de política', tone: 'blue' },
];

export const SIS_SERVICIOS_SISTEMA = [
    { nombre: 'API principal', estado: 'Operativo', verificado: '20/05/2025 09:40' },
    { nombre: 'Autenticación', estado: 'Operativo', verificado: '20/05/2025 09:40' },
    { nombre: 'Usuarios y permisos', estado: 'Operativo', verificado: '20/05/2025 09:38' },
    { nombre: 'Catálogos', estado: 'Operativo', verificado: '20/05/2025 09:36' },
    { nombre: 'Documentos académicos', estado: 'Operativo', verificado: '20/05/2025 09:35' },
    { nombre: 'Certificación', estado: 'Operativo', verificado: '20/05/2025 09:34' },
    { nombre: 'Generador PDF', estado: 'Operativo', verificado: '20/05/2025 09:33' },
    { nombre: 'Firma SEP / SINCE', estado: 'Degradado', verificado: '20/05/2025 09:30' },
    { nombre: 'Consulta pública', estado: 'Operativo', verificado: '20/05/2025 09:28' },
    { nombre: 'Correo institucional', estado: 'Operativo', verificado: '20/05/2025 09:25' },
    { nombre: 'Almacenamiento documental', estado: 'Operativo', verificado: '20/05/2025 09:22' },
    { nombre: 'Jobs y colas', estado: 'Operativo', verificado: '20/05/2025 09:20' },
];

export const SIS_LOGS_RECientes = [
    { fecha: '20/05/2025 09:18', modulo: 'Auth.API', accion: 'login_ok', usuario: 'sistemas', ip: '10.10.1.12', resultado: 'Éxito' },
    { fecha: '20/05/2025 09:15', modulo: 'Usuarios.API', accion: 'update_user', usuario: 'sistemas', ip: '10.10.1.12', resultado: 'Éxito' },
    { fecha: '20/05/2025 09:10', modulo: 'Jobs.Scheduler', accion: 'job_retry', usuario: 'sistemas', ip: '10.10.1.12', resultado: 'Éxito' },
    { fecha: '20/05/2025 09:02', modulo: 'PDF.Service', accion: 'render_timeout', usuario: 'jobs.worker', ip: '10.10.2.3', resultado: 'Observada' },
];

export const SIS_ALERTAS_TECNICAS = [
    { texto: 'Alta tasa de errores 5xx en ventana 08:40–08:55', prioridad: 'Crítica' },
    { texto: 'Espacio en disco /var al 78%', prioridad: 'Advertencia' },
    { texto: 'Cola certificados: latencia > 12 s', prioridad: 'Advertencia' },
    { texto: 'Certificado intermediario firma caduca en 42 días', prioridad: 'Informativa' },
];

export const SIS_ROLES_TABLA = [
    { rol: 'Superadmin', usuarios: 2, permisos: 420, alcance: 'Global', estado: 'Activo' },
    { rol: 'Sistemas', usuarios: 6, permisos: 186, alcance: 'Global', estado: 'Activo' },
    { rol: 'Educación Superior', usuarios: 14, permisos: 112, alcance: 'Institución', estado: 'Activo' },
    { rol: 'Dirección de Escuela', usuarios: 38, permisos: 96, alcance: 'Escuela', estado: 'Activo' },
    { rol: 'Control Escolar', usuarios: 52, permisos: 88, alcance: 'Escuela', estado: 'Activo' },
    { rol: 'Auditor', usuarios: 9, permisos: 24, alcance: 'Lectura', estado: 'Activo' },
    { rol: 'Docente', usuarios: 412, permisos: 18, alcance: 'Grupo', estado: 'Activo' },
];

export const SIS_ROLES_METRICAS = [
    { title: 'Roles activos', value: '7', trend: '+2 vs. ciclo anterior', tone: 'blue' },
    { title: 'Permisos definidos', value: '386', trend: '+18 vs. ciclo anterior', tone: 'green' },
    { title: 'Roles personalizados', value: '4', trend: '57% del total', tone: 'purple' },
    { title: 'Conflictos detectados', value: '3', trend: 'Requieren atención', tone: 'orange' },
];

export const SIS_PERMISOS_MATRIZ = [
    { modulo: 'Dashboard', ver: true, crear: false, editar: false, administrar: true, exportar: true },
    { modulo: 'Usuarios', ver: true, crear: true, editar: true, administrar: true, exportar: true },
    { modulo: 'Roles y permisos', ver: true, crear: true, editar: true, administrar: true, exportar: true },
    { modulo: 'Menús', ver: true, crear: true, editar: true, administrar: true, exportar: false },
    { modulo: 'Catálogos', ver: true, crear: true, editar: true, administrar: true, exportar: true },
    { modulo: 'Configuración global', ver: true, crear: false, editar: true, administrar: true, exportar: true },
    { modulo: 'Integraciones', ver: true, crear: false, editar: true, administrar: true, exportar: false },
    { modulo: 'Logs', ver: true, crear: false, editar: false, administrar: false, exportar: true },
    { modulo: 'Jobs', ver: true, crear: false, editar: false, administrar: true, exportar: true },
];

export const SIS_MENUS_TABLA = [
    { nombre: 'Dashboard', ruta: '/app/dashboard', icono: 'home', orden: 1, tipo: 'Raíz', visible: true, estado: 'Activo' },
    { nombre: 'Usuarios', ruta: '/app/sistemas/usuarios', icono: 'users', orden: 2, tipo: 'Raíz', visible: true, estado: 'Activo' },
    { nombre: 'Roles y permisos', ruta: '/app/sistemas/roles-permisos', icono: 'shield', orden: 3, tipo: 'Raíz', visible: true, estado: 'Activo' },
    { nombre: 'Menús del sistema', ruta: '/app/sistemas/menus', icono: 'panel', orden: 4, tipo: 'Raíz', visible: true, estado: 'Activo' },
    { nombre: 'Reportes académicos', ruta: '/app/direccion/reportes', icono: 'report', orden: 40, tipo: 'Raíz', visible: false, estado: 'Oculto' },
];

export const SIS_CATALOGO_FILAS = [
    { nombre: 'Subsistemas', total: 4, actualizado: '18/05/2025', responsable: 'Sistemas', estado: 'Activo' },
    { nombre: 'Instituciones', total: 128, actualizado: '19/05/2025', responsable: 'Sistemas', estado: 'Activo' },
    { nombre: 'Sedes', total: 342, actualizado: '19/05/2025', responsable: 'Sistemas', estado: 'Activo' },
    { nombre: 'Municipios', total: 125, actualizado: '10/05/2025', responsable: 'Sistemas', estado: 'Activo' },
    { nombre: 'Niveles académicos', total: 6, actualizado: '02/05/2025', responsable: 'Sistemas', estado: 'Activo' },
    { nombre: 'Programas académicos', total: 214, actualizado: '17/05/2025', responsable: 'ES', estado: 'Activo' },
    { nombre: 'Planes de estudio', total: 198, actualizado: '17/05/2025', responsable: 'ES', estado: 'Activo' },
    { nombre: 'Materias', total: 1840, actualizado: '16/05/2025', responsable: 'ES', estado: 'Activo' },
    { nombre: 'Ciclos escolares', total: 12, actualizado: '01/05/2025', responsable: 'Sistemas', estado: 'Activo' },
    { nombre: 'Tipos de documento', total: 22, actualizado: '12/05/2025', responsable: 'Sistemas', estado: 'Activo' },
    { nombre: 'Tipos de trámite', total: 31, actualizado: '12/05/2025', responsable: 'Sistemas', estado: 'Activo' },
    { nombre: 'Estados de documento', total: 9, actualizado: '11/05/2025', responsable: 'Sistemas', estado: 'Activo' },
    { nombre: 'Estados de matrícula', total: 8, actualizado: '11/05/2025', responsable: 'Sistemas', estado: 'Activo' },
    { nombre: 'Estados de inscripción', total: 7, actualizado: '11/05/2025', responsable: 'Sistemas', estado: 'Activo' },
    { nombre: 'Motivos de baja', total: 14, actualizado: '09/05/2025', responsable: 'Sistemas', estado: 'Activo' },
    { nombre: 'Motivos de observación', total: 19, actualizado: '09/05/2025', responsable: 'Sistemas', estado: 'Activo' },
    { nombre: 'Plantillas documentales', total: 36, actualizado: '15/05/2025', responsable: 'Sistemas', estado: 'Activo' },
    { nombre: 'Tipos de certificación', total: 5, actualizado: '08/05/2025', responsable: 'Sistemas', estado: 'Activo' },
];

export const SIS_CATALOGO_METRICAS = [
    { title: 'Catálogos activos', value: '27', trend: '↑ 8% vs. ciclo anterior', tone: 'blue' },
    { title: 'Elementos registrados', value: '2,845', trend: '↑ 6% vs. ciclo anterior', tone: 'green' },
    { title: 'Catálogos pendientes', value: '3', trend: '↓ 25% vs. ciclo anterior', tone: 'orange' },
    { title: 'Cambios recientes', value: '48', trend: '↑ 12% vs. ciclo anterior', tone: 'purple' },
];

export const SIS_INTEGRACIONES = [
    { servicio: 'RENAPO / validación CURP', tipo: 'API REST', estado: 'Activo', ultima: '20/05/2025 08:12', responsable: 'Equipo de Sistemas' },
    { servicio: 'SEP / DGAIR', tipo: 'API REST', estado: 'Activo', ultima: '20/05/2025 07:55', responsable: 'Equipo de Sistemas' },
    { servicio: 'SINCE / firma certificados', tipo: 'SOAP / REST', estado: 'Observada', ultima: '19/05/2025 22:10', responsable: 'Infraestructura' },
    { servicio: 'Servicio de PDF (Dompdf/Browsershot)', tipo: 'Servicio interno', estado: 'Activo', ultima: '20/05/2025 09:00', responsable: 'Equipo de Sistemas' },
    { servicio: 'JasperReports', tipo: 'Motor informes', estado: 'Activo', ultima: '18/05/2025 16:40', responsable: 'Equipo de Sistemas' },
    { servicio: 'Correo SMTP institucional', tipo: 'SMTP', estado: 'Activo', ultima: '20/05/2025 06:00', responsable: 'Infraestructura' },
    { servicio: 'Almacenamiento documental', tipo: 'Object storage', estado: 'Activo', ultima: '20/05/2025 05:30', responsable: 'Infraestructura' },
    { servicio: 'Consulta pública', tipo: 'API pública', estado: 'Activo', ultima: '20/05/2025 04:00', responsable: 'Equipo de Sistemas' },
    { servicio: 'QR / verificación documental', tipo: 'Servicio interno', estado: 'Activo', ultima: '17/05/2025 12:00', responsable: 'Equipo de Sistemas' },
    { servicio: 'API institucional', tipo: 'API REST', estado: 'Activo', ultima: '20/05/2025 09:42', responsable: 'Equipo de Sistemas' },
];

export const SIS_INTEGRACION_METRICAS = [
    { title: 'Integraciones conectadas', value: '9', trend: '75% del total', tone: 'blue' },
    { title: 'Servicios con alerta', value: '1', trend: 'Revisar SINCE', tone: 'orange' },
    { title: 'Sincronizaciones hoy', value: '128', trend: '↑ 18% vs. ayer', tone: 'green' },
    { title: 'Errores recientes', value: '7', trend: '↓ 12% vs. ayer', tone: 'red' },
];

export const SIS_LOGS_TABLA = [
    { ts: '20/05/2025 09:42:11', nivel: 'Error', servicio: 'PDF.Service', mensaje: 'Timeout render plantilla certificado', ref: 'DOC-88421', estado: 'Abierta' },
    { ts: '20/05/2025 09:38:02', nivel: 'Advertencia', servicio: 'FirmaSEP.Service', mensaje: 'Latencia elevada endpoint timbrado', ref: 'SIG-1203', estado: 'En progreso' },
    { ts: '20/05/2025 09:30:55', nivel: 'Información', servicio: 'Auth.API', mensaje: 'Rotación de tokens internos', ref: 'AUTH-009', estado: 'Cerrada' },
];

export const SIS_LOGS_METRICAS = [
    { title: 'Errores críticos', value: '24', trend: '↑ 20% vs. ayer', tone: 'red' },
    { title: 'Advertencias', value: '87', trend: '↑ 12% vs. ayer', tone: 'orange' },
    { title: 'Eventos hoy', value: '1,284', trend: '↓ 8% vs. ayer', tone: 'blue' },
    { title: 'Incidencias abiertas', value: '16', trend: 'Ver detalle', tone: 'purple' },
];

export const SIS_INCIDENCIA_DETALLE = {
    id: 'INC-2025-000142',
    prioridad: 'Alta',
    resumen: 'NullReferenceException al serializar payload de firma (campo opcional nulo).',
    stack: 'at Sices.Certificacion.FirmaService.EnviarAsync(line 412)…',
    modulo: 'Certificación.API',
    tecnico: 'Carlos Méndez Lira',
    acciones: ['Aislar solicitud en cola', 'Regenerar XML', 'Reintentar firma en ventana controlada'],
};

export const SIS_JOBS_TABLA = [
    { tarea: 'Generar PDF de certificados', tipo: 'Programada', proxima: '20/05/2025 10:00', ultima: '20/05/2025 09:00', duracion: '42 s', estado: 'Completado', cola: 'certificados' },
    { tarea: 'Generar PDF de documentos', tipo: 'Programada', proxima: '20/05/2025 10:05', ultima: '20/05/2025 08:55', duracion: '18 s', estado: 'Completado', cola: 'documentos' },
    { tarea: 'Generar XML', tipo: 'Manual', proxima: '—', ultima: '20/05/2025 08:40', duracion: '6 s', estado: 'Completado', cola: 'xml' },
    { tarea: 'Enviar a firma SEP/SINCE', tipo: 'Programada', proxima: '20/05/2025 10:15', ultima: '20/05/2025 08:12', duracion: '—', estado: 'Con errores', cola: 'firma' },
    { tarea: 'Sincronizar catálogos', tipo: 'Programada', proxima: '20/05/2025 23:30', ultima: '19/05/2025 23:30', duracion: '3 m 12 s', estado: 'Completado', cola: 'catalogos' },
    { tarea: 'Validar documentos', tipo: 'Programada', proxima: '20/05/2025 11:00', ultima: '20/05/2025 07:10', duracion: '1 m 04 s', estado: 'En proceso', cola: 'validacion' },
    { tarea: 'Enviar correos programados', tipo: 'Programada', proxima: '20/05/2025 12:00', ultima: '19/05/2025 12:00', duracion: '22 s', estado: 'Completado', cola: 'correos' },
    { tarea: 'Procesar respaldo incremental', tipo: 'Programada', proxima: '21/05/2025 02:00', ultima: '20/05/2025 02:00', duracion: '48 m', estado: 'Completado', cola: 'backup' },
    { tarea: 'Limpiar archivos temporales', tipo: 'Programada', proxima: '20/05/2025 18:00', ultima: '19/05/2025 18:00', duracion: '2 m', estado: 'Completado', cola: 'mantenimiento' },
    { tarea: 'Reindexar búsqueda global', tipo: 'Manual', proxima: '—', ultima: '15/05/2025 09:00', duracion: '12 m', estado: 'Completado', cola: 'search' },
    { tarea: 'Regenerar consulta pública', tipo: 'Programada', proxima: '20/05/2025 20:00', ultima: '19/05/2025 20:00', duracion: '4 m', estado: 'Completado', cola: 'publica' },
];

export const SIS_JOBS_METRICAS = [
    { title: 'Jobs ejecutados hoy', value: '128', trend: '↑ 18% vs. ayer', tone: 'green' },
    { title: 'En cola', value: '24', trend: '↑ 8% vs. ayer', tone: 'blue' },
    { title: 'Fallidos hoy', value: '7', trend: '↑ 40% vs. ayer', tone: 'red' },
    { title: 'Workers activos', value: '6/10', trend: '60% capacidad', tone: 'purple' },
];

export const SIS_AUDITORIA_TABLA = [
    { fecha: '20/05/2025 09:42:17', usuario: 'admin.tecnico', modulo: 'Usuarios', accion: 'Creación de usuario', entidad: 'Usuario: jmartinez', resultado: 'Éxito', ip: '192.168.1.15' },
    { fecha: '20/05/2025 09:38:40', usuario: 'mhernandez', modulo: 'Roles y permisos', accion: 'Cambio de rol', entidad: 'Rol: control_escolar_escuela', resultado: 'Éxito', ip: '10.10.2.45' },
    { fecha: '20/05/2025 09:35:02', usuario: 'sistemas.bot', modulo: 'Integraciones', accion: 'Validación técnica', entidad: 'Servicio: SINCE', resultado: 'En revisión', ip: '10.10.4.2' },
];

export const SIS_AUDITORIA_METRICAS = [
    { title: 'Eventos auditados', value: '12,458', trend: '↑ 18% vs. ayer', tone: 'green' },
    { title: 'Acciones críticas', value: '37', trend: '↑ 34% vs. ayer', tone: 'red' },
    { title: 'Usuarios monitoreados', value: '126', trend: '↑ 9% vs. ayer', tone: 'blue' },
    { title: 'Cambios hoy', value: '1,284', trend: '↑ 21% vs. ayer', tone: 'purple' },
];

export const SIS_RESPALDOS_TABLA = [
    { fecha: '20/05/2025 02:00', tipo: 'Incremental', tamano: '4.2 GB', estado: 'Completado', responsable: 'sistemas.bot', ubicacion: 's3://sices-backups/inc/20250520' },
    { fecha: '19/05/2025 02:00', tipo: 'Incremental', tamano: '3.9 GB', estado: 'Completado', responsable: 'sistemas.bot', ubicacion: 's3://sices-backups/inc/20250519' },
    { fecha: '18/05/2025 02:00', tipo: 'Completo', tamano: '38 GB', estado: 'Con errores', responsable: 'sistemas.bot', ubicacion: '—' },
];

export const SIS_RESPALDOS_METRICAS = [
    { title: 'Último respaldo', value: 'Hace 7 h', trend: 'Incremental', tone: 'blue' },
    { title: 'Respaldos exitosos (7d)', value: '6', trend: '1 fallo', tone: 'green' },
    { title: 'Respaldos fallidos (7d)', value: '1', trend: 'Revisar log', tone: 'red' },
    { title: 'Espacio usado', value: '214 GB', trend: 'Política 365d', tone: 'purple' },
];

export const SIS_MONITOREO_SERIES = [
    { label: 'CPU', valor: '34%', estado: 'Normal' },
    { label: 'RAM', valor: '61%', estado: 'Normal' },
    { label: 'Disco /', valor: '72%', estado: 'Atención' },
    { label: 'Cola certificados', valor: '24 pend.', estado: 'Normal' },
    { label: 'Storage documental', valor: '68%', estado: 'Normal' },
    { label: 'T. respuesta API (p95)', valor: '420 ms', estado: 'Normal' },
    { label: 'Errores / hora', valor: '3.2', estado: 'Elevado' },
];

export const SIS_NOTIFICACIONES_TECNICAS = [
    { titulo: 'Ventana de mantenimiento', detalle: 'Actualización de dependencias PHP — 23/05 02:00', fecha: '20/05/2025' },
    { titulo: 'Rotación de secretos SMTP', detalle: 'Completada sin reinicio de workers', fecha: '19/05/2025' },
    { titulo: 'Nuevo certificado intermediario', detalle: 'Cadena publicada en ambiente pruebas', fecha: '18/05/2025' },
];

export const SIS_CONFIG_HISTORIAL = [
    { texto: 'Tiempo de sesión 45 → 30 min', usuario: 'Sistemas / Administrador técnico', cuando: '20/05/2025 08:32' },
    { texto: 'Tamaño máximo archivo 64 → 50 MB', usuario: 'Sistemas / Administrador técnico', cuando: '19/05/2025 17:10' },
];

export const SIS_CONFIG_CRITICAS = [
    { nombre: 'Política de contraseñas', badge: 'Crítica' },
    { nombre: 'Seguridad de sesión', badge: 'Crítica' },
    { nombre: 'Respaldos y recuperación', badge: 'Media' },
];
