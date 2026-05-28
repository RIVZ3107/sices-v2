import { EsProgressBar, EsSidePanel, esColors } from '../educacionSuperior';

export function CertificationRightPanel({ distribucion, prioridades, rezago, onFiltroRapido }) {
    const total = distribucion.reduce((s, i) => s + i.value, 0);

    return (
        <>
            <EsSidePanel title="Estatus de certificación">
                {total === 0 ? (
                    <p style={{ margin: 0, fontSize: 13, color: esColors.muted, textAlign: 'center' }}>Sin datos en el periodo</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {distribucion.map((item) => (
                            <EsProgressBar
                                key={item.label}
                                label={item.label}
                                value={item.value}
                                total={total}
                                barColor={item.color}
                            />
                        ))}
                    </div>
                )}
            </EsSidePanel>

            <EsSidePanel title="Acciones prioritarias">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {prioridades.map((p) => (
                        <button
                            key={p.titulo}
                            type="button"
                            onClick={() => onFiltroRapido?.(p)}
                            style={{
                                textAlign: 'left',
                                background: 'none',
                                border: 'none',
                                padding: 0,
                                cursor: 'pointer',
                            }}
                        >
                            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: esColors.primary }}>
                                {p.titulo} ({p.total})
                            </p>
                            <p style={{ margin: '4px 0 0', fontSize: 11, color: esColors.mutedLight }}>
                                Clic para filtrar en la tabla
                            </p>
                        </button>
                    ))}
                </div>
            </EsSidePanel>

            <EsSidePanel title="Instituciones con más rezago">
                {rezago.length === 0 ? (
                    <p style={{ margin: 0, fontSize: 13, color: esColors.muted }}>Sin rezagos destacados</p>
                ) : (
                    <ol style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
                        {rezago.map((r) => (
                            <li key={r.institucion} style={{ marginBottom: 10 }}>
                                <button
                                    type="button"
                                    onClick={() => onFiltroRapido?.({ institucionNombre: r.institucion })}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        padding: 0,
                                        cursor: 'pointer',
                                        color: r.total >= 10 ? '#DC2626' : r.total >= 5 ? '#BA7517' : esColors.text,
                                        fontWeight: 600,
                                        textAlign: 'left',
                                    }}
                                >
                                    {r.institucion}
                                </button>
                                <span style={{ color: esColors.muted }}> — {r.total} pendientes</span>
                            </li>
                        ))}
                    </ol>
                )}
            </EsSidePanel>
        </>
    );
}
