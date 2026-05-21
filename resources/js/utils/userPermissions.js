import { getUser } from '../authStore';

export function userPermissions() {
    return getUser()?.permissions ?? [];
}

export function userCan(permission) {
    return userPermissions().includes(permission);
}

export function userCanAny(anyOf = []) {
    if (!Array.isArray(anyOf) || anyOf.length === 0) {
        return false;
    }

    const perms = userPermissions();

    return anyOf.some((p) => perms.includes(p));
}
