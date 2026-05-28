import { certColors, certStatusMap } from './certTheme';

const toneStyles = {
    success: { bg: '#DCFCE7', color: '#166534', border: '#BBF7D0' },
    warn: { bg: '#FEF3C7', color: '#92400E', border: '#FDE68A' },
    danger: { bg: '#FEE2E2', color: '#991B1B', border: '#FECACA' },
    info: { bg: '#DBEAFE', color: '#1E40AF', border: '#BFDBFE' },
    neutral: { bg: '#F1F5F9', color: '#475569', border: '#E2E8F0' },
};

export function CertificacionStatusBadge({ estado, label }) {
    const key = String(estado ?? '').toLowerCase().replace(/\s+/g, '_');
    const meta = certStatusMap[key] ?? { label: label ?? estado ?? '—', tone: 'neutral' };
    const style = toneStyles[meta.tone] ?? toneStyles.neutral;

    return (
        <span
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '3px 10px',
                fontSize: 11,
                fontWeight: 600,
                borderRadius: 999,
                background: style.bg,
                color: style.color,
                border: `1px solid ${style.border}`,
                whiteSpace: 'nowrap',
            }}
        >
            {label ?? meta.label}
        </span>
    );
}

export function CertificacionWorkflowBadge({ workflow, estadoFirma }) {
    if (estadoFirma === 'firmado' || estadoFirma === 'firmando') {
        return <CertificacionStatusBadge estado={estadoFirma} />;
    }
    return <CertificacionStatusBadge estado={workflow} />;
}
