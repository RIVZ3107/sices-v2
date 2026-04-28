import { apiGet, apiPost } from './client';

export const matriculasApi = {
    list: (params = {}) => apiGet('/certificacion/matriculas', { params }),
    create: (payload) => apiPost('/certificacion/matriculas', payload),
    show: (id) => apiGet(`/certificacion/matriculas/${id}`),
};
