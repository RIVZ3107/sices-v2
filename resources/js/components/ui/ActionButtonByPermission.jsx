import { canAction } from '../../utils/permissions';

export function ActionButtonByPermission({
    roles = [],
    action,
    onClick,
    children,
    className = 'inst-btn inst-btn-primary text-sm',
    type = 'button',
}) {
    if (!canAction(roles, action)) return null;
    return (
        <button type={type} onClick={onClick} className={className}>
            {children}
        </button>
    );
}

