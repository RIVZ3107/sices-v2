import { apiGet, apiPost, apiPut } from './client';

export const usuariosRolesApi = {
    listUsuarios: (params = {}) => apiGet('/admin/usuarios', { params }),
    listRoles: () => apiGet('/admin/roles'),
    createUsuario: (payload) => apiPost('/admin/usuarios', payload),
    updateUsuario: (id, payload) => apiPut(`/admin/usuarios/${id}`, payload),
};
