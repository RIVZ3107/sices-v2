export function FilterBar({ children, onReset }) {
    return (
        <div className="inst-surface p-4">
            <div className="grid gap-3 md:grid-cols-4">{children}</div>
            {onReset ? (
                <div className="mt-3">
                    <button onClick={onReset} className="inst-btn inst-btn-secondary text-xs">
                        Limpiar filtros
                    </button>
                </div>
            ) : null}
        </div>
    );
}
