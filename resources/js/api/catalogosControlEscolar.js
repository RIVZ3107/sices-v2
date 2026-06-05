import { apiGet, apiPatch, apiPost, apiPut } from './client';

const BASE = '/catalogos-control-escolar';

export const catalogosControlEscolarApi = {
    resumen: () => apiGet(`${BASE}/resumen`),
    tiposEscala: () => apiGet(`${BASE}/escalas-calificacion/tipos`),
    estatusAcademicos: (params = {}) => apiGet(`${BASE}/estatus-academicos`, { params }),
    crearEstatusAcademico: (payload) => apiPost(`${BASE}/estatus-academicos`, payload),
    actualizarEstatusAcademico: (id, payload) => apiPut(`${BASE}/estatus-academicos/${id}`, payload),
    activarEstatusAcademico: (id, activo) => apiPatch(`${BASE}/estatus-academicos/${id}/activar`, { activo }),
    estatusMatricula: (params = {}) => apiGet(`${BASE}/estatus-matricula`, { params }),
    crearEstatusMatricula: (payload) => apiPost(`${BASE}/estatus-matricula`, payload),
    actualizarEstatusMatricula: (id, payload) => apiPut(`${BASE}/estatus-matricula/${id}`, payload),
    activarEstatusMatricula: (id, activo) => apiPatch(`${BASE}/estatus-matricula/${id}/activar`, { activo }),
    escalasCalificacion: (params = {}) => apiGet(`${BASE}/escalas-calificacion`, { params }),
    crearEscalaCalificacion: (payload) => apiPost(`${BASE}/escalas-calificacion`, payload),
    actualizarEscalaCalificacion: (id, payload) => apiPut(`${BASE}/escalas-calificacion/${id}`, payload),
    activarEscalaCalificacion: (id, activo) => apiPatch(`${BASE}/escalas-calificacion/${id}/activar`, { activo }),
};
