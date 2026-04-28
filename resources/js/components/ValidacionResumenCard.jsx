export function ValidacionResumenCard({ resumen }) {
    if (!resumen) return null;

    const items = [
        ['Alumno', resumen.alumno?.ok],
        ['Matricula', resumen.matricula?.ok],
        ['Oferta academica', resumen.oferta_academica?.ok],
        ['Materias', resumen.materias?.ok],
        ['Trayectoria', resumen.trayectoria?.ok],
        ['Observaciones', resumen.observaciones?.ok],
        ['Documento', resumen.documento?.ok],
        ['Revision', resumen.revision?.ok],
        ['Aprobacion', resumen.aprobacion?.ok],
        ['Preparar firma', resumen.preparar_firma?.ok],
    ];

    return (
        <div className="inst-surface p-4">
            <h3 className="inst-title text-sm">Resumen de validacion academica</h3>
            <div className="mt-2 grid gap-2 md:grid-cols-4">
                <div className="inst-surface-muted p-2 text-xs">Completitud: <span className="font-semibold">{resumen.completitud_porcentaje ?? 0}%</span></div>
                <div className="inst-surface-muted p-2 text-xs">Puede enviar: <span className="font-semibold">{resumen.revision?.ok ? 'Si' : 'No'}</span></div>
                <div className="inst-surface-muted p-2 text-xs">Puede aprobar: <span className="font-semibold">{resumen.aprobacion?.ok ? 'Si' : 'No'}</span></div>
                <div className="inst-surface-muted p-2 text-xs">Puede preparar firma: <span className="font-semibold">{resumen.preparar_firma?.ok ? 'Si' : 'No'}</span></div>
            </div>
            <div className="mt-3 grid gap-2 md:grid-cols-4">
                {items.map(([label, ok]) => (
                    <div key={label} className="inst-surface-muted p-3">
                        <p className="inst-muted text-xs">{label}</p>
                        <p className={`text-sm font-semibold ${ok ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {ok ? 'Valido' : 'Con errores'}
                        </p>
                    </div>
                ))}
            </div>
            <p className="inst-muted mt-3 text-xs">
                Semaforo: verde correcto, rojo bloqueante. Las advertencias se muestran en el detalle del endpoint backend.
            </p>
            {(resumen.errores ?? []).length > 0 ? (
                <div className="mt-3 rounded border border-rose-200 bg-rose-50 p-3">
                    <p className="text-xs font-semibold text-rose-700">Errores bloqueantes</p>
                    <ul className="mt-1 list-disc pl-4 text-xs text-rose-700">
                        {(resumen.errores ?? []).map((e, i) => <li key={`${e}-${i}`}>{e}</li>)}
                    </ul>
                </div>
            ) : null}
            {(resumen.advertencias ?? []).length > 0 ? (
                <div className="mt-3 rounded border border-amber-200 bg-amber-50 p-3">
                    <p className="text-xs font-semibold text-amber-700">Advertencias</p>
                    <ul className="mt-1 list-disc pl-4 text-xs text-amber-700">
                        {(resumen.advertencias ?? []).map((a, i) => <li key={`${a}-${i}`}>{a}</li>)}
                    </ul>
                </div>
            ) : null}
        </div>
    );
}
