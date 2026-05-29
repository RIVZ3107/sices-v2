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

const ETAPA_LABELS = {
    solicitado_control_escolar: 'Solicitud CE',
    en_validacion_certificador: 'En validación',
    observado_por_certificador: 'Observado',
    validado_por_certificador: 'Validado',
    aprobado_educacion_superior: 'Aprobado ES',
    folio_asignado: 'Folio asignado',
    en_procesamiento: 'En procesamiento',
    pendiente_firma: 'Pendiente firma',
    firmado_timbrado: 'Firmado',
    finalizado: 'Finalizado',
    incidencia_tecnica: 'Incidencia técnica',
    en_revision_sistemas: 'Revisión Sistemas',
    reintentado: 'Reintentado',
};

export function CertificacionWorkflowBadge({ etapa, workflow, estadoFirma, label }) {
    if (label) {
        return <CertificacionStatusBadge estado={etapa ?? workflow} label={label} />;
    }
    if (etapa && ETAPA_LABELS[etapa]) {
        return <CertificacionStatusBadge estado={etapa} label={ETAPA_LABELS[etapa]} />;
    }
    if (estadoFirma === 'error_firma') {
        return <CertificacionStatusBadge estado="incidencia_tecnica" label="Incidencia técnica" />;
    }
    if (estadoFirma === 'firmado' || estadoFirma === 'firmando') {
        return <CertificacionStatusBadge estado={estadoFirma} />;
    }
    return <CertificacionStatusBadge estado={workflow} />;
}
