import axios from '../bootstrap';

export function fetchMeApariencia() {
    return axios.get('me/apariencia');
}

export function fetchSistemaAparienciaList() {
    return axios.get('sistema/apariencia');
}

export function fetchSistemaAparienciaActual() {
    return axios.get('sistema/apariencia/actual');
}

export function createSistemaApariencia(payload) {
    return axios.post('sistema/apariencia', payload);
}

export function updateSistemaApariencia(id, payload) {
    return axios.put(`sistema/apariencia/${id}`, payload);
}

export function activarSistemaApariencia(id) {
    return axios.post(`sistema/apariencia/${id}/activar`);
}

export function restaurarDefaultSistemaApariencia(id) {
    return axios.post(`sistema/apariencia/${id}/restaurar-default`);
}

export function uploadSistemaAparienciaAsset(formData) {
    return axios.post('sistema/apariencia/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
}
