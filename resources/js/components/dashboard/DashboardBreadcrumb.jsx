import { Link } from 'react-router-dom';

export const DASHBOARD_BREADCRUMB_HOME = { label: 'Inicio', to: '/app/dashboard' };

export function DashboardBreadcrumb({ items }) {
    if (!items?.length) return null;

    return (
        <nav className="ce-breadcrumb" aria-label="Miga de pan">
            {items.map((it, i) => (
                <span key={`${it.label}-${i}`} className="ce-breadcrumb-item">
                    {i > 0 ? <span className="ce-breadcrumb-sep">/</span> : null}
                    {it.to ? (
                        <Link to={it.to} className="ce-breadcrumb-link">
                            {it.label}
                        </Link>
                    ) : (
                        <span className="ce-breadcrumb-current">{it.label}</span>
                    )}
                </span>
            ))}
        </nav>
    );
}
