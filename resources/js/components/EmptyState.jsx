export function EmptyState({ title = 'Sin resultados', description = 'No hay información para mostrar.' }) {
    return (
        <div className="inst-surface p-8 text-center">
            <h3 className="inst-title text-sm">{title}</h3>
            <p className="inst-muted mt-2 text-sm">{description}</p>
        </div>
    );
}
