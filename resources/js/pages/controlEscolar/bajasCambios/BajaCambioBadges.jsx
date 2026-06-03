import React from 'react';
import { getBajaCambioPriorityMeta, getBajaCambioStatusMeta } from './bajaCambioUx';

export function BajaCambioStatusBadge({ estatus, label }) {
    const m = getBajaCambioStatusMeta(estatus);
    return (
        <span style={{ display: 'inline-block', padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 600, background: m.bg, color: m.color }}>
            {label || m.label}
        </span>
    );
}

export function PriorityBadge({ prioridad }) {
    const m = getBajaCambioPriorityMeta(prioridad);
    return (
        <span style={{ display: 'inline-block', padding: '4px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, background: m.bg, color: m.color }}>
            {m.label}
        </span>
    );
}
