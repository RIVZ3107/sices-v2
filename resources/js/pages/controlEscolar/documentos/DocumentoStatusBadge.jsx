import React from 'react';
import { getDocumentoStatusMeta } from './documentoUx';

export function DocumentoStatusBadge({ estatus, label }) {
    const meta = getDocumentoStatusMeta(estatus);
    const text = label || meta.label;
    return (
        <span
            style={{
                display: 'inline-block',
                padding: '4px 10px',
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 600,
                background: meta.bg,
                color: meta.color,
            }}
        >
            {text}
        </span>
    );
}
