import React, { useState } from 'react';
import { CeIcons } from '../../../components/controlEscolar';

const CHIP = (active) => ({
    height: 30,
    padding: '0 12px',
    borderRadius: 999,
    border: `1px solid ${active ? '#185FA5' : '#e2e8f0'}`,
    background: active ? '#EFF6FF' : '#fff',
    color: active ? '#185FA5' : '#475569',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
});

export function AlumnosFilters({ filters, catalogos, onChange, onClear, showPanel }) {
    const [open, setOpen] = useState(showPanel);

    const estatusChips = [{ value: '', label: 'Todos' }, ...(catalogos.estatus ?? [])];

    return (
        <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: open ? 12 : 0 }}>
                {estatusChips.map((c) => (
                    <button
                        key={c.value || 'todos'}
                        type="button"
                        style={CHIP((filters.estatus || '') === c.value)}
                        onClick={() => onChange({ estatus: c.value }, { resetPage: true })}
                    >
                        {c.label}
                    </button>
                ))}
                <button type="button" style={{ ...CHIP(open), display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={() => setOpen((v) => !v)}>
                    <span style={{ display: 'flex' }}>{CeIcons.filter}</span>
                    Filtros avanzados
                </button>
                <button
                    type="button"
                    style={{ ...CHIP(false), marginLeft: 'auto' }}
                    onClick={onClear}
                >
                    Limpiar
                </button>
            </div>
            {open ? (
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                        gap: 12,
                        padding: 16,
                        background: '#f8fafc',
                        borderRadius: 10,
                        border: '1px solid #e2e8f0',
                    }}
                >
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11, fontWeight: 600, color: '#64748b' }}>
                        Programa
                        <select
                            value={filters.programa_id || ''}
                            onChange={(e) => onChange({ programa_id: e.target.value })}
                            style={{ height: 34, borderRadius: 8, border: '1px solid #e2e8f0', padding: '0 8px', fontSize: 13 }}
                        >
                            <option value="">Todos</option>
                            {(catalogos.programas ?? []).map((p) => (
                                <option key={p.id} value={p.id}>{p.nombre}</option>
                            ))}
                        </select>
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11, fontWeight: 600, color: '#64748b' }}>
                        Plan
                        <select
                            value={filters.plan_id || ''}
                            onChange={(e) => onChange({ plan_id: e.target.value })}
                            style={{ height: 34, borderRadius: 8, border: '1px solid #e2e8f0', padding: '0 8px', fontSize: 13 }}
                        >
                            <option value="">Todos</option>
                            {(catalogos.planes ?? []).map((p) => (
                                <option key={p.id} value={p.id}>{p.nombre}</option>
                            ))}
                        </select>
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11, fontWeight: 600, color: '#64748b' }}>
                        Sede
                        <select
                            value={filters.sede_id || ''}
                            onChange={(e) => onChange({ sede_id: e.target.value })}
                            style={{ height: 34, borderRadius: 8, border: '1px solid #e2e8f0', padding: '0 8px', fontSize: 13 }}
                        >
                            <option value="">Todas</option>
                            {(catalogos.sedes ?? []).map((s) => (
                                <option key={s.id} value={s.id}>{s.nombre}</option>
                            ))}
                        </select>
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11, fontWeight: 600, color: '#64748b' }}>
                        Periodo
                        <input
                            type="text"
                            value={filters.periodo || ''}
                            onChange={(e) => onChange({ periodo: e.target.value })}
                            placeholder="Ej. 3°"
                            style={{ height: 34, borderRadius: 8, border: '1px solid #e2e8f0', padding: '0 10px', fontSize: 13 }}
                        />
                    </label>
                    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11, fontWeight: 600, color: '#64748b' }}>
                        Expediente
                        <select
                            value={filters.expediente || ''}
                            onChange={(e) => onChange({ expediente: e.target.value })}
                            style={{ height: 34, borderRadius: 8, border: '1px solid #e2e8f0', padding: '0 8px', fontSize: 13 }}
                        >
                            <option value="">Todos</option>
                            <option value="completo">Completo</option>
                            <option value="incompleto">Incompleto</option>
                        </select>
                    </label>
                </div>
            ) : null}
        </div>
    );
}
