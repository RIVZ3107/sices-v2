import { apiGet, apiPost } from './client';

export const importacionesApi = {
    disponible: false,
    list: (params = {}) => apiGet('/academico/importaciones', { params }),
    create: (payload) => apiPost('/academico/importaciones', payload),
    plantilla: () => apiGet('/academico/importaciones/plantilla'),
    detalle: (id) => apiGet(`/academico/importaciones/${id}`),
    prevalidar: (id, payload = {}) => apiPost(`/academico/importaciones/${id}/prevalidar`, payload),
    confirmar: (id, payload = {}) => apiPost(`/academico/importaciones/${id}/confirmar`, payload),
    cancelar: (id, payload = {}) => apiPost(`/academico/importaciones/${id}/cancelar`, payload),
};
