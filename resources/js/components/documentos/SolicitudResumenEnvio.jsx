import { clasificarValidaciones } from '../../utils/solicitudDocumentalUx';
import { labelTipoDocumento } from '../../utils/documentosAcademicosTipos';

/**
 * Resumen final antes de enviar al Certificador.
 */
export function SolicitudResumenEnvio({ resumen, tipoDocumento, tipoLabel, checklistEnvio }) {
    const m = resumen?.matricula ?? {};
    const a = resumen?.alumno ?? {};
    const { completas, total, bloqueantes, puedeEnviar } = clasificarValidaciones(checklistEnvio);

    const filas = [
        { k: 'Alumno', v: a.nombre_completo },
        { k: 'Tipo documental', v: tipoLabel ?? labelTipoDocumento(tipoDocumento) },
        { k: 'Institución', v: m.institucion },
        { k: 'Programa / plan', v: m.programa && m.plan_estudios ? `${m.programa} · ${m.plan_estudios}` : m.programa },
        {
            k: 'Validaciones',
            v: puedeEnviar
                ? `${completas} de ${total} listas para envío`
                : `${bloqueantes.length} requisito(s) pendiente(s)`,
        },
    ];

    return (
        <div
            style={{
                padding: '14px 16px',
                borderRadius: 10,
                border: '1px solid #e2e8f0',
                background: '#f8fafc',
            }}
        >
            <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 600, color: '#475569', textTransform: 'uppercase' }}>
                Resumen de la solicitud
            </p>
            <dl style={{ margin: 0, display: 'grid', gap: 8 }}>
                {filas.map((f) => (
                    <div key={f.k} style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8, fontSize: 13 }}>
                        <dt style={{ margin: 0, color: '#64748b' }}>{f.k}</dt>
                        <dd style={{ margin: 0, color: '#0f172a', fontWeight: 500 }}>{f.v || '—'}</dd>
                    </div>
                ))}
            </dl>
        </div>
    );
}
