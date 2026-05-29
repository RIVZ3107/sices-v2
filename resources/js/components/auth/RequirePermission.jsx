import { userCan, userCanAny } from '../../utils/userPermissions';
import { InstitutionalAccessDenied } from '../ui/InstitutionalAccessDenied';

export function RequirePermission({ permission, anyOf = [], children }) {
    const ok = permission ? userCan(permission) : userCanAny(anyOf);

    if (!ok) {
        return <InstitutionalAccessDenied />;
    }

    return children;
}
