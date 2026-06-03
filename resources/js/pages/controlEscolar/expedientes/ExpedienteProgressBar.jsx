import React from 'react';
import { getProgressSeverity } from '../../../utils/expedienteUx';

export function ExpedienteProgressBar({ avance }) {
    const pct = Number(avance?.porcentaje ?? 0);
    const pal = getProgressSeverity(pct);

    return (
        <div style={{ minWidth: 100 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                <span style={{ color: '#64748b' }}>
                    {avance?.completados ?? 0}/{avance?.total ?? 0}
                </span>
                <span style={{ fontWeight: 700, color: pal.color }}>{pct}%</span>
            </div>
            <div style={{ height: 6, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${Math.min(100, pct)}%`, background: pal.color, borderRadius: 4 }} />
            </div>
        </div>
    );
}
