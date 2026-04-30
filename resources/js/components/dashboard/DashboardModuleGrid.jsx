export function DashboardModuleGrid({ title = 'Modulos disponibles', modules = [] }) {
    return (
        <article className="inst-dashboard-panel">
            <h3 className="inst-dashboard-panel-title">{title}</h3>
            <div className="mt-3 grid gap-2 md:grid-cols-2">
                {modules.map((m) => (
                    <div key={m.name} className="inst-surface-muted p-3 text-sm">
                        <p className="font-semibold text-[var(--inst-navy)]">{m.name}</p>
                        <p className="inst-muted mt-1 text-xs">{m.description}</p>
                        {m.status ? <p className="mt-2 text-xs font-semibold text-[var(--inst-muted-2)]">{m.status}</p> : null}
                    </div>
                ))}
            </div>
        </article>
    );
}
