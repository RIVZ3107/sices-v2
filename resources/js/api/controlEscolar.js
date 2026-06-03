import axios from '../bootstrap';
import { apiGet, apiPost, apiPut } from './client';

export const controlEscolarApi = {
    dashboard: () => apiGet('/control-escolar/dashboard'),
    alumnos: (params = {}) => apiGet('/control-escolar/alumnos', { params }),
    alumnosResumen: () => apiGet('/control-escolar/alumnos/resumen'),
    alumnosRecientes: (params = {}) => apiGet('/control-escolar/alumnos/recientes', { params }),
    alumnosCrear: (payload) => apiPost('/control-escolar/alumnos', payload),
    alumnosImportar: async (file) => {
        const form = new FormData();
        form.append('archivo', file);
        const { data } = await axios.post('/api/v1/control-escolar/alumnos/importar-csv', form, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return data;
    },
    alumnosExportar: async (params = {}) => {
        const response = await axios.get('/api/v1/control-escolar/alumnos/exportar', {
            params,
            responseType: 'blob',
        });
        const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `alumnos_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    },    expedientes: (params = {}) => apiGet('/control-escolar/expedientes', { params }),
    expedientesResumen: () => apiGet('/control-escolar/expedientes/resumen'),
    expedientesDocumentosRequeridos: () => apiGet('/control-escolar/expedientes/documentos-requeridos'),
    expedientesActividad: (params = {}) => apiGet('/control-escolar/expedientes/actividad-reciente', { params }),
    expedientesCrear: (payload) => apiPost('/control-escolar/expedientes', payload),
    expedientesValidar: (alumnoId, payload = {}) => apiPost(`/control-escolar/expedientes/${alumnoId}/validar`, payload),
    expedientesObservar: (alumnoId, payload) => apiPost(`/control-escolar/expedientes/${alumnoId}/observar`, payload),
    expedientesValidarMasivo: (payload) => apiPost('/control-escolar/expedientes/validar-masivo', payload),
    expedientesObservarMasivo: (payload) => apiPost('/control-escolar/expedientes/observar-masivo', payload),
    expedientesCargarDocumento: async (alumnoId, formData) => {
        const { data } = await axios.post(`/api/v1/control-escolar/expedientes/${alumnoId}/documentos`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return data;
    },
    expedientesExportar: async (params = {}) => {
        const response = await axios.get('/api/v1/control-escolar/expedientes/exportar', {
            params,
            responseType: 'blob',
        });
        const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `expedientes_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    },
    inscripciones: (params = {}) => apiGet('/control-escolar/inscripciones', { params }),
    reinscripciones: (params = {}) => apiGet('/control-escolar/reinscripciones', { params }),
    reinscripcionesElegibles: (params = {}) => apiGet('/control-escolar/reinscripciones/elegibles', { params }),
    reinscripcionesCrear: (payload) => apiPost('/control-escolar/reinscripciones', payload),
    reinscripcionesDesbloquear: (id, payload) => apiPost(`/control-escolar/reinscripciones/${id}/desbloquear`, payload),
    reinscripcionesCompletar: (id, payload = {}) => apiPost(`/control-escolar/reinscripciones/${id}/completar`, payload),
    reinscripcionesObservar: (id, payload) => apiPost(`/control-escolar/reinscripciones/${id}/observar`, payload),
    reinscripcionesDesbloquearMasivo: (payload) => apiPost('/control-escolar/reinscripciones/desbloquear-masivo', payload),
    reinscripcionesFicha: async (id) => {
        const response = await axios.get(`/api/v1/control-escolar/reinscripciones/${id}/ficha`, { responseType: 'blob' });
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ficha_reinscripcion_${id}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    },
    reinscripcionesExportar: async (params = {}) => {
        const response = await axios.get('/api/v1/control-escolar/reinscripciones/exportar', { params, responseType: 'blob' });
        const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reinscripciones_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    },
    trayectoria: (params = {}) => apiGet('/control-escolar/trayectoria', { params }),
    trayectoriaBuscar: (params = {}) => apiGet('/control-escolar/trayectoria/alumnos/buscar', { params }),
    trayectoriaAlumno: (alumnoId) => apiGet(`/control-escolar/trayectoria/alumnos/${alumnoId}`),
    trayectoriaResumen: (alumnoId) => apiGet(`/control-escolar/trayectoria/alumnos/${alumnoId}/resumen`),
    trayectoriaUltimoPeriodo: (alumnoId) => apiGet(`/control-escolar/trayectoria/alumnos/${alumnoId}/ultimo-periodo`),
    trayectoriaKardex: (alumnoId) => apiGet(`/control-escolar/trayectoria/alumnos/${alumnoId}/kardex`),
    trayectoriaPlan: (alumnoId) => apiGet(`/control-escolar/trayectoria/alumnos/${alumnoId}/plan-estudios`),
    trayectoriaHistorial: (alumnoId) => apiGet(`/control-escolar/trayectoria/alumnos/${alumnoId}/historial-periodos`),
    trayectoriaEstadisticas: (alumnoId) => apiGet(`/control-escolar/trayectoria/alumnos/${alumnoId}/estadisticas`),
    trayectoriaEquivalencias: (alumnoId) => apiGet(`/control-escolar/trayectoria/alumnos/${alumnoId}/equivalencias`),
    trayectoriaActividad: (alumnoId) => apiGet(`/control-escolar/trayectoria/alumnos/${alumnoId}/actividad-reciente`),
    trayectoriaKardexPdf: async (alumnoId) => {
        const response = await axios.get(`/api/v1/control-escolar/trayectoria/alumnos/${alumnoId}/kardex/pdf`, { responseType: 'blob' });
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `kardex_${alumnoId}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    },
    trayectoriaConstancia: async (alumnoId, params = {}) => {
        const response = await axios.get(`/api/v1/control-escolar/trayectoria/alumnos/${alumnoId}/constancia`, {
            params,
            responseType: 'blob',
        });
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `constancia_${alumnoId}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    },
    trayectoriaExportar: async (alumnoId) => {
        const response = await axios.get(`/api/v1/control-escolar/trayectoria/alumnos/${alumnoId}/exportar`, { responseType: 'blob' });
        const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `trayectoria_${alumnoId}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    },
    calificaciones: (params = {}) => apiGet('/control-escolar/calificaciones', { params }),
    calificacionesResumen: (params = {}) => apiGet('/control-escolar/calificaciones/resumen', { params }),
    calificacionesAvance: () => apiGet('/control-escolar/calificaciones/avance'),
    calificacionesPendientes: () => apiGet('/control-escolar/calificaciones/pendientes-atencion'),
    calificacionesFechas: () => apiGet('/control-escolar/calificaciones/fechas-importantes'),
    calificacionesGrupo: (key) => apiGet(`/control-escolar/calificaciones/${encodeURIComponent(key)}`),
    calificacionesAlumnos: (key) => apiGet(`/control-escolar/calificaciones/${encodeURIComponent(key)}/alumnos`),
    calificacionesCapturar: (key, payload) => apiPost(`/control-escolar/calificaciones/${encodeURIComponent(key)}/capturar`, payload),
    calificacionesHistorial: (params = {}) => apiGet('/control-escolar/calificaciones/historial', { params }),
    calificacionesSolicitarCorreccion: (id, payload) => apiPost(`/control-escolar/calificaciones/${id}/solicitar-correccion`, payload),
    calificacionesCerrarCaptura: (key) => apiPost(`/control-escolar/calificaciones/${encodeURIComponent(key)}/cerrar-captura`, {}),
    calificacionesImportar: async (formData) => {
        const { data } = await axios.post('/api/v1/control-escolar/calificaciones/importar', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return data;
    },
    calificacionesPlantilla: async (params = {}) => {
        const response = await axios.get('/api/v1/control-escolar/calificaciones/plantilla', { params, responseType: 'blob' });
        const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'plantilla_calificaciones.csv';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    },
    calificacionesExportar: async (params = {}) => {
        const response = await axios.get('/api/v1/control-escolar/calificaciones/exportar', { params, responseType: 'blob' });
        const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `calificaciones_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    },
    calificacionesExportarGrupo: async (key) => {
        const response = await axios.get(`/api/v1/control-escolar/calificaciones/${encodeURIComponent(key)}/exportar`, { responseType: 'blob' });
        const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `calificaciones_grupo.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    },
    documentos: (params = {}) => apiGet('/control-escolar/documentos', { params }),
    documentosIndex: (params = {}) => apiGet('/control-escolar/documentos', { params }),
    documentosResumen: (params = {}) => apiGet('/control-escolar/documentos/resumen', { params }),
    documentosTiposAutorizados: () => apiGet('/control-escolar/documentos/tipos-autorizados'),
    documentosPendientes: () => apiGet('/control-escolar/documentos/pendientes-atencion'),
    documentosFechas: () => apiGet('/control-escolar/documentos/fechas-importantes'),
    documentosShow: (id) => apiGet(`/control-escolar/documentos/${id}`),
    documentosCrear: (body) => apiPost('/control-escolar/documentos', body),
    documentosActualizar: (id, body) => apiPut(`/control-escolar/documentos/${id}`, body),
    documentosEnviarValidacion: (id, body) => apiPost(`/control-escolar/documentos/${id}/enviar-validacion`, body),
    documentosAtenderObservacion: (id, body) => apiPost(`/control-escolar/documentos/${id}/atender-observacion`, body),
    documentosCancelar: (id, body) => apiPost(`/control-escolar/documentos/${id}/cancelar`, body),
    documentosExportar: async (params = {}) => {
        const response = await axios.get('/api/v1/control-escolar/documentos/exportar', { params, responseType: 'blob' });
        const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `documentos_escolares_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    },
    documentosDescargar: async (id) => {
        const response = await axios.get(`/api/v1/control-escolar/documentos/${id}/descargar`, { responseType: 'blob' });
        const blob = new Blob([response.data], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `documento_${id}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    },
    bajasCambios: (params = {}) => apiGet('/control-escolar/bajas-cambios', { params }),
    bajasCambiosIndex: (params = {}) => apiGet('/control-escolar/bajas-cambios', { params }),
    bajasCambiosResumen: (params = {}) => apiGet('/control-escolar/bajas-cambios/resumen', { params }),
    bajasCambiosFlujo: () => apiGet('/control-escolar/bajas-cambios/flujo'),
    bajasCambiosRiesgo: () => apiGet('/control-escolar/bajas-cambios/riesgo-operativo'),
    bajasCambiosMotivos: () => apiGet('/control-escolar/bajas-cambios/motivos-frecuentes'),
    bajasCambiosRecientes: () => apiGet('/control-escolar/bajas-cambios/cambios-recientes'),
    bajasCambiosCrear: (body) => apiPost('/control-escolar/bajas-cambios', body),
    bajasCambiosAprobar: (id, body) => apiPost(`/control-escolar/bajas-cambios/${id}/aprobar`, body),
    bajasCambiosRechazar: (id, body) => apiPost(`/control-escolar/bajas-cambios/${id}/rechazar`, body),
    bajasCambiosObservar: (id, body) => apiPost(`/control-escolar/bajas-cambios/${id}/observar`, body),
    bajasCambiosAplicar: (id) => apiPost(`/control-escolar/bajas-cambios/${id}/aplicar`, {}),
    bajasCambiosRevisar: (id) => apiPost(`/control-escolar/bajas-cambios/${id}/revisar`, {}),
    bajasCambiosAprobarMasivo: (body) => apiPost('/control-escolar/bajas-cambios/aprobar-masivo', body),
    bajasCambiosRechazarMasivo: (body) => apiPost('/control-escolar/bajas-cambios/rechazar-masivo', body),
    bajasCambiosExportar: async (params = {}) => {
        const response = await axios.get('/api/v1/control-escolar/bajas-cambios/exportar', { params, responseType: 'blob' });
        const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `bajas_cambios_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    },
    solicitudes: (params = {}) => apiGet('/control-escolar/solicitudes', { params }),
    observaciones: (params = {}) => apiGet('/control-escolar/observaciones', { params }),
    reportes: () => apiGet('/control-escolar/reportes'),
    notificaciones: (params = {}) => apiGet('/control-escolar/notificaciones', { params }),
    importaciones: (params = {}) => apiGet('/control-escolar/importaciones', { params }),
};
