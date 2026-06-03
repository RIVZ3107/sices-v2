import React, { useState } from 'react';
import { canVerDetalleTecnicoError } from './alumnosPermissions';

export function ErrorStateAlert({ error, onRetry, technicalDetail = '' }) {
    const [showTech, setShowTech] = useState(false);
    const puedeTecnico = canVerDetalleTecnicoError();

    if (!error) {
        return null;
    }

    return (
        <div
            style={{
                marginBottom: 20,
                padding: '14px 16px',
                borderRadius: 10,
                background: '#FEE2E2',
                border: '1px solid #FECACA',
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                <div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#991B1B' }}>
                        {error.status === 403
                            ? 'No tienes permisos para consultar alumnos en tu alcance.'
                            : 'No fue posible cargar los alumnos'}
                    </p>
                    <p style={{ margin: '6px 0 0', fontSize: 13, color: '#7F1D1D' }}>{error.message}</p>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button
                        type="button"
                        onClick={onRetry}
                        style={{
                            height: 34,
                            padding: '0 14px',
                            borderRadius: 8,
                            border: 'none',
                            background: '#991B1B',
                            color: '#fff',
                            fontSize: 13,
                            fontWeight: 600,
                            cursor: 'pointer',
                        }}
                    >
                        Reintentar
                    </button>
                    {puedeTecnico && technicalDetail ? (
                        <button
                            type="button"
                            onClick={() => setShowTech((v) => !v)}
                            style={{
                                height: 34,
                                padding: '0 14px',
                                borderRadius: 8,
                                border: '1px solid #FECACA',
                                background: '#fff',
                                color: '#991B1B',
                                fontSize: 13,
                                fontWeight: 500,
                                cursor: 'pointer',
                            }}
                        >
                            {showTech ? 'Ocultar detalle' : 'Ver detalle técnico'}
                        </button>
                    ) : null}
                </div>
            </div>
            {puedeTecnico && showTech && technicalDetail ? (
                <pre
                    style={{
                        marginTop: 12,
                        padding: 12,
                        background: '#fff',
                        borderRadius: 8,
                        fontSize: 11,
                        overflow: 'auto',
                        maxHeight: 160,
                        color: '#334155',
                    }}
                >
                    {technicalDetail}
                </pre>
            ) : null}
        </div>
    );
}
