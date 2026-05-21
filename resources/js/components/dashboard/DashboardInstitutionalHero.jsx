import { useState } from 'react';
import { DashboardBreadcrumb, DASHBOARD_BREADCRUMB_HOME } from './DashboardBreadcrumb';
import { formatDashboardUpdatedAt } from '../../utils/dashboardFormat';

const DEFAULT_BREADCRUMBS = [DASHBOARD_BREADCRUMB_HOME, { label: 'dashboard' }];

/**
 * Cabecera institucional unificada (migas, título, actualizado, exportar) + hijos (acciones KPI / embudo).
 */
export function DashboardInstitutionalHero({
    breadcrumbItems = DEFAULT_BREADCRUMBS,
    title,
    subtitle,
    showVerifiedBadge = true,
    showExportButton = true,
    updatedAt: updatedAtProp,
    children = null,
}) {
    const [fallbackUpdated] = useState(() => formatDashboardUpdatedAt());
    const displayUpdated = updatedAtProp ?? fallbackUpdated;

    return (
        <div className="ce-hero-surface">
            <DashboardBreadcrumb items={breadcrumbItems} />
            <header className="ce-page-header">
                <div>
                    <h1 className="ce-page-title">
                        {title}
                        {showVerifiedBadge ? (
                            <span className="ce-verified-badge" aria-hidden title="Verificado">
                                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M9 12l2 2 4-4" />
                                    <circle cx="12" cy="12" r="9" />
                                </svg>
                            </span>
                        ) : null}
                    </h1>
                    {subtitle ? <p className="ce-page-subtitle">{subtitle}</p> : null}
                </div>
                <div className="ce-page-header-meta">
                    <span className="ce-updated">{displayUpdated}</span>
                    {showExportButton ? (
                        <button type="button" className="inst-btn inst-btn-secondary text-sm">
                            Exportar ▾
                        </button>
                    ) : null}
                </div>
            </header>
            {children}
        </div>
    );
}
