import { Navigate } from 'react-router-dom';
import { getUser } from '../../authStore';

export function RequirePermission({ permission, children }) {
    const user = getUser();
    const perms = user?.permissions ?? [];
    if (!perms.includes(permission)) {
        return <Navigate to="/app/dashboard" replace />;
    }
    return children;
}
