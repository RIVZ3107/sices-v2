import React from 'react';
import { CeStatusBadge } from '../../../components/controlEscolar';

const META = {
    pendiente: { label: 'Pendiente', bg: '#FEF3C7', color: '#92400E' },
    en_captura: { label: 'En captura', bg: '#DBEAFE', color: '#1E40AF' },
    completado: { label: 'Completado', bg: '#DCFCE7', color: '#166534' },
    en_correccion: { label: 'En corrección', bg: '#EEEDFE', color: '#534AB7' },
    correccion_solicitada: { label: 'Corrección solicitada', bg: '#FFEDD5', color: '#9A3412' },
    cerrado: { label: 'Cerrado', bg: '#F1F5F9', color: '#475569' },
    validado: { label: 'Validado', bg: '#D1FAE5', color: '#065F46' },
    vencido: { label: 'Vencido', bg: '#FEE2E2', color: '#991B1B' },
};

export function CalificacionStatusBadge({ estatus, label }) {
    const code = (estatus || '').toLowerCase();
    const m = META[code] || { label: label || estatus || '—', bg: '#F1F5F9', color: '#64748b' };

    return (
        <span style={{
            display: 'inline-block', padding: '2px 10px', borderRadius: 999,
            fontSize: 11, fontWeight: 600, background: m.bg, color: m.color,
        }}
        >
            {label || m.label}
        </span>
    );
}
