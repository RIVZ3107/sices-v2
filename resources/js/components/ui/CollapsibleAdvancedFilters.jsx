import { useState } from 'react';

/**
 * Filtros avanzados colapsables (búsqueda básica siempre visible).
 */
export function CollapsibleAdvancedFilters({
    searchLabel = 'Búsqueda',
    searchValue,
    onSearchChange,
    searchPlaceholder = 'Buscar…',
    children,
    defaultOpen = false,
}) {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <div className="grid gap-3">
            <div className="grid gap-2 md:grid-cols-[1fr_auto]">
                <label className="grid gap-1 text-sm">
                    <span className="font-medium text-slate-700">{searchLabel}</span>
                    <input
                        type="search"
                        className="inst-input"
                        value={searchValue}
                        onChange={(e) => onSearchChange(e.target.value)}
                        placeholder={searchPlaceholder}
                    />
                </label>
                <button
                    type="button"
                    className="inst-btn inst-btn-secondary text-sm self-end"
                    onClick={() => setOpen((v) => !v)}
                >
                    {open ? 'Ocultar filtros avanzados' : 'Filtros avanzados'}
                </button>
            </div>
            {open ? <div className="grid gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50">{children}</div> : null}
        </div>
    );
}
