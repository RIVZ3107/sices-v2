import { Link } from 'react-router-dom';
import { ErrorState } from '../ErrorState';
import { EsIcons } from './EsIcons';
import { EsLoadingState } from './EsLoadingState';
import { EsMetricCard } from './EsMetricCard';
import { esColors, esTheme } from './esTheme';

export function EsPageHeader({
    breadcrumbCurrent,
    title,
    subtitle,
    largeTitle = false,
    actions = null,
}) {
    return (
        <div
            style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: 16,
                marginBottom: 24,
                flexWrap: 'wrap',
            }}
        >
            <div>
                {breadcrumbCurrent ? (
                    <p style={{ margin: '0 0 4px', fontSize: 12, color: esColors.muted, fontWeight: 500 }}>
                        {breadcrumbCurrent}
                    </p>
                ) : null}
                <h1 style={largeTitle ? esTheme.titleLg : esTheme.title}>{title}</h1>
                {subtitle ? <p style={esTheme.subtitle}>{subtitle}</p> : null}
            </div>
            {actions ? (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>{actions}</div>
            ) : null}
        </div>
    );
}

/** Botón o enlace de cabecera con variante predefinida. */
export function EsHeaderAction({ to, icon, label, variant = 'secondary', onClick, type = 'button' }) {
    const variants = {
        primary: { background: '#185FA5', color: 'white', border: '1px solid #185FA5', fontWeight: 600 },
        success: { background: '#0F6E56', color: 'white', border: '1px solid #0F6E56', fontWeight: 600 },
        warn: { background: '#FEF3C7', color: '#BA7517', border: '1px solid #FEF3C7', fontWeight: 600 },
        danger: { background: '#FEE2E2', color: '#DC2626', border: '1px solid #FEE2E2', fontWeight: 600 },
        secondary: { fontWeight: 500 },
    };

    const merged = { ...esTheme.btnSecondary, ...variants[variant], textDecoration: 'none' };
    const content = (
        <>
            {icon ? EsIcons[icon] : null} {label}
        </>
    );

    if (to) {
        return (
            <Link to={to} style={merged}>
                {content}
            </Link>
        );
    }

    return (
        <button type={type} onClick={onClick} style={merged}>
            {content}
        </button>
    );
}

export function EsMetricsStrip({ metrics = [], wide = false }) {
    if (!metrics.length) return null;

    return (
        <div style={wide ? esTheme.metricsGridWide : esTheme.metricsGrid}>
            {metrics.map((m) => (
                <EsMetricCard
                    key={m.key ?? m.title}
                    icon={m.icon ?? (m.iconKey ? EsIcons[m.iconKey] : null)}
                    iconBg={m.iconBg}
                    iconColor={m.iconColor}
                    title={m.title}
                    value={m.value}
                    trend={m.trend}
                    trendPrefix={m.trendPrefix}
                    valueSize={m.valueSize}
                    flex={m.flex !== false}
                    onClick={m.onClick}
                />
            ))}
        </div>
    );
}

export function EsSearchInput({ value, onChange, placeholder = 'Buscar...', width = 280 }) {
    return (
        <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>
                {EsIcons.search}
            </span>
            <input
                type="search"
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                style={{ ...esTheme.inputSearch, width }}
            />
        </div>
    );
}

export function EsCard({ children, overflowHidden = false, style = {} }) {
    return (
        <div style={{ ...esTheme.card, overflow: overflowHidden ? 'hidden' : undefined, ...style }}>{children}</div>
    );
}

export function EsTable({ headers, children, emptyColSpan, emptyMessage }) {
    return (
        <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        {headers.map((h) => (
                            <th
                                key={h}
                                style={{
                                    ...esTheme.th,
                                    textAlign: h === 'Acciones' ? 'center' : 'left',
                                }}
                            >
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {children}
                    {emptyMessage ? (
                        <tr>
                            <td
                                colSpan={emptyColSpan ?? headers.length}
                                style={{ ...esTheme.td, textAlign: 'center', color: esColors.muted, padding: 32 }}
                            >
                                {emptyMessage}
                            </td>
                        </tr>
                    ) : null}
                </tbody>
            </table>
        </div>
    );
}

export function EsProgressBar({ label, value, total, barColor }) {
    const pct = total > 0 ? Math.round((value / total) * 100) : 0;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
                <span style={{ color: esColors.text, fontWeight: 500 }}>{label}</span>
                <span style={{ color: esColors.muted }}>
                    {value} ({pct}%)
                </span>
            </div>
            <div style={{ height: 8, background: '#f1f5f9', borderRadius: 999, overflow: 'hidden' }}>
                <div
                    style={{
                        width: `${pct}%`,
                        height: '100%',
                        background: barColor,
                        borderRadius: 999,
                        minWidth: value > 0 ? 4 : 0,
                    }}
                />
            </div>
        </div>
    );
}

/**
 * Layout estándar de pestañas Educación Superior.
 */
export function EsPageLayout({
    breadcrumbCurrent,
    title,
    subtitle,
    largeTitle = false,
    actions,
    metrics,
    metricsWide = false,
    error,
    loading,
    loadingText = 'Cargando...',
    sidebar,
    children,
    showSplit = true,
}) {
    if (loading) {
        return (
            <div className="es-page-root">
                <EsLoadingState text={loadingText} />
            </div>
        );
    }

    if (error && !children && !sidebar) {
        return (
            <div className="es-page-root">
                <ErrorState message={error} />
            </div>
        );
    }

    const body = showSplit && sidebar ? (
        <div style={esTheme.splitLayout}>
            <div>{children}</div>
            <div style={esTheme.sidebarStack}>{sidebar}</div>
        </div>
    ) : (
        children
    );

    return (
        <div className="es-page-root">
            <EsPageHeader
                breadcrumbCurrent={breadcrumbCurrent}
                title={title}
                subtitle={subtitle}
                largeTitle={largeTitle}
                actions={actions}
            />
            {error ? (
                <div style={{ marginBottom: 16 }}>
                    <ErrorState message={error} />
                </div>
            ) : null}
            <EsMetricsStrip metrics={metrics} wide={metricsWide} />
            {body}
        </div>
    );
}
