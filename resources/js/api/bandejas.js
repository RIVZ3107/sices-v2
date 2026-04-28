import { apiGet } from './client';

export const bandejasApi = {
    porRol: (params = {}) => apiGet('/certificacion/bandejas/documentos-academicos/por-rol', { params }),
    resumen: (params = {}) => apiGet('/certificacion/bandejas/documentos-academicos/resumen', { params }),
    listar: (bandeja, params = {}) => apiGet(`/certificacion/bandejas/documentos-academicos/${bandeja}`, { params }),
};
