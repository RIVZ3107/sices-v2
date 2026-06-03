const PASOS = [
    { num: 1, label: 'Alumno' },
    { num: 2, label: 'Expediente' },
    { num: 3, label: 'Tipo documental' },
    { num: 4, label: 'Enviar' },
];

function resolverEstado(num, { pasoActivo, alumnoOk, expedienteOk, tipoOk, puedeEnviar }) {
    if (num === 1) {
        if (alumnoOk) return 'done';
        if (pasoActivo === 1) return 'active';
        return 'pending';
    }
    if (num === 2) {
        if (!alumnoOk) return 'blocked';
        if (expedienteOk) return 'done';
        if (pasoActivo === 2) return 'active';
        return 'pending';
    }
    if (num === 3) {
        if (!alumnoOk) return 'blocked';
        if (!expedienteOk && pasoActivo < 3) return 'blocked';
        if (tipoOk) return 'done';
        if (pasoActivo === 3) return 'active';
        return expedienteOk ? 'pending' : 'blocked';
    }
    if (num === 4) {
        if (!alumnoOk || !tipoOk) return 'blocked';
        if (pasoActivo === 4) return 'active';
        if (puedeEnviar) return 'pending';
        return 'blocked';
    }
    return 'pending';
}

const PALETTE = {
    done: { circle: '#0F6E56', text: '#0f172a', label: 'Completado' },
    active: { circle: '#185FA5', text: '#0f172a', label: 'En curso' },
    pending: { circle: '#e2e8f0', text: '#64748b', label: 'Pendiente' },
    blocked: { circle: '#f1f5f9', text: '#94a3b8', label: 'Bloqueado' },
};

/**
 * Stepper compacto — solicitud documental.
 */
export function SolicitudDocumentalStepper({
    pasoActivo,
    alumnoOk = false,
    expedienteOk = false,
    tipoOk = false,
    puedeEnviar = false,
}) {
    const ctx = { pasoActivo, alumnoOk, expedienteOk, tipoOk, puedeEnviar };

    return (
        <nav
            aria-label="Pasos de solicitud documental"
            style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: 4,
                marginBottom: 16,
                padding: '10px 12px',
                background: '#f8fafc',
                borderRadius: 8,
                border: '1px solid #e2e8f0',
            }}
        >
            {PASOS.map((p, idx) => {
                const st = resolverEstado(p.num, ctx);
                const pal = PALETTE[st];
                const circleColor = st === 'active' || st === 'done' ? '#fff' : '#64748b';

                return (
                    <div key={p.num} style={{ display: 'flex', alignItems: 'center' }}>
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '4px 8px',
                                borderRadius: 6,
                                background: st === 'active' ? '#eff6ff' : 'transparent',
                            }}
                            title={pal.label}
                        >
                            <span
                                style={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: '50%',
                                    background: pal.circle,
                                    color: circleColor,
                                    fontSize: 11,
                                    fontWeight: 700,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                {st === 'done' ? '✓' : p.num}
                            </span>
                            <span style={{ fontSize: 12, fontWeight: st === 'active' ? 600 : 500, color: pal.text }}>
                                {p.label}
                            </span>
                        </div>
                        {idx < PASOS.length - 1 ? (
                            <span style={{ color: '#cbd5e1', margin: '0 2px', fontSize: 10 }} aria-hidden>
                                ›
                            </span>
                        ) : null}
                    </div>
                );
            })}
        </nav>
    );
}
