import { apiGet } from './client';

export const catalogosApi = {
    ciclosEscolares: () => apiGet('/certificacion/catalogos/ciclos-escolares'),
    subsistemas: () => apiGet('/certificacion/catalogos/subsistemas'),
    regiones: () => apiGet('/certificacion/catalogos/regiones'),
    instituciones: () => apiGet('/certificacion/catalogos/instituciones'),
    ofertasAcademicas: (params = {}) => apiGet('/certificacion/catalogos/ofertas-academicas', { params }),
};
