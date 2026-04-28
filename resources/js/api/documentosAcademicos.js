import { apiGet, apiPost } from './client';

export const documentosAcademicosApi = {
    list: (params = {}) => apiGet('/certificacion/documentos-academicos', { params }),
    create: (payload) => apiPost('/certificacion/documentos-academicos', payload),
    show: (id) => apiGet(`/certificacion/documentos-academicos/${id}`),
    validar: (id) => apiPost(`/certificacion/documentos-academicos/${id}/validar`),
    pasarPendiente: (id, payload = {}) => apiPost(`/certificacion/documentos-academicos/${id}/pasar-pendiente`, payload),
    enviarRevision: (id, payload = {}) => apiPost(`/certificacion/documentos-academicos/${id}/enviar-revision`, payload),
    aprobar: (id, payload = {}) => apiPost(`/certificacion/documentos-academicos/${id}/aprobar`, payload),
    rechazar: (id, payload = {}) => apiPost(`/certificacion/documentos-academicos/${id}/rechazar`, payload),
    asignarFolioInterno: (id, payload = {}) => apiPost(`/certificacion/documentos-academicos/${id}/folio-interno`, payload),
    emitirTokenConsulta: (id, payload = {}) => apiPost(`/certificacion/documentos-academicos/${id}/token-consulta-publica`, payload),
    marcarListoParaFirma: (id, payload = {}) => apiPost(`/certificacion/documentos-academicos/${id}/listo-para-firma`, payload),
};
