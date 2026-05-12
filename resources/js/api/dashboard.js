import { apiGet } from './client';

export function fetchDashboard() {
    return apiGet('/dashboard');
}
