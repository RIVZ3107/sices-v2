import { apiGet, apiPatch, apiPost, apiPut } from './client';

const BASE = '/catalogos-academicos';

export const catalogosAcademicosApi = {
    resumen: () => apiGet(`${BASE}/resumen`),
    filtros: (params = {}) => apiGet(`${BASE}/filtros`, { params }),
    subsistemas: (params = {}) => apiGet(`${BASE}/subsistemas`, { params }),
    municipios: (params = {}) => apiGet(`${BASE}/municipios`, { params }),
    instituciones: (params = {}) => apiGet(`${BASE}/instituciones`, { params }),
    institucionDetalle: (id) => apiGet(`${BASE}/instituciones/${id}`),
    institucionSedes: (id, params = {}) => apiGet(`${BASE}/instituciones/${id}/sedes`, { params }),
    institucionOfertas: (id, params = {}) => apiGet(`${BASE}/instituciones/${id}/ofertas`, { params }),
    sedes: (params = {}) => apiGet(`${BASE}/sedes`, { params }),
    sedeOfertas: (id, params = {}) => apiGet(`${BASE}/sedes/${id}/ofertas`, { params }),
    programas: (params = {}) => apiGet(`${BASE}/programas`, { params }),
    planes: (params = {}) => apiGet(`${BASE}/planes`, { params }),
    materias: (params = {}) => apiGet(`${BASE}/materias`, { params }),
    ofertasAcademicas: (params = {}) => apiGet(`${BASE}/ofertas-academicas`, { params }),
    planMaterias: (planId, params = {}) => apiGet(`${BASE}/planes/${planId}/materias`, { params }),
    ciclosResumen: () => apiGet(`${BASE}/ciclos-escolares/resumen`),
    ciclosEscolares: (params = {}) => apiGet(`${BASE}/ciclos-escolares`, { params }),
    cicloEscolar: (id) => apiGet(`${BASE}/ciclos-escolares/${id}`),
    crearCicloEscolar: (payload) => apiPost(`${BASE}/ciclos-escolares`, payload),
    actualizarCicloEscolar: (id, payload) => apiPut(`${BASE}/ciclos-escolares/${id}`, payload),
    activarCicloEscolar: (id, activo) => apiPatch(`${BASE}/ciclos-escolares/${id}/activar`, { activo }),
    marcarCicloActual: (id) => apiPatch(`${BASE}/ciclos-escolares/${id}/marcar-actual`, {}),
    periodosEscolares: (params = {}) => apiGet(`${BASE}/periodos-escolares`, { params }),
    periodosPorCiclo: (cicloId, params = {}) => apiGet(`${BASE}/ciclos-escolares/${cicloId}/periodos`, { params }),
    crearPeriodoEscolar: (cicloId, payload) => apiPost(`${BASE}/ciclos-escolares/${cicloId}/periodos`, payload),
    actualizarPeriodoEscolar: (id, payload) => apiPut(`${BASE}/periodos-escolares/${id}`, payload),
    activarPeriodoEscolar: (id, activo) => apiPatch(`${BASE}/periodos-escolares/${id}/activar`, { activo }),
};
