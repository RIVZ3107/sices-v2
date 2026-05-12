import { Link } from 'react-router-dom';

function variantClass(variant) {
    const v = variant ?? 'primary';
    if (v === 'danger') return 'inst-btn-danger';
    if (v === 'success') return 'inst-btn-success';
    if (v === 'warning') return 'inst-btn-warning';
    if (v === 'secondary') return 'inst-btn-secondary';
    return 'inst-btn-primary';
}

/**
 * Botón de acción desde el catálogo backend (`ActionResolver`) o botón clásico con `children`.
 *
 * @param {object} props
 * @param {object} [props.action] — DTO: key, label, description, route, method, enabled, disabled_reason, variant, …
 * @param {boolean} [props.hideWhenDisabled] — Si true y `action.enabled === false`, no renderiza.
 * @param {import('react').ReactNode} [props.children]
 */
export function ActionButton({
    action,
    hideWhenDisabled = false,
    children,
    onClick,
    variant = 'primary',
    disabled = false,
    type = 'button',
    className = '',
}) {
    if (action) {
        const a = action;
        if (a.enabled === false && hideWhenDisabled) {
            return null;
        }
        const cls = variantClass(a.variant);
        const title = a.enabled ? (a.description || a.label) : a.disabled_reason || a.description || a.label;
        const base = `inst-btn text-sm ${cls} ${className}`.trim();
        const inactive = a.enabled === false ? ' pointer-events-none opacity-60 cursor-not-allowed' : '';

        if (String(a.method || 'GET').toUpperCase() === 'GET' && a.route) {
            return (
                <Link
                    to={a.enabled === false ? '#' : a.route}
                    className={`${base}${inactive}`}
                    title={title}
                    aria-disabled={a.enabled === false}
                    onClick={a.enabled === false ? (e) => e.preventDefault() : undefined}
                >
                    {a.label}
                </Link>
            );
        }

        return (
            <button
                type="button"
                disabled={a.enabled === false}
                title={title}
                className={`${base}${inactive}`}
            >
                {a.label}
            </button>
        );
    }

    const cls =
        variant === 'danger'
            ? 'inst-btn-danger'
            : variant === 'success'
              ? 'inst-btn-success'
              : variant === 'warning'
                ? 'inst-btn-warning'
                : variant === 'secondary'
                  ? 'inst-btn-secondary'
                  : 'inst-btn-primary';

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`inst-btn text-sm ${cls} ${disabled ? 'cursor-not-allowed' : ''} ${className}`.trim()}
        >
            {children}
        </button>
    );
}
