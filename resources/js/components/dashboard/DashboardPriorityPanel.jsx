export function DashboardPriorityPanel({ title = 'Pendientes prioritarios', items = [], emptyMessage }) {
    return (
        <article className="inst-dashboard-panel">
            <h3 className="inst-dashboard-panel-title">{title}</h3>
            {items.length === 0 ? (
                <p className="inst-muted mt-2 text-sm">{emptyMessage ?? 'No hay pendientes prioritarios en este momento.'}</p>
            ) : (
                <ul className="inst-dashboard-list">
                    {items.map((it) => (
                        <li key={it.label} className="inst-dashboard-item">
                            <span>{it.label}</span>
                            <span className="font-semibold">{it.value ?? 0}</span>
                        </li>
                    ))}
                </ul>
            )}
        </article>
    );
}
