import { apiGet } from './client';

export const controlEscolarApi = {
    dashboard: () => apiGet('/control-escolar/dashboard'),
    alumnos: (params = {}) => apiGet('/control-escolar/alumnos', { params }),
    expedientes: (params = {}) => apiGet('/control-escolar/expedientes', { params }),
    inscripciones: (params = {}) => apiGet('/control-escolar/inscripciones', { params }),
    reinscripciones: (params = {}) => apiGet('/control-escolar/reinscripciones', { params }),
    trayectoria: (params = {}) => apiGet('/control-escolar/trayectoria', { params }),
    calificaciones: (params = {}) => apiGet('/control-escolar/calificaciones', { params }),
    documentos: (params = {}) => apiGet('/control-escolar/documentos', { params }),
    bajasCambios: (params = {}) => apiGet('/control-escolar/bajas-cambios', { params }),
    solicitudes: (params = {}) => apiGet('/control-escolar/solicitudes', { params }),
    observaciones: (params = {}) => apiGet('/control-escolar/observaciones', { params }),
    reportes: () => apiGet('/control-escolar/reportes'),
    notificaciones: (params = {}) => apiGet('/control-escolar/notificaciones', { params }),
    importaciones: (params = {}) => apiGet('/control-escolar/importaciones', { params }),
};
