import React from 'react';
import { Link } from 'react-router-dom';
import { CeIcons, CeStatusBadge, ceColors, ceTheme } from '../../../components/controlEscolar';
import { sanitizeInstitutionalLabel } from '../../../utils/uxInstitucional';
import { AlumnoRowActions } from './AlumnoRowActions';
import { AlumnosEmptyState } from './AlumnosEmptyState';

function formatFecha(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const COLS = [
    { key: 'matricula', label: 'Matrícula', sortable: true },
    { key: 'nombre', label: 'Nombre', sortable: true },
    { key: 'curp', label: 'CURP', sortable: true },
    { key: 'programa', label: 'Programa', sortable: false },
    { key: 'plan', label: 'Plan', sortable: false },
    { key: 'periodo', label: 'Semestre', sortable: false },
    { key: 'estatus', label: 'Estatus', sortable: true },
    { key: 'expediente', label: 'Expediente', sortable: false },
    { key: 'actualizado', label: 'Actualización', sortable: true },
    { key: 'acciones', label: 'Acciones', sortable: false },
];

export function AlumnosTable({
    rows,
    loading,
    apiOk,
    hasFilters,
    sortBy,
    sortDir,
    onSort,
    onImport,
    search,
    onSearchChange,
    perPage,
    onPerPageChange,
    meta,
    page,
    onPageChange,
}) {
    const th = { ...ceTheme.thCompact, whiteSpace: 'nowrap' };

    const toolbar = (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, gap: 8, flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>{CeIcons.search}</span>
                <input
                    type="search"
                    value={search}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder="Buscar por nombre, matrícula o CURP…"
                    style={{ height: 36, width: 320, maxWidth: '100%', paddingLeft: 34, border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13 }}
                />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#64748b' }}>
                Mostrar
                <select value={perPage} onChange={(e) => onPerPageChange(Number(e.target.value))} style={{ height: 32, borderRadius: 6, border: '1px solid #e2e8f0', padding: '0 8px' }}>
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                </select>
                por página
            </div>
        </div>
    );

    if (!loading && apiOk && rows.length === 0) {
        return (
            <>
                {toolbar}
                <AlumnosEmptyState hasFilters={hasFilters} onImport={onImport} />
            </>
        );
    }

    return (
        <>
            {toolbar}
            <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 960 }}>
                    <thead>
                        <tr>
                            {COLS.map((c) => (
                                <th
                                    key={c.key}
                                    style={{ ...th, textAlign: c.key === 'acciones' ? 'center' : 'left', cursor: c.sortable ? 'pointer' : 'default' }}
                                    onClick={c.sortable ? () => onSort(c.key === 'actualizado' ? 'updated_at' : c.key) : undefined}
                                >
                                    {c.label}
                                    {c.sortable ? (sortBy === (c.key === 'actualizado' ? 'updated_at' : c.key) ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ' ⇅') : ''}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading && rows.length === 0 ? (
                            <tr>
                                <td colSpan={COLS.length} style={{ padding: 32, textAlign: 'center', color: '#64748b' }}>
                                    Cargando alumnos…
                                </td>
                            </tr>
                        ) : (
                            rows.map((r) => (
                                <tr key={r.alumno_id} style={{ borderBottom: `1px solid ${ceColors.rowBorder}` }}>
                                    <td style={ceTheme.tdCompact}>
                                        <Link to={r.urls?.expediente} style={{ color: '#185FA5', fontWeight: 600, textDecoration: 'none' }}>
                                            {r.matricula}
                                        </Link>
                                    </td>
                                    <td style={ceTheme.tdCompact}>{sanitizeInstitutionalLabel(r.nombre)}</td>
                                    <td style={{ ...ceTheme.tdCompact, fontFamily: 'monospace', fontSize: 11 }}>{r.curp}</td>
                                    <td style={ceTheme.tdCompact}>{sanitizeInstitutionalLabel(r.programa)}</td>
                                    <td style={ceTheme.tdCompact}>{sanitizeInstitutionalLabel(r.plan)}</td>
                                    <td style={ceTheme.tdCompact}>{r.periodo}</td>
                                    <td style={ceTheme.tdCompact}><CeStatusBadge>{r.estatus}</CeStatusBadge></td>
                                    <td style={ceTheme.tdCompact}>
                                        <span style={{ fontSize: 12, color: r.expediente_completo ? '#0F6E56' : '#C2410C', fontWeight: 600 }}>
                                            {r.expediente_estado}
                                        </span>
                                    </td>
                                    <td style={{ ...ceTheme.tdCompact, fontSize: 11, color: '#94a3b8' }}>{formatFecha(r.actualizado_en)}</td>
                                    <td style={ceTheme.tdCompact}><AlumnoRowActions row={r} /></td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, paddingTop: 16, borderTop: `1px solid ${ceColors.rowBorder}`, flexWrap: 'wrap', gap: 8 }}>
                <span style={{ fontSize: 12, color: '#64748b' }}>
                    {meta.from && meta.to ? `Mostrando ${meta.from} a ${meta.to} de ${meta.total} resultados` : 'Sin registros'}
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                    <button type="button" disabled={page <= 1 || loading} onClick={() => onPageChange(page - 1)} style={{ minWidth: 32, height: 32, borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer' }}>«</button>
                    <span style={{ alignSelf: 'center', fontSize: 13 }}>{meta.current_page ?? page} / {meta.last_page ?? 1}</span>
                    <button type="button" disabled={page >= (meta.last_page ?? 1) || loading} onClick={() => onPageChange(page + 1)} style={{ minWidth: 32, height: 32, borderRadius: 6, border: '1px solid #e2e8f0', background: '#fff', cursor: 'pointer' }}>»</button>
                </div>
            </div>
        </>
    );
}
