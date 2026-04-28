export function ObservacionesPanel({ items = [] }) {
    const pending = items.filter((x) => x.estado === 'pendiente');
    const attended = items.filter((x) => x.estado === 'atendida');
    const discarded = items.filter((x) => x.estado === 'descartada');

    const groups = [
        { key: 'pendiente', title: 'Pendientes', data: pending, cls: 'border-rose-200 bg-rose-50' },
        { key: 'atendida', title: 'Atendidas', data: attended, cls: 'border-emerald-200 bg-emerald-50' },
        { key: 'descartada', title: 'Descartadas', data: discarded, cls: 'border-slate-200 bg-slate-50' },
    ];

    return (
        <section className="rounded-lg border border-slate-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-slate-900">Historial de observaciones</h3>
            {items.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">No hay observaciones registradas para este documento.</p>
            ) : (
                <div className="mt-3 grid gap-3 md:grid-cols-3">
                    {groups.map((group) => (
                        <div key={group.key} className={`rounded border p-3 ${group.cls}`}>
                            <p className="text-xs font-semibold uppercase text-slate-700">{group.title}</p>
                            {group.data.length === 0 ? (
                                <p className="mt-2 text-xs text-slate-500">Sin registros.</p>
                            ) : (
                                <ul className="mt-2 grid gap-2">
                                    {group.data.map((item) => (
                                        <li key={item.id} className="rounded border border-white bg-white p-2 text-xs">
                                            <p className="font-medium text-slate-800">{item.seccion} · {item.prioridad}</p>
                                            <p className="text-slate-600">{item.observacion}</p>
                                            <p className="mt-1 text-[11px] text-slate-500">
                                                Crea: {item.creado_por?.name ?? item.creado_por ?? 'N/D'} · Atiende: {item.atendido_por?.name ?? item.atendido_por ?? 'N/D'}
                                            </p>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
