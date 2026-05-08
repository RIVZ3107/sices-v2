import { apiGet, apiPost } from './client';

export const normativaLegacyApi = {
    pendientes: (params = {}) => apiGet('/certificacion/matriculas-legacy-normativa/pendientes', { params }),
    detalle: (matriculaId) => apiGet(`/certificacion/matriculas-legacy-normativa/${matriculaId}`),
    aprobar: (matriculaId, payload = {}) =>
        apiPost(`/certificacion/matriculas-legacy-normativa/${matriculaId}/aprobar-validacion-normativa`, payload),
    rechazar: (matriculaId, payload) =>
        apiPost(`/certificacion/matriculas-legacy-normativa/${matriculaId}/rechazar-validacion-normativa`, payload),
};
