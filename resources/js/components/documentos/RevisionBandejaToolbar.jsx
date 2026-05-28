import { useMemo } from 'react';

export const REVISION_BANDEJA_FILTERS_INITIAL = {
    q: '',
    institucion_id: '',
    sede_q: '',
    ciclo_escolar_id: '',
    tipo_certificacion: '',
    estado_workflow: '',
};

function countActive(filters) {
    return Object.entries(filters).filter(([, v]) => String(v ?? '').trim() !== '').length;
}

function chipLabel(key, value, catalogos) {
    if (!String(value ?? '').trim()) return null;
    switch (key) {
        case 'q':
            return `Búsqueda: ${value}`;
        case 'institucion_id': {
            const ins = catalogos.instituciones?.find((i) => String(i.id) === String(value));
            return `Institución: ${ins?.nombre ?? value}`;
        }
        case 'sede_q':
            return `Sede/CCT: ${value}`;
        case 'ciclo_escolar_id': {
            const c = catalogos.ciclos?.find((x) => String(x.id) === String(value));
            return `Ciclo: ${c?.nombre ?? c?.clave ?? value}`;
        }
        case 'estado_workflow': {
            const map = {
                en_revision: 'En revisión',
                aprobado: 'Aprobado',
                rechazado: 'Observado',
                borrador: 'Borrador',
            };
            return `Estado: ${map[value] ?? value}`;
        }
        case 'tipo_certificacion':
            return `Certificado: ${value === 'total' ? 'Total' : value === 'parcial' ? 'Parcial' : value}`;
        default:
            return null;
    }
}

export function RevisionBandejaToolbar({
    filters,
    setFilters,
    catalogos = { instituciones: [], ciclos: [] },
    advancedOpen,
    onToggleAdvanced,
}) {
    const activeCount = countActive(filters);

    const chips = useMemo(() => {
        return Object.keys(REVISION_BANDEJA_FILTERS_INITIAL)
            .map((key) => {
                const label = chipLabel(key, filters[key], catalogos);
                if (!label) return null;
                return { key, label };
            })
            .filter(Boolean);
    }, [filters, catalogos]);

    function clearKey(key) {
        setFilters((s) => ({ ...s, [key]: REVISION_BANDEJA_FILTERS_INITIAL[key] }));
    }

    function clearAll() {
        setFilters({ ...REVISION_BANDEJA_FILTERS_INITIAL });
    }

    return (
        <div className="inst-bandeja-toolbar inst-surface">
            <div className="inst-bandeja-toolbar-row">
                <label className="inst-bandeja-search">
                    <span className="inst-bandeja-search-icon" aria-hidden>
                        ⌕
                    </span>
                    <input
                        type="search"
                        className="inst-input"
                        placeholder="Alumno, CURP, matrícula o folio interno…"
                        value={filters.q}
                        onChange={(e) => setFilters((s) => ({ ...s, q: e.target.value }))}
                        aria-label="Buscar en la bandeja"
                    />
                    {filters.q ? (
                        <button
                            type="button"
                            className="inst-bandeja-search-clear"
                            onClick={() => clearKey('q')}
                            aria-label="Quitar búsqueda"
                        >
                            ×
                        </button>
                    ) : null}
                </label>

                <button
                    type="button"
                    className={`inst-btn inst-btn-secondary text-sm inst-bandeja-filters-btn ${advancedOpen ? 'is-active' : ''}`}
                    onClick={onToggleAdvanced}
                    aria-expanded={advancedOpen}
                >
                    Filtros avanzados
                    {activeCount > 0 ? <span className="inst-bandeja-filters-badge">{activeCount}</span> : null}
                </button>

                {activeCount > 0 ? (
                    <button type="button" className="inst-btn inst-btn-secondary text-sm" onClick={clearAll}>
                        Limpiar todo
                    </button>
                ) : null}
            </div>

            {chips.length > 0 ? (
                <div className="inst-bandeja-chips" role="list" aria-label="Filtros activos">
                    {chips.map((chip) => (
                        <button
                            key={chip.key}
                            type="button"
                            className="inst-bandeja-chip"
                            onClick={() => clearKey(chip.key)}
                            title="Quitar filtro"
                        >
                            {chip.label}
                            <span aria-hidden> ×</span>
                        </button>
                    ))}
                </div>
            ) : null}

            {advancedOpen ? (
                <div className="inst-bandeja-advanced">
                    <div className="inst-bandeja-advanced-grid">
                        <label className="inst-bandeja-field">
                            <span>Institución</span>
                            <select
                                className="inst-select text-sm"
                                value={filters.institucion_id}
                                onChange={(e) => setFilters((s) => ({ ...s, institucion_id: e.target.value }))}
                            >
                                <option value="">Todas</option>
                                {catalogos.instituciones.map((i) => (
                                    <option key={i.id} value={i.id}>
                                        {i.nombre}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="inst-bandeja-field">
                            <span>Sede / CCT</span>
                            <input
                                className="inst-input text-sm"
                                placeholder="Nombre o clave"
                                value={filters.sede_q}
                                onChange={(e) => setFilters((s) => ({ ...s, sede_q: e.target.value }))}
                            />
                        </label>
                        <label className="inst-bandeja-field">
                            <span>Ciclo escolar</span>
                            <select
                                className="inst-select text-sm"
                                value={filters.ciclo_escolar_id}
                                onChange={(e) => setFilters((s) => ({ ...s, ciclo_escolar_id: e.target.value }))}
                            >
                                <option value="">Todos</option>
                                {catalogos.ciclos.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.nombre ?? c.clave}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="inst-bandeja-field">
                            <span>Estado workflow</span>
                            <select
                                className="inst-select text-sm"
                                value={filters.estado_workflow}
                                onChange={(e) => setFilters((s) => ({ ...s, estado_workflow: e.target.value }))}
                            >
                                <option value="">Todos</option>
                                <option value="en_revision">En revisión</option>
                                <option value="aprobado">Aprobado</option>
                                <option value="rechazado">Rechazado / observado</option>
                                <option value="borrador">Borrador</option>
                            </select>
                        </label>
                        <label className="inst-bandeja-field">
                            <span>Tipo certificado</span>
                            <select
                                className="inst-select text-sm"
                                value={filters.tipo_certificacion}
                                onChange={(e) => setFilters((s) => ({ ...s, tipo_certificacion: e.target.value }))}
                            >
                                <option value="">Todos</option>
                                <option value="total">Total</option>
                                <option value="parcial">Parcial</option>
                            </select>
                        </label>
                    </div>
                    <p className="inst-bandeja-advanced-hint">
                        La búsqueda principal cubre alumno, CURP, matrícula y folio. Use los campos de arriba para acotar por institución o ciclo.
                    </p>
                </div>
            ) : null}
        </div>
    );
}
