import { esColors, esTheme } from '../educacionSuperior/esTheme';

const inputStyle = {
    height: 36,
    padding: '0 10px',
    border: `1px solid ${esColors.border}`,
    borderRadius: 8,
    fontSize: 13,
    width: '100%',
    background: '#fff',
};

export function CertificationFiltersPanel({ filters, setFilters, catalogos, open, onToggle }) {
    if (!open) {
        return (
            <button type="button" style={esTheme.btnSm} onClick={onToggle}>
                Mostrar filtros avanzados
            </button>
        );
    }

    return (
        <div style={{ ...esTheme.card, padding: 16, marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Filtros de supervisión</h4>
                <button type="button" style={esTheme.btnSm} onClick={onToggle}>
                    Ocultar
                </button>
            </div>
            <div
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                    gap: 12,
                }}
            >
                <label style={{ fontSize: 11, color: esColors.muted }}>
                    Búsqueda
                    <input
                        style={{ ...inputStyle, marginTop: 4 }}
                        placeholder="Folio, alumno, CURP…"
                        value={filters.q}
                        onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
                    />
                </label>
                <label style={{ fontSize: 11, color: esColors.muted }}>
                    Institución
                    <select
                        style={{ ...inputStyle, marginTop: 4 }}
                        value={filters.institucion_id}
                        onChange={(e) => setFilters((f) => ({ ...f, institucion_id: e.target.value }))}
                    >
                        <option value="">Todas</option>
                        {(catalogos.instituciones ?? []).map((i) => (
                            <option key={i.id} value={i.id}>
                                {i.nombre}
                            </option>
                        ))}
                    </select>
                </label>
                <label style={{ fontSize: 11, color: esColors.muted }}>
                    Tipo documento
                    <select
                        style={{ ...inputStyle, marginTop: 4 }}
                        value={filters.tipo_documento}
                        onChange={(e) => setFilters((f) => ({ ...f, tipo_documento: e.target.value }))}
                    >
                        <option value="">Todos</option>
                        <option value="certificado">Certificado</option>
                        <option value="titulo">Título</option>
                        <option value="constancia">Constancia</option>
                    </select>
                </label>
                <label style={{ fontSize: 11, color: esColors.muted }}>
                    Fase
                    <select
                        style={{ ...inputStyle, marginTop: 4 }}
                        value={filters.fase}
                        onChange={(e) => setFilters((f) => ({ ...f, fase: e.target.value }))}
                    >
                        <option value="">Todas</option>
                        <option value="en_revision">En revisión</option>
                        <option value="aprobado">Aprobado</option>
                        <option value="pendiente_folio">Pendiente de folio</option>
                        <option value="listo_proceso_tecnico">Listo proceso técnico</option>
                        <option value="firmado">Firmado</option>
                        <option value="incidencia">Con incidencia</option>
                    </select>
                </label>
                <label style={{ fontSize: 11, color: esColors.muted }}>
                    Prioridad
                    <select
                        style={{ ...inputStyle, marginTop: 4 }}
                        value={filters.prioridad}
                        onChange={(e) => setFilters((f) => ({ ...f, prioridad: e.target.value }))}
                    >
                        <option value="">Todas</option>
                        <option value="Alta">Alta</option>
                        <option value="Media">Media</option>
                        <option value="Baja">Baja</option>
                    </select>
                </label>
                <label style={{ fontSize: 11, color: esColors.muted }}>
                    Ciclo escolar
                    <select
                        style={{ ...inputStyle, marginTop: 4 }}
                        value={filters.ciclo_escolar_id}
                        onChange={(e) => setFilters((f) => ({ ...f, ciclo_escolar_id: e.target.value }))}
                    >
                        <option value="">Todos</option>
                        {(catalogos.ciclos ?? []).map((c) => (
                            <option key={c.id} value={c.id}>
                                {c.nombre}
                            </option>
                        ))}
                    </select>
                </label>
            </div>
            <button
                type="button"
                style={{ ...esTheme.btnSm, marginTop: 12 }}
                onClick={() =>
                    setFilters({
                        q: '',
                        institucion_id: '',
                        tipo_documento: '',
                        fase: '',
                        estatus: '',
                        prioridad: '',
                        ciclo_escolar_id: '',
                    })
                }
            >
                Limpiar filtros
            </button>
        </div>
    );
}
