export function EmptyState({ title = 'Sin resultados', description = 'No hay información para mostrar.' }) {
    return (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
            <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
            <p className="mt-2 text-sm text-slate-500">{description}</p>
        </div>
    );
}
