import { apiDelete, apiGet, apiPost, apiPut } from './client';

export const materiasCursadasApi = {
    list: (params = {}) => apiGet('/certificacion/materias-cursadas', { params }),
    create: (payload) => apiPost('/certificacion/materias-cursadas', payload),
    update: (id, payload) => apiPut(`/certificacion/materias-cursadas/${id}`, payload),
    remove: (id) => apiDelete(`/certificacion/materias-cursadas/${id}`),
    cargaMasiva: (payload) => apiPost('/certificacion/materias-cursadas/carga-masiva', payload),
};
