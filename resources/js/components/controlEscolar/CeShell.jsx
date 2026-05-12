import { Link } from 'react-router-dom';
import { CeToolbarIcon } from './CeToolbarIcon';

/**
 * Shell visual Control Escolar (contrato: cabecera, acciones tipo card, métricas, cuerpo + panel derecho opcional, pie).
 */
export function CeShell({
    title,
    subtitle,
    updatedAt = 'Actualizado: 20/05/2025 09:45 a. m.',
    actions = [],
    metrics = [],
    children,
    rightPanel = null,
    footerNote = '© 2025 SICES v2 — Control Escolar de Escuela. Todos los derechos reservados.',
}) {
    return (
        <div className="ce-page">
            <header className="ce-page-header">
                <div>
                    <h1 className="ce-page-title">
                        {title}
                        <span className="ce-verified-badge" aria-hidden title="Verificado">
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 12l2 2 4-4" />
                                <circle cx="12" cy="12" r="9" />
                            </svg>
                        </span>
                    </h1>
                    {subtitle ? <p className="ce-page-subtitle">{subtitle}</p> : null}
                </div>
                <div className="ce-page-header-meta">
                    <span className="ce-updated">{updatedAt}</span>
                    <button type="button" className="inst-btn inst-btn-secondary text-sm">
                        Exportar ▾
                    </button>
                </div>
            </header>

            {actions.length > 0 ? (
                <div className="ce-action-toolbar">
                    {actions.map((a) => (
                        <Link key={a.to + a.label} to={a.to} className="ce-action-card">
                            <span className={`ce-action-icon ce-action-icon-${a.variant ?? 'primary'}`}>
                                <CeToolbarIcon icon={a.icon} />
                            </span>
                            <span className="ce-action-label">{a.label}</span>
                        </Link>
                    ))}
                </div>
            ) : null}

            {metrics.length > 0 ? (
                <div className="ce-metric-strip">
                    {metrics.map((m) => (
                        <article key={m.title} className="ce-metric-card">
                            <div className="ce-metric-head">
                                <span className={`ce-metric-dot ce-metric-dot-${m.tone ?? 'blue'}`} />
                                <p className="ce-metric-title">{m.title}</p>
                            </div>
                            <p className="ce-metric-value">{m.value}</p>
                            {m.trend ? <p className="ce-metric-trend">{m.trend}</p> : null}
                        </article>
                    ))}
                </div>
            ) : null}

            <div className={rightPanel ? 'ce-split' : ''}>
                <div className="ce-split-main">{children}</div>
                {rightPanel ? <aside className="ce-split-aside">{rightPanel}</aside> : null}
            </div>

            <footer className="ce-page-footer">
                <span>{footerNote}</span>
                <span>Versión 2.0.0</span>
            </footer>
        </div>
    );
}

export function CeInstSurface({ title, children, className = '' }) {
    return (
        <section className={`inst-surface p-4 ${className}`}>
            {title ? <h2 className="ce-section-title">{title}</h2> : null}
            {children}
        </section>
    );
}

export function CeStatusBadge({ children, tone = 'neutral' }) {
    const map = {
        Activo: 'inst-badge-success',
        Concluido: 'inst-badge-success',
        Completado: 'inst-badge-success',
        Autorizado: 'inst-badge-success',
        Autorizada: 'inst-badge-success',
        Confirmada: 'inst-badge-success',
        Completo: 'inst-badge-success',
        Completos: 'inst-badge-success',
        Aprobada: 'inst-badge-success',
        'En proceso': 'inst-badge-info',
        Prevalidada: 'inst-badge-info',
        Programado: 'inst-badge-info',
        'En revisión': 'inst-badge-warning',
        'Por validar': 'inst-badge-warning',
        Pendiente: 'inst-badge-warning',
        'Pendiente de conciliación': 'inst-badge-warning',
        Próximo: 'inst-badge-warning',
        Observada: 'inst-badge-danger',
        'Con observaciones': 'inst-badge-warning',
        Rechazado: 'inst-badge-danger',
        Reprobada: 'inst-badge-danger',
        Bloqueada: 'inst-badge-danger',
        Resuelto: 'inst-badge-success',
        'Baja temporal': 'inst-badge-warning',
        Egresado: 'inst-badge-info',
        Media: 'inst-badge-warning',
        Alta: 'inst-badge-danger',
        Baja: 'inst-badge-success',
        'Con errores': 'inst-badge-danger',
        Atendida: 'inst-badge-success',
        Devuelta: 'inst-badge-warning',
        Vencida: 'inst-badge-danger',
        Crítica: 'inst-badge-danger',
        'No leída': 'inst-badge-info',
        Leída: 'inst-badge-success',
        neutral: 'inst-badge',
        Capturada: 'inst-badge-success',
        'Corrección solicitada': 'inst-badge-warning',
        Disponible: 'inst-badge-success',
    };
    const cls = map[children] ?? map[tone] ?? 'inst-badge';
    return <span className={`${cls} text-xs`}>{children}</span>;
}

/** Pie de tabla estilo contrato (paginación decorativa). */
export function CePaginationFoot({ showingFrom, showingTo, total, noun = 'registros' }) {
    const totalStr = typeof total === 'number' ? total.toLocaleString('es-MX') : total;
    return (
        <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-3 text-xs text-slate-600 sm:flex-row sm:items-center sm:justify-between">
            <span>
                Mostrando {showingFrom} a {showingTo} de {totalStr} {noun}
            </span>
            <div className="flex flex-wrap items-center gap-1">
                {['1', '2', '3', '…', '213'].map((p) => (
                    <span
                        key={p}
                        className={`rounded px-2 py-1 ${p === '1' ? 'bg-sky-600 font-semibold text-white' : 'border border-slate-200 bg-white'}`}
                    >
                        {p}
                    </span>
                ))}
                <span className="ml-2 rounded border border-slate-200 bg-white px-2 py-1">10 por página</span>
            </div>
        </div>
    );
}
