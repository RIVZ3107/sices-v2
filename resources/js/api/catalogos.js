import { apiGet } from "./client";

export const catalogosApi = {
    ciclosEscolares: () => apiGet("/certificacion/catalogos/ciclos-escolares"),
    subsistemas: () => apiGet("/certificacion/catalogos/subsistemas"),
    regiones: () => apiGet("/certificacion/catalogos/regiones"),
    instituciones: (params = {}) => apiGet("/certificacion/catalogos/instituciones", { params }),
    sedes: (params = {}) => apiGet("/certificacion/catalogos/sedes", { params }),
    programas: (params = {}) =>
        apiGet("/certificacion/catalogos/programas", { params }),
    planesEstudio: (params = {}) =>
        apiGet("/certificacion/catalogos/planes-estudio", { params }),
    ofertasAcademicas: (params = {}) =>
        apiGet("/certificacion/catalogos/ofertas-academicas", { params }),
    tiposDocumentosAcademicos: (params = {}) =>
        apiGet("/catalogos/documentos-academicos/tipos", { params }),
    tipoDocumentoAcademico: (tipo, params = {}) =>
        apiGet(`/catalogos/documentos-academicos/tipos/${tipo}`, { params }),
};
