import React from 'react';
import { getExpedienteStatusMeta } from '../../../utils/expedienteUx';

export function ExpedienteStatusBadge({ estatus }) {
    const codigo = estatus?.codigo ?? estatus;
    const meta = getExpedienteStatusMeta(codigo);
    const label = estatus?.label ?? meta.label;

    return (
        <span
            style={{
                display: 'inline-block',
                padding: '2px 10px',
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 600,
                background: meta.bg,
                color: meta.color,
            }}
        >
            {label}
        </span>
    );
}
