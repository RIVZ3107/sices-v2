export function DataTableWrapper({ title = 'Listado', toolbar = null, children }) {
    return (
        <section className="inst-dashboard-panel">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="inst-dashboard-panel-title">{title}</h3>
                {toolbar}
            </div>
            <div className="overflow-x-auto">{children}</div>
        </section>
    );
}
