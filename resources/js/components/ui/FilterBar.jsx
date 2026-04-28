export function FilterBar({ children, onReset }) {
    return (
        <div className="sices-card p-4">
            <div className="grid gap-3 md:grid-cols-4">{children}</div>
            {onReset ? (
                <div className="mt-3">
                    <button onClick={onReset} className="rounded border border-slate-300 px-3 py-2 text-xs text-slate-600">
                        Limpiar filtros
                    </button>
                </div>
            ) : null}
        </div>
    );
}
