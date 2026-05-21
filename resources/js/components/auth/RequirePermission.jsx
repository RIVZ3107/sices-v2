import { Navigate } from 'react-router-dom';
import { userCan, userCanAny } from '../../utils/userPermissions';

export function RequirePermission({ permission, anyOf = [], children }) {
    const ok = permission ? userCan(permission) : userCanAny(anyOf);

    if (!ok) {
        return <Navigate to="/app/dashboard" replace />;
    }

    return children;
}
