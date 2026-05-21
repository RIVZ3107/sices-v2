import { apiGet } from './client';

export const sicesLegacyApi = {
    health: () => apiGet('/sices-legacy/health'),
    estadoSepAlumno: (alumnoId) => apiGet(`/sices-legacy/alumnos/${alumnoId}/estado-sep`),
    estadoSepDocumento: (documentoId) => apiGet(`/sices-legacy/documentos/${documentoId}/estado-sep`),
    porCurp: (curp) => apiGet(`/sices-legacy/certificados/por-curp/${encodeURIComponent(curp)}`),
    porUrlShort: (urlShort) => apiGet(`/sices-legacy/certificados/por-url-short/${encodeURIComponent(urlShort)}`),
};
