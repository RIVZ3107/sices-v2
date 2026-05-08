import { apiGet } from './client';

export const controlEscolarApi = {
    dashboard: () => apiGet('/control-escolar/dashboard'),
    expedientes: (search) => apiGet('/control-escolar/expedientes', { params: { search } }),
};
