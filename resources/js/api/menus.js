import { apiDelete, apiGet, apiPost, apiPut } from './client';

export function fetchMyMenus() {
    return apiGet('/me/menus');
}

export function fetchAdminMenus() {
    return apiGet('/admin/menus');
}

export function createAdminMenu(payload) {
    return apiPost('/admin/menus', payload);
}

export function updateAdminMenu(id, payload) {
    return apiPut(`/admin/menus/${id}`, payload);
}

export function deleteAdminMenu(id) {
    return apiDelete(`/admin/menus/${id}`);
}

export function syncMenuRoles(id, roleNames) {
    return apiPost(`/admin/menus/${id}/roles`, { role_names: roleNames });
}

export function syncMenuPermissions(id, permissionNames) {
    return apiPost(`/admin/menus/${id}/permissions`, { permission_names: permissionNames });
}
