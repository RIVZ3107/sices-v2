import { documentosAcademicosApi } from './documentosAcademicos';

export const validacionesApi = {
    documento: (documentoId) => documentosAcademicosApi.validar(documentoId),
};
