import { apiGet } from './client';

export const certificadoVistaApi = {
    obtenerJson: (documentoId) => apiGet(`/certificacion/documentos-academicos/${documentoId}/certificado-vista-json`),
};
