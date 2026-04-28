import { apiGet, apiPost, apiPut } from './client';

export const alumnosApi = {
    list: (params = {}) => apiGet('/certificacion/alumnos', { params }),
    create: (payload) => apiPost('/certificacion/alumnos', payload),
    show: (id) => apiGet(`/certificacion/alumnos/${id}`),
    update: (id, payload) => apiPut(`/certificacion/alumnos/${id}`, payload),
};
