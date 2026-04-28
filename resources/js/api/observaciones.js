import { apiGet, apiPost } from './client';

export const observacionesApi = {
    listar: (documentoId, params = {}) => apiGet(`/certificacion/documentos-academicos/${documentoId}/observaciones`, { params }),
    crear: (documentoId, payload) => apiPost(`/certificacion/documentos-academicos/${documentoId}/observaciones`, payload),
    atender: (documentoId, observacionId, payload) => apiPost(`/certificacion/documentos-academicos/${documentoId}/observaciones/${observacionId}/atender`, payload),
    devolver: (documentoId, payload = {}) => apiPost(`/certificacion/documentos-academicos/${documentoId}/devolver-correccion`, payload),
};
