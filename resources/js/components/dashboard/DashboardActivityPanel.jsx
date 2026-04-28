export function DashboardActivityPanel({ title = 'Actividad reciente', activities = [] }) {
    return (
        <article className="inst-surface p-4">
            <h3 className="inst-title text-sm">{title}</h3>
            {activities.length === 0 ? (
                <p className="inst-muted mt-2 text-sm">Informacion no disponible.</p>
            ) : (
                <ul className="mt-3 grid gap-2">
                    {activities.map((a) => (
                        <li key={`${a.label}-${a.value}`} className="inst-surface-muted flex items-center justify-between p-2 text-sm">
                            <span>{a.label}</span>
                            <span className="font-semibold">{a.value}</span>
                        </li>
                    ))}
                </ul>
            )}
        </article>
    );
}
