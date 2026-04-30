export function DashboardActivityPanel({ title = 'Actividad reciente', activities = [] }) {
    return (
        <article className="inst-dashboard-panel">
            <h3 className="inst-dashboard-panel-title">{title}</h3>
            {activities.length === 0 ? (
                <p className="inst-muted mt-2 text-sm">Informacion no disponible.</p>
            ) : (
                <ul className="inst-dashboard-list">
                    {activities.map((a) => (
                        <li key={`${a.label}-${a.value}`} className="inst-dashboard-item">
                            <span>{a.label}</span>
                            <span className="font-semibold">{a.value}</span>
                        </li>
                    ))}
                </ul>
            )}
        </article>
    );
}
