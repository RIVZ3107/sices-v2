/** Tokens visuales — módulo Certificación (sidebar azul oscuro, superficies blancas). */
export const certColors = {
    sidebar: '#0B1F3A',
    sidebarHover: '#132F5C',
    sidebarActive: '#185FA5',
    sidebarText: '#E2E8F0',
    sidebarMuted: '#94A3B8',
    primary: '#185FA5',
    primaryHover: '#144F8A',
    success: '#0F6E56',
    warn: '#BA7517',
    danger: '#DC2626',
    info: '#2563EB',
    neutral: '#64748B',
    text: '#0f172a',
    muted: '#64748b',
    border: '#e2e8f0',
    rowBorder: '#f1f5f9',
    pageBg: '#f1f5f9',
    white: '#ffffff',
};

export const certTheme = {
    pageShell: {
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        fontFamily: 'system-ui, -apple-system, sans-serif',
    },
    card: {
        background: certColors.white,
        borderRadius: 12,
        border: `1px solid ${certColors.border}`,
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.06)',
        padding: 20,
    },
    btnPrimary: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '8px 14px',
        fontSize: 13,
        fontWeight: 600,
        color: '#fff',
        background: certColors.primary,
        border: 'none',
        borderRadius: 8,
        cursor: 'pointer',
        textDecoration: 'none',
    },
    btnSecondary: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '8px 14px',
        fontSize: 13,
        fontWeight: 600,
        color: certColors.primary,
        background: '#EFF6FF',
        border: `1px solid ${certColors.border}`,
        borderRadius: 8,
        cursor: 'pointer',
        textDecoration: 'none',
    },
    link: {
        fontSize: 13,
        fontWeight: 500,
        color: certColors.primary,
        textDecoration: 'none',
    },
    placeholder: {
        padding: 16,
        borderRadius: 10,
        border: `1px dashed ${certColors.border}`,
        background: '#F8FAFC',
        fontSize: 13,
        color: certColors.muted,
    },
};

export const certStatusMap = {
    borrador: { label: 'Borrador', tone: 'neutral' },
    pendiente: { label: 'Pendiente', tone: 'warn' },
    en_revision: { label: 'En revisión', tone: 'info' },
    pendientes_revision: { label: 'Pend. revisión', tone: 'warn' },
    aprobado: { label: 'Aprobado', tone: 'success' },
    aprobados: { label: 'Aprobado', tone: 'success' },
    rechazado: { label: 'Observado', tone: 'danger' },
    rechazados: { label: 'Observado', tone: 'danger' },
    cancelado: { label: 'Cancelado', tone: 'neutral' },
    listos_para_firma: { label: 'Listo técnico', tone: 'info' },
    firmado: { label: 'Firmado', tone: 'success' },
    firmados: { label: 'Firmado', tone: 'success' },
    error_firma: { label: 'Error firma', tone: 'danger' },
    firmando: { label: 'Firmando', tone: 'warn' },
    no_firmado: { label: 'Sin firmar', tone: 'neutral' },
    entregado: { label: 'Entregado', tone: 'success' },
    pendiente_entrega: { label: 'Pend. entrega', tone: 'warn' },
};

export function formatCertNum(n) {
    if (n === null || n === undefined || Number.isNaN(Number(n))) return '0';
    return new Intl.NumberFormat('es-MX').format(Number(n));
}

export function alumnoNombre(row) {
    const a = row?.alumno;
    if (!a) return '—';
    const nombre = [a.nombre, a.primer_apellido, a.segundo_apellido].filter(Boolean).join(' ');
    return a.nombre_completo ?? (nombre || '—');
}
