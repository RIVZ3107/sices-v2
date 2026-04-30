export function DashboardRoleSummary({ roleLabel, text }) {
    return (
        <article className="inst-dashboard-panel">
            <p className="text-xs uppercase text-[var(--inst-muted)]">Resumen de rol</p>
            <p className="mt-1 text-sm font-semibold text-[var(--inst-navy)]">{roleLabel}</p>
            <p className="inst-muted mt-1 text-sm">{text}</p>
        </article>
    );
}
