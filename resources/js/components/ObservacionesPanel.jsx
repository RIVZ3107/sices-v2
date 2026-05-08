export function ObservacionesPanel({ items = [], onSelect, selectedId = null }) {
    const pendientes = items.filter((item) => item.estado === 'pendiente');
    return (
        <section className="rounded-lg border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-slate-900">Observaciones pendientes del expediente</h3>
            {pendientes.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">No hay observaciones registradas para este documento.</p>
            ) : (
                <div className="overflow-x-auto mt-2">
                    <table className="inst-table min-w-full text-sm">
                        <thead>
                            <tr>
                                <th className="px-3 py-2 text-left">Tipo</th>
                                <th className="px-3 py-2 text-left">Etapa</th>
                                <th className="px-3 py-2 text-left">Prioridad</th>
                                <th className="px-3 py-2 text-left">Observación</th>
                                <th className="px-3 py-2 text-left">Estado</th>
                                <th className="px-3 py-2 text-left">Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pendientes.map((item) => (
                                <tr key={item.id} className={`border-t border-slate-100 ${selectedId === item.id ? 'bg-blue-50' : ''}`}>
                                    <td className="px-3 py-2">{item.tipo ?? 'General'}</td>
                                    <td className="px-3 py-2">{item.seccion ?? 'Proceso'}</td>
                                    <td className="px-3 py-2">{item.prioridad ?? 'Media'}</td>
                                    <td className="px-3 py-2">{item.observacion}</td>
                                    <td className="px-3 py-2">{item.estado}</td>
                                    <td className="px-3 py-2">
                                        <button type="button" className="inst-btn inst-btn-secondary text-xs" onClick={() => onSelect?.(item)}>
                                            Atender
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </section>
    );
}
