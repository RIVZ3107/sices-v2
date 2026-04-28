export function ConfiguracionTecnicaPage() {
    return (
        <section className="grid gap-4">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
                <h2 className="text-base font-semibold text-slate-900">Configuracion tecnica</h2>
                <p className="mt-2 rounded border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
                    Firma real SEP/since-service pendiente de activacion controlada.
                </p>
                <ul className="mt-3 grid gap-2 text-sm text-slate-600">
                    <li>Configuracion de firma: pendiente de activacion.</li>
                    <li>Plantillas XML: pendiente de activacion.</li>
                    <li>Reglas de cadena: pendiente de activacion.</li>
                    <li>Plantillas documentales: pendiente de activacion.</li>
                </ul>
                <p className="mt-3 text-sm text-slate-700">
                    La configuracion tecnica de firma real sera habilitada en una fase controlada posterior.
                </p>
                <p className="mt-1 text-xs text-slate-500">
                    No se permite carga de llaves ni configuracion since-service desde frontend en este bloque.
                </p>
            </div>
        </section>
    );
}
