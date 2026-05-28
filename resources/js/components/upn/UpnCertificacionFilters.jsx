import { EsSearchInput, esTheme } from '../educacionSuperior';
import { UPN_ESTATUS_OPCIONES } from '../../utils/upnCertificacion';

const inputStyle = {
    width: '100%',
    padding: '8px 10px',
    borderRadius: 8,
    border: '1px solid #e2e8f0',
    fontSize: 13,
};

function Field({ label, children, width }) {
    return (
        <label style={{ display: 'grid', gap: 4, minWidth: width ?? 160 }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: '#64748b' }}>{label}</span>
            {children}
        </label>
    );
}

export function UpnCertificacionFilters({ filters, setFilters, catalogos, open, onToggle, onLimpiar }) {
    if (!open) return null;

    return (
        <div
            style={{
                ...esTheme.card,
                padding: 16,
                marginBottom: 16,
                display: 'grid',
                gap: 12,
            }}
        >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                <Field label="Institución sede" width={220}>
                    <select
                        style={inputStyle}
                        value={filters.institucion_id}
                        onChange={(e) =>
                            setFilters((f) => ({
                                ...f,
                                institucion_id: e.target.value,
                                sede_id: '',
                            }))
                        }
                    >
                        <option value="">Todas</option>
                        {catalogos.instituciones.map((i) => (
                            <option key={i.id} value={String(i.id)}>
                                {i.nombre}
                            </option>
                        ))}
                    </select>
                </Field>
                <Field label="Subsede" width={200}>
                    <select
                        style={inputStyle}
                        value={filters.sede_id}
                        onChange={(e) => setFilters((f) => ({ ...f, sede_id: e.target.value }))}
                        disabled={!filters.institucion_id}
                    >
                        <option value="">Todas</option>
                        {catalogos.sedes.map((s) => (
                            <option key={s.id} value={String(s.id)}>
                                {s.nombre}
                            </option>
                        ))}
                    </select>
                </Field>
                <Field label="Estatus" width={200}>
                    <select
                        style={inputStyle}
                        value={filters.estatus}
                        onChange={(e) => setFilters((f) => ({ ...f, estatus: e.target.value }))}
                    >
                        {UPN_ESTATUS_OPCIONES.map((o) => (
                            <option key={o.value || 'all'} value={o.value}>
                                {o.label}
                            </option>
                        ))}
                    </select>
                </Field>
                <Field label="Tipo de certificado" width={180}>
                    <select
                        style={inputStyle}
                        value={filters.tipo_documento}
                        onChange={(e) => setFilters((f) => ({ ...f, tipo_documento: e.target.value }))}
                    >
                        <option value="">Todos</option>
                        <option value="certificado">Certificado</option>
                        <option value="titulo">Título</option>
                        <option value="constancia">Constancia</option>
                    </select>
                </Field>
                <Field label="Carrera / programa" width={200}>
                    <select
                        style={inputStyle}
                        value={filters.programa_id}
                        onChange={(e) => setFilters((f) => ({ ...f, programa_id: e.target.value }))}
                    >
                        <option value="">Todas</option>
                        {catalogos.programas.map((p) => (
                            <option key={p.id} value={String(p.id)}>
                                {p.nombre ?? p.clave}
                            </option>
                        ))}
                    </select>
                </Field>
                <Field label="Ciclo escolar" width={160}>
                    <select
                        style={inputStyle}
                        value={filters.ciclo_escolar_id}
                        onChange={(e) => setFilters((f) => ({ ...f, ciclo_escolar_id: e.target.value }))}
                    >
                        <option value="">Todos</option>
                        {catalogos.ciclos.map((c) => (
                            <option key={c.id} value={String(c.id)}>
                                {c.nombre}
                            </option>
                        ))}
                    </select>
                </Field>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'end' }}>
                <Field label="Folio" width={140}>
                    <input
                        style={inputStyle}
                        value={filters.folio}
                        onChange={(e) => setFilters((f) => ({ ...f, folio: e.target.value }))}
                    />
                </Field>
                <Field label="CURP" width={160}>
                    <input
                        style={inputStyle}
                        value={filters.curp}
                        onChange={(e) => setFilters((f) => ({ ...f, curp: e.target.value }))}
                    />
                </Field>
                <Field label="Nombre" width={160}>
                    <input
                        style={inputStyle}
                        value={filters.nombre}
                        onChange={(e) => setFilters((f) => ({ ...f, nombre: e.target.value }))}
                    />
                </Field>
                <Field label="Matrícula" width={120}>
                    <input
                        style={inputStyle}
                        value={filters.matricula}
                        onChange={(e) => setFilters((f) => ({ ...f, matricula: e.target.value }))}
                    />
                </Field>
                <Field label="Expedición desde" width={150}>
                    <input
                        type="date"
                        style={inputStyle}
                        value={filters.fecha_expedicion_desde}
                        onChange={(e) =>
                            setFilters((f) => ({ ...f, fecha_expedicion_desde: e.target.value }))
                        }
                    />
                </Field>
                <Field label="Expedición hasta" width={150}>
                    <input
                        type="date"
                        style={inputStyle}
                        value={filters.fecha_expedicion_hasta}
                        onChange={(e) =>
                            setFilters((f) => ({ ...f, fecha_expedicion_hasta: e.target.value }))
                        }
                    />
                </Field>
                <EsSearchInput
                    value={filters.q}
                    onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
                    placeholder="Búsqueda general…"
                    width={240}
                />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" style={esTheme.btnSecondary} onClick={onToggle}>
                    Ocultar filtros
                </button>
                <button
                    type="button"
                    style={esTheme.btnSecondary}
                    onClick={() => (onLimpiar ? onLimpiar() : setFilters((f) => ({ ...f, institucion_id: '', sede_id: '', estatus: '', q: '' })))}
                >
                    Limpiar filtros
                </button>
            </div>
        </div>
    );
}
