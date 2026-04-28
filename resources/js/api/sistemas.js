import { bandejasApi } from './bandejas';

export const sistemasApi = {
    dashboard: async () => {
        const res = await bandejasApi.resumen();
        const data = res?.data ?? {};
        return {
            data: {
                listos_para_firma: data.listos_para_firma ?? 0,
                firmados: data.firmados ?? 0,
                error_firma: data.error_firma ?? 0,
                pendientes_tecnicos: data.pendientes_tecnicos ?? 0,
            },
        };
    },
    listosParaFirma: (params = {}) => bandejasApi.listar('listos-para-firma', params),
    firmados: (params = {}) => bandejasApi.listar('firmados', params),
    erroresFirma: (params = {}) => bandejasApi.listar('errores-firma', params),
    pendientesTecnicos: (params = {}) => bandejasApi.listar('pendientes-tecnicos', params),
};
