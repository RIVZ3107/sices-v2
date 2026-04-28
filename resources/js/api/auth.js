import axios from '../bootstrap';
import { apiGet, apiPost } from './client';

export async function login(payload) {
    const { data } = await axios.post('/auth/login', payload);
    return data;
}

export function me() {
    return apiGet('/auth/me');
}

export function logout() {
    return apiPost('/auth/logout');
}
