import { useState } from 'react';
import { clasificarValidaciones } from '../../utils/solicitudDocumentalUx';
import { SolicitudChecklistInstitucional } from './SolicitudChecklistInstitucional';

/**
 * Resumen compacto + checklist colapsable.
 */
export function ExpedienteValidacionesPanel({ items, advertenciaLegacy }) {
    const [abierto, setAbierto] = useState(false);
    const { completas, total, bloqueantes, advertencias, puedeEnviar } = clasificarValidaciones(items);

    const highlights = [
        {
            label: `Validaciones del expediente: ${completas} de ${total} completas`,
            ok: completas === total && puedeEnviar,
        },
        {
            label: items.find((i) => i.key === 'duplicado')?.ok
                ? 'Sin solicitud activa duplicada'
                : 'Existe solicitud activa del mismo tipo',
            ok: items.find((i) => i.key === 'duplicado')?.ok ?? true,
        },
        {
            label: items.find((i) => i.key === 'trayectoria')?.ok
                ? 'Trayectoria académica disponible'
                : 'Trayectoria académica pendiente',
            ok: items.find((i) => i.key === 'trayectoria')?.ok ?? false,
        },
    ];

    return (
        <div className="grid gap-3">
            <div
                style={{
                    padding: '12px 14px',
                    borderRadius: 10,
                    border: '1px solid #e2e8f0',
                    background: '#fff',
                }}
            >
                <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 8 }}>
                    {highlights.map((h) => (
                        <li key={h.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                            <span
                                style={{
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    background: h.ok ? '#16a34a' : '#eab308',
                                    flexShrink: 0,
                                }}
                            />
                            <span style={{ color: '#334155' }}>{h.label}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {advertenciaLegacy ? (
                <p
                    style={{
                        margin: 0,
                        padding: '10px 12px',
                        fontSize: 12,
                        color: '#92400e',
                        background: '#fffbeb',
                        border: '1px solid #fde68a',
                        borderRadius: 8,
                    }}
                >
                    {advertenciaLegacy}
                </p>
            ) : null}

            {!puedeEnviar && bloqueantes.length > 0 ? (
                <p style={{ margin: 0, fontSize: 12, color: '#991b1b' }}>
                    No es posible enviar la solicitud: {bloqueantes.map((b) => b.label.toLowerCase()).join(', ')}.
                </p>
            ) : null}

            {advertencias.length > 0 && puedeEnviar ? (
                <p style={{ margin: 0, fontSize: 12, color: '#92400e' }}>
                    Hay {advertencias.length} punto(s) de atención que no impiden el envío; el Certificador podrá
                    revisarlos.
                </p>
            ) : null}

            <button
                type="button"
                className="inst-btn inst-btn-secondary text-sm"
                style={{ width: 'fit-content' }}
                onClick={() => setAbierto((v) => !v)}
            >
                {abierto ? 'Ocultar detalle de validaciones' : 'Ver detalle de validaciones'}
            </button>

            {abierto ? <SolicitudChecklistInstitucional items={items} compact /> : null}
        </div>
    );
}
