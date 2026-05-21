import { apiGet } from "./client";

export const catalogosApi = {
    ciclosEscolares: () => apiGet("/certificacion/catalogos/ciclos-escolares"),
    subsistemas: () => apiGet("/certificacion/catalogos/subsistemas"),
    regiones: () => apiGet("/certificacion/catalogos/regiones"),
    instituciones: () => apiGet("/certificacion/catalogos/instituciones"),
    sedes: (params = {}) => apiGet("/catalogos/sedes", { params }),
    programas: (params = {}) =>
        apiGet("/certificacion/catalogos/programas", { params }),
    planesEstudio: (params = {}) =>
        apiGet("/certificacion/catalogos/planes-estudio", { params }),
    ofertasAcademicas: (params = {}) =>
        apiGet("/certificacion/catalogos/ofertas-academicas", { params }),
};
