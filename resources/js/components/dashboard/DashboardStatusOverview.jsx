export function DashboardStatusOverview({ title = 'Seguimiento por estado', items = [] }) {
    return (
        <article className="inst-dashboard-panel">
            <h3 className="inst-dashboard-panel-title">{title}</h3>
            <div className="mt-3 grid gap-2 md:grid-cols-3">
                {items.map((it) => (
                    <div key={it.label} className="inst-surface-muted p-3">
                        <p className="inst-muted text-xs uppercase">{it.label}</p>
                        <p className="mt-1 text-xl font-semibold text-[var(--inst-navy)]">{it.value ?? 0}</p>
                    </div>
                ))}
            </div>
        </article>
    );
}
