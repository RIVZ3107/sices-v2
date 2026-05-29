const PASOS = [
    { num: 1, label: 'Alumno' },
    { num: 2, label: 'Expediente' },
    { num: 3, label: 'Tipo documental' },
    { num: 4, label: 'Enviar' },
];

/**
 * Stepper horizontal del flujo de solicitud documental (Control Escolar).
 * @param {{ pasoActivo: number, alumnoOk?: boolean, expedienteOk?: boolean, tipoOk?: boolean }} props
 */
export function SolicitudDocumentalStepper({ pasoActivo, alumnoOk = false, expedienteOk = false, tipoOk = false }) {
    function estadoPaso(num) {
        if (num < pasoActivo) return 'done';
        if (num === pasoActivo) return 'active';
        if (num === 2 && alumnoOk) return 'done';
        if (num === 3 && expedienteOk) return 'done';
        if (num === 4 && tipoOk) return 'done';
        return 'pending';
    }

    return (
        <nav
            aria-label="Pasos de solicitud documental"
            style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 8,
                marginBottom: 20,
                padding: '12px 16px',
                background: '#f8fafc',
                borderRadius: 10,
                border: '1px solid #e2e8f0',
            }}
        >
            {PASOS.map((p, idx) => {
                const st = estadoPaso(p.num);
                const bg = st === 'done' ? '#0F6E56' : st === 'active' ? '#185FA5' : '#e2e8f0';
                const color = st === 'pending' ? '#64748b' : '#fff';

                return (
                    <div key={p.num} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                            <span
                                style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: '50%',
                                    background: bg,
                                    color,
                                    fontSize: 13,
                                    fontWeight: 700,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                }}
                            >
                                {st === 'done' ? '✓' : p.num}
                            </span>
                            <span
                                style={{
                                    fontSize: 13,
                                    fontWeight: st === 'active' ? 600 : 500,
                                    color: st === 'pending' ? '#64748b' : '#0f172a',
                                }}
                            >
                                {p.label}
                            </span>
                        </div>
                        {idx < PASOS.length - 1 ? (
                            <span style={{ color: '#cbd5e1', fontSize: 12, padding: '0 4px' }} aria-hidden>
                                →
                            </span>
                        ) : null}
                    </div>
                );
            })}
        </nav>
    );
}
