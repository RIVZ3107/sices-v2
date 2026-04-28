export function DashboardPriorityPanel({ title = 'Pendientes prioritarios', items = [], emptyMessage }) {
    return (
        <article className="inst-surface p-4">
            <h3 className="inst-title text-sm">{title}</h3>
            {items.length === 0 ? (
                <p className="inst-muted mt-2 text-sm">{emptyMessage ?? 'No hay pendientes prioritarios en este momento.'}</p>
            ) : (
                <ul className="mt-3 grid gap-2">
                    {items.map((it) => (
                        <li key={it.label} className="inst-surface-muted flex items-center justify-between p-2 text-sm">
                            <span>{it.label}</span>
                            <span className="font-semibold">{it.value ?? 0}</span>
                        </li>
                    ))}
                </ul>
            )}
        </article>
    );
}
