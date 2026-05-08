import { apiGet, apiPost, apiPut } from './client';

export const trayectoriasApi = {
    upsert: (payload) => apiPut('/certificacion/trayectorias-academicas', payload),
    porMatricula: (matriculaId) => apiGet(`/certificacion/matriculas/${matriculaId}/trayectoria-academica`),
    recalcular: (matriculaId) => apiPost(`/certificacion/matriculas/${matriculaId}/trayectoria-academica/recalcular`, {}),
};
