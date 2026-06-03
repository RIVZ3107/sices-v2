import { checklistAcademicoCertificador } from '../../utils/certificadorUx';

const STYLES = {
    ok: { background: '#f0fdf4', color: '#166534' },
    warning: { background: '#fffbeb', color: '#92400e' },
    error: { background: '#fef2f2', color: '#991b1b' },
};

const ICON = {
    ok: '✓',
    warning: '!',
    error: '✕',
};

export function CertificadorChecklistAcademico({ data, puedeValidar = false }) {
    const items = checklistAcademicoCertificador(data, {
        ocultarBloqueosSiPuedeValidar: true,
        puedeValidar,
    });
    const completas = items.filter((i) => i.severidad === 'ok').length;

    return (
        <div
            style={{
                padding: '12px 14px',
                borderRadius: 10,
                border: '1px solid #e2e8f0',
                background: '#fff',
            }}
        >
            <p style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 600, color: '#0f172a' }}>
                Checklist académico ({completas} de {items.length})
            </p>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 6 }}>
                {items.map((item) => {
                    const sev = item.severidad ?? (item.ok ? 'ok' : 'warning');
                    const style = STYLES[sev] ?? STYLES.warning;
                    return (
                        <li
                            key={item.key}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                                fontSize: 13,
                                padding: '6px 8px',
                                borderRadius: 6,
                                ...style,
                            }}
                        >
                            <span aria-hidden>{ICON[sev] ?? '○'}</span>
                            {item.label}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}
