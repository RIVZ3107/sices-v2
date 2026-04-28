export function LogsTecnicosPage() {
    return (
        <section className="grid gap-4">
            <div className="rounded-lg border border-slate-200 bg-white p-4">
                <h2 className="text-base font-semibold text-slate-900">Logs tecnicos</h2>
                <p className="mt-2 rounded border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800">
                    Firma real SEP/since-service pendiente de activacion controlada.
                </p>
                <p className="mt-2 text-sm text-slate-600">
                    Los logs tecnicos estaran disponibles cuando se active la integracion de firma y servicios externos.
                </p>
                <p className="mt-2 text-xs text-slate-500">
                    Cuando exista endpoint de logs se habilitara filtro por documento, tipo, estado y fecha.
                </p>
            </div>
        </section>
    );
}
