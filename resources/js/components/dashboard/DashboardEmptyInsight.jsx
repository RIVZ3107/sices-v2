export function DashboardEmptyInsight({ title = 'Sin datos', description }) {
    return (
        <article className="inst-dashboard-panel">
            <h3 className="inst-dashboard-panel-title">{title}</h3>
            <p className="inst-muted mt-2 text-sm">
                {description ?? 'No hay informacion disponible por el momento. La operacion continuara mostrando datos en cuanto existan registros.'}
            </p>
        </article>
    );
}
