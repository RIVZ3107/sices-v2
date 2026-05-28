import { apiGet, apiPost } from './client';

export const decNormalApi = {
    generarPayload: (documentoId) => apiPost(`/certificacion/documentos-academicos/${documentoId}/dec-normal/payload`),
    generarCadena: (documentoId) => apiPost(`/certificacion/documentos-academicos/${documentoId}/dec-normal/cadena`),
    generarXml: (documentoId) => apiPost(`/certificacion/documentos-academicos/${documentoId}/dec-normal/xml`),
    validarXml: (documentoId) => apiPost(`/certificacion/documentos-academicos/${documentoId}/dec-normal/validar-xml`),
    preflight: (documentoId) => apiPost(`/certificacion/documentos-academicos/${documentoId}/dec-normal/preflight`),
    errores: (documentoId) => apiGet(`/certificacion/documentos-academicos/${documentoId}/dec-normal/errores`),
    shadowExport: (documentoId) => apiPost(`/certificacion/documentos-academicos/${documentoId}/sices-legacy/shadow-export`),
};

export const firmaSinceApi = {
    config: () => apiGet('/certificacion/firma/config'),
    ejecutar: (documentoId, payload = {}) => apiPost(`/certificacion/documentos-academicos/${documentoId}/firma/ejecutar`, payload),
};
