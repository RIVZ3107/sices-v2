import { apiGet, apiPost } from './client';

export const decNormalApi = {
    generarPayload: (documentoId) => apiPost(`/certificacion/documentos-academicos/${documentoId}/dec-normal/payload`),
    generarCadena: (documentoId) => apiPost(`/certificacion/documentos-academicos/${documentoId}/dec-normal/cadena`),
    generarXml: (documentoId) => apiPost(`/certificacion/documentos-academicos/${documentoId}/dec-normal/xml`),
    validarXml: (documentoId) => apiPost(`/certificacion/documentos-academicos/${documentoId}/dec-normal/validar-xml`),
    errores: (documentoId) => apiGet(`/certificacion/documentos-academicos/${documentoId}/dec-normal/errores`),
};
