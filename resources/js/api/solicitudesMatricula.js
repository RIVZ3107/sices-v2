import { apiGet, apiPost } from './client';

export const solicitudesMatriculaApi = {
    index: (params = {}) => apiGet('/certificacion/solicitudes-matricula', { params }),
    ultimaPorAlumno: (alumnoId) => apiGet(`/certificacion/solicitudes-matricula/alumno/${alumnoId}`),
    crearBorrador: (payload) => apiPost('/certificacion/solicitudes-matricula', payload),
    enviar: (id) => apiPost(`/certificacion/solicitudes-matricula/${id}/enviar`),
    tomarRevision: (id) => apiPost(`/certificacion/solicitudes-matricula/${id}/tomar-revision`),
    devolverObservaciones: (id, observaciones) =>
        apiPost(`/certificacion/solicitudes-matricula/${id}/devolver-observaciones`, { observaciones }),
    atenderObservaciones: (id) => apiPost(`/certificacion/solicitudes-matricula/${id}/atender-observaciones`),
    aprobar: (id) => apiPost(`/certificacion/solicitudes-matricula/${id}/aprobar`),
    rechazar: (id, motivo_rechazo) => apiPost(`/certificacion/solicitudes-matricula/${id}/rechazar`, { motivo_rechazo }),
    asignarMatricula: (id, payload) => apiPost(`/certificacion/solicitudes-matricula/${id}/asignar-matricula`, payload),
};
