import { apiGet } from './client';

export const educacionSuperiorApi = {
    metricas: () => apiGet('/educacion-superior/metricas'),
    reportesOficiales: () => apiGet('/educacion-superior/reportes-oficiales'),
};
