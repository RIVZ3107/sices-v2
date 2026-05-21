import { Link } from 'react-router-dom';
import { ErrorState } from '../ErrorState';
import { LoadingState } from '../LoadingState';
import { CeIcons } from './CeIcons';
import { CeMetricCard } from './CeMetricCard';
import { ceColors, ceHeaderVariants, ceMetricTones, ceTheme } from './ceTheme';

export function CePageHeader({
    breadcrumbCurrent,
    title,
    subtitle,
    updatedAt,
    verified = true,
    largeTitle = false,
    actions = null,
}) {
    return (
        <div style={ceTheme.pageHeaderRow}>
            <div>
                {breadcrumbCurrent ? (
                    <div style={ceTheme.breadcrumb}>
                        Control Escolar <span style={{ color: ceColors.mutedLight }}>›</span> {breadcrumbCurrent}
                    </div>
                ) : null}
                <div style={ceTheme.pageTitleRow}>
                    <h1 style={largeTitle ? ceTheme.title : ceTheme.pageTitle}>{title}</h1>
                    {verified ? CeIcons.shieldCheck : null}
                </div>
                {subtitle ? <p style={ceTheme.subtitle}>{subtitle}</p> : null}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 12 }}>
                {updatedAt !== undefined ? (
                    <p style={ceTheme.updatedText}>Actualizado: {updatedAt}</p>
                ) : null}
                {actions ? (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>{actions}</div>
                ) : null}
            </div>
        </div>
    );
}

export function CeHeaderAction({ to, icon, label, variant = 'secondary', onClick, type = 'button' }) {
    const merged = { ...ceHeaderVariants[variant] ?? ceHeaderVariants.secondary, textDecoration: 'none' };
    const content = (
        <>
            {icon} {label}
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

export function CeMetricsStrip({ metrics = [], row = true, wide = false }) {
    if (!metrics.length) return null;

    if (row) {
        return (
            <div style={ceTheme.metricsRow}>
                {metrics.map((m) => (
                    <CeMetricCard
                        key={m.key ?? m.title}
                        icon={m.icon ?? (m.iconKey ? CeIcons[m.iconKey] : null)}
                        iconBg={m.iconBg ?? ceMetricTones[m.tone]?.iconBg}
                        iconColor={m.iconColor ?? ceMetricTones[m.tone]?.iconColor}
                        title={m.title}
                        value={m.value}
                        trend={m.trend}
                        trendColor={m.trendColor}
                        trendPrefix={m.trendPrefix}
                        valueSize={m.valueSize}
                        flex={m.flex !== false}
                        compact={m.compact !== false}
                    />
                ))}
            </div>
        );
    }

    return (
        <div style={wide ? ceTheme.metricsGrid : ceTheme.metricsGrid}>
            {metrics.map((m) => (
                <CeMetricCard
                    key={m.key ?? m.title}
                    icon={m.icon ?? (m.iconKey ? CeIcons[m.iconKey] : null)}
                    iconBg={m.iconBg ?? ceMetricTones[m.tone]?.iconBg}
                    iconColor={m.iconColor ?? ceMetricTones[m.tone]?.iconColor}
                    title={m.title}
                    value={m.value}
                    trend={m.trend}
                    trendColor={m.trendColor}
                    flex={false}
                />
            ))}
        </div>
    );
}

export function CeSearchInput({ value, onChange, placeholder = 'Buscar...', width = 280 }) {
    return (
        <div style={{ position: 'relative' }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>
                {CeIcons.search}
            </span>
            <input
                type="search"
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                style={{ ...ceTheme.inputSearch, width }}
            />
        </div>
    );
}

export function CeCard({ children, overflowHidden = false, style = {} }) {
    return (
        <div style={{ ...ceTheme.card, overflow: overflowHidden ? 'hidden' : undefined, ...style }}>{children}</div>
    );
}

export function CeTable({ headers, children, emptyColSpan, emptyMessage, compact = false }) {
    const thStyle = compact ? ceTheme.thCompact : ceTheme.th;

    return (
        <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        {headers.map((h) => (
                            <th
                                key={h}
                                style={{
                                    ...thStyle,
                                    textAlign: h === 'Acciones' || h === '' ? 'center' : 'left',
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
                                style={{ ...ceTheme.td, textAlign: 'center', color: ceColors.muted, padding: 32 }}
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

export function CeErrorBanner({ children }) {
    return <p style={ceTheme.errorBanner}>{children}</p>;
}

/**
 * Layout estándar de pantallas Control Escolar.
 */
export function CePageLayout({
    breadcrumbCurrent,
    title,
    subtitle,
    updatedAt,
    verified = true,
    largeTitle = false,
    actions,
    toolbar,
    metrics,
    metricsRow = true,
    error,
    loading,
    loadingText = 'Cargando...',
    sidebar,
    children,
    showSplit = true,
    splitWide = false,
}) {
    if (loading) {
        return (
            <div style={ceTheme.pageShell}>
                <LoadingState text={loadingText} />
            </div>
        );
    }

    if (error && !children && !sidebar) {
        return (
            <div style={ceTheme.pageShell}>
                <ErrorState message={error} />
            </div>
        );
    }

    const splitStyle = splitWide ? ceTheme.splitLayout340 : ceTheme.splitLayout;
    const body = showSplit && sidebar ? (
        <div style={splitStyle}>
            <div>{children}</div>
            <div style={ceTheme.sidebarStack}>{sidebar}</div>
        </div>
    ) : (
        children
    );

    return (
        <div style={ceTheme.pageShell}>
            <CePageHeader
                breadcrumbCurrent={breadcrumbCurrent}
                title={title}
                subtitle={subtitle}
                updatedAt={updatedAt}
                verified={verified}
                largeTitle={largeTitle}
                actions={actions}
            />
            {toolbar}
            {error ? <CeErrorBanner>{error}</CeErrorBanner> : null}
            <CeMetricsStrip metrics={metrics} row={metricsRow} />
            {body}
        </div>
    );
}
