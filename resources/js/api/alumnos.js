import { apiGet, apiPost, apiPut } from './client';

export const alumnosApi = {
    list: (params = {}) => apiGet('/certificacion/alumnos', { params }),
    create: (payload) => apiPost('/certificacion/alumnos', payload),
    show: (id) => apiGet(`/certificacion/alumnos/${id}`),
    /** Resumen institucional en lenguaje humano (tabs expediente). refs solo para SPA. */
    resumenInstitucional: (id) => apiGet(`/certificacion/alumnos/${id}/resumen-institucional`),
    update: (id, payload) => apiPut(`/certificacion/alumnos/${id}`, payload),
};
