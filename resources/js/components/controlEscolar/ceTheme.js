/** Tokens y estilos compartidos del módulo Control Escolar — editar aquí para cambiar toda el área. */
export const ceColors = {
    primary: '#185FA5',
    success: '#0F6E56',
    warn: '#BA7517',
    danger: '#DC2626',
    purple: '#534AB7',
    text: '#0f172a',
    muted: '#64748b',
    mutedLight: '#94a3b8',
    border: '#e2e8f0',
    rowBorder: '#f1f5f9',
    pageBg: '#f8fafc',
    white: '#ffffff',
    rowSelected: '#EFF6FF',
    rowHover: '#f8fafc',
    errorText: '#991B1B',
    errorBg: '#FEE2E2',
};

export const ceTheme = {
    pageShell: {
        padding: '24px 32px',
        background: ceColors.pageBg,
        minHeight: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif',
    },
    card: {
        background: ceColors.white,
        borderRadius: 12,
        border: `1px solid ${ceColors.border}`,
        boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
    },
    surface: {
        background: ceColors.white,
        border: `1px solid ${ceColors.border}`,
        borderRadius: 12,
        padding: '20px',
        boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
    },
    surfaceTitle: {
        fontSize: 14,
        fontWeight: 600,
        color: ceColors.text,
        marginBottom: 16,
        paddingBottom: 12,
        borderBottom: `1px solid ${ceColors.rowBorder}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        margin: 0,
    },
    th: {
        background: ceColors.pageBg,
        padding: '14px 16px',
        fontSize: 12,
        fontWeight: 600,
        color: ceColors.muted,
        borderBottom: `1px solid ${ceColors.border}`,
    },
    thCompact: {
        padding: '12px 10px',
        fontSize: 12,
        fontWeight: 600,
        color: ceColors.muted,
        borderBottom: `1px solid ${ceColors.border}`,
        background: ceColors.pageBg,
    },
    td: {
        padding: '16px',
        fontSize: 13,
    },
    tdCompact: {
        padding: '14px 10px',
        fontSize: 13,
    },
    tr: {
        borderBottom: `1px solid ${ceColors.rowBorder}`,
    },
    iconBtn: {
        width: 30,
        height: 30,
        borderRadius: 8,
        border: `1px solid ${ceColors.border}`,
        background: ceColors.white,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        textDecoration: 'none',
    },
    iconBtnLg: {
        width: 32,
        height: 32,
        borderRadius: 8,
        border: `1px solid ${ceColors.border}`,
        background: ceColors.white,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
    },
    btnSecondary: {
        height: 40,
        padding: '0 16px',
        borderRadius: 8,
        border: `1px solid ${ceColors.border}`,
        background: ceColors.white,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 13,
        fontWeight: 500,
        color: ceColors.text,
        cursor: 'pointer',
        textDecoration: 'none',
    },
    btnPrimary: {
        height: 40,
        padding: '0 16px',
        borderRadius: 8,
        background: ceColors.primary,
        color: ceColors.white,
        border: `1px solid ${ceColors.primary}`,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        textDecoration: 'none',
    },
    btnPrimaryBlock: {
        width: '100%',
        height: 42,
        borderRadius: 8,
        border: `1px solid ${ceColors.primary}`,
        background: ceColors.primary,
        color: ceColors.white,
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        marginBottom: 12,
    },
    btnSm: {
        border: `1px solid ${ceColors.border}`,
        background: ceColors.white,
        borderRadius: 8,
        padding: '6px 10px',
        fontSize: 12,
        cursor: 'pointer',
    },
    inputSearch: {
        height: 38,
        paddingLeft: 36,
        border: `1px solid ${ceColors.border}`,
        borderRadius: 8,
        fontSize: 13,
        outline: 'none',
        background: ceColors.white,
    },
    selectFilter: {
        height: 36,
        border: `1px solid ${ceColors.border}`,
        borderRadius: 8,
        padding: '0 10px',
        fontSize: 13,
        background: ceColors.white,
        color: ceColors.text,
        outline: 'none',
    },
    breadcrumb: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
        fontSize: 13,
        color: ceColors.primary,
        fontWeight: 500,
    },
    title: {
        margin: 0,
        fontSize: 32,
        fontWeight: 700,
        color: ceColors.text,
    },
    pageTitle: {
        margin: 0,
        fontSize: 24,
        fontWeight: 700,
        color: ceColors.text,
    },
    subtitle: {
        margin: '8px 0 0',
        color: ceColors.muted,
        fontSize: 14,
    },
    pageHeaderRow: {
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: 24,
        flexWrap: 'wrap',
        gap: 16,
    },
    pageTitleRow: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
    },
    updatedText: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 11,
        color: ceColors.mutedLight,
        margin: 0,
    },
    toolbarRow: {
        display: 'flex',
        gap: 12,
        marginBottom: 24,
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    toolbarGroup: {
        display: 'flex',
        gap: 12,
        flexWrap: 'wrap',
    },
    toolbarAction: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        height: 38,
        padding: '0 16px',
        borderRadius: 8,
        background: ceColors.white,
        border: `1px solid ${ceColors.border}`,
        fontSize: 13,
        fontWeight: 500,
        textDecoration: 'none',
        color: ceColors.text,
    },
    metricsRow: {
        display: 'flex',
        gap: 16,
        marginBottom: 24,
        flexWrap: 'wrap',
    },
    metricsGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: 16,
        marginBottom: 24,
    },
    splitLayout: {
        display: 'grid',
        gridTemplateColumns: '1fr 320px',
        gap: 20,
        alignItems: 'start',
    },
    splitLayout340: {
        display: 'grid',
        gridTemplateColumns: '1fr 340px',
        gap: 16,
        alignItems: 'start',
    },
    sidebarStack: {
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
    },
    sidebarStackSm: {
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
    },
    errorBanner: {
        marginBottom: 16,
        padding: '12px 16px',
        background: ceColors.errorBg,
        color: ceColors.errorText,
        borderRadius: 8,
        fontSize: 13,
    },
    cardHeader: {
        padding: 16,
        borderBottom: `1px solid ${ceColors.border}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 12,
        flexWrap: 'wrap',
    },
    cardFooterBetween: {
        padding: 16,
        borderTop: `1px solid ${ceColors.border}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 8,
        fontSize: 12,
        color: ceColors.muted,
    },
    tdPrimary: {
        fontWeight: 600,
        color: ceColors.primary,
    },
    tdEmphasis: {
        fontWeight: 500,
        color: ceColors.text,
    },
    rowActions: {
        display: 'flex',
        gap: 8,
    },
    emptyHint: {
        margin: 0,
        fontSize: 13,
        color: ceColors.muted,
        textAlign: 'center',
    },
    actionCardGrid: {
        display: 'flex',
        gap: 12,
        marginBottom: 24,
        flexWrap: 'wrap',
    },
    actionCard: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: '14px 16px',
        minWidth: 120,
        borderRadius: 12,
        border: `1px solid ${ceColors.border}`,
        background: ceColors.white,
        textDecoration: 'none',
        color: ceColors.text,
        fontSize: 12,
        fontWeight: 600,
        textAlign: 'center',
        boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
    },
};

export const ceBadgeColors = {
    green: { background: '#DCFCE7', color: '#0F6E56' },
    yellow: { background: '#FEF3C7', color: '#BA7517' },
    red: { background: '#FEE2E2', color: '#DC2626' },
    blue: { background: '#DBEAFE', color: '#185FA5' },
    purple: { background: '#EDE9FE', color: '#534AB7' },
    gray: { background: '#F1F5F9', color: '#64748b' },
    legacyGreen: { background: '#EAF3DE', color: '#3B6D11' },
    legacyYellow: { background: '#FAEEDA', color: '#854F0B' },
    legacyPurple: { background: '#EEEDFE', color: '#534AB7' },
};

export const cePriorityColors = {
    baja: ceBadgeColors.green,
    media: ceBadgeColors.yellow,
    alta: ceBadgeColors.red,
};

export const ceMetricTones = {
    blue: { iconBg: '#DBEAFE', iconColor: '#185FA5' },
    green: { iconBg: '#DCFCE7', iconColor: '#0F6E56' },
    teal: { iconBg: '#CCFBF1', iconColor: '#0F6E56' },
    purple: { iconBg: '#EDE9FE', iconColor: '#534AB7' },
    yellow: { iconBg: '#FEF3C7', iconColor: '#BA7517' },
    red: { iconBg: '#FEE2E2', iconColor: '#DC2626' },
    orange: { iconBg: '#FFEDD5', iconColor: '#EA580C' },
};

export const ceAvatarColors = [
    { bg: '#B5D4F4', text: '#0C447C' },
    { bg: '#C0DD97', text: '#27500A' },
    { bg: '#FAC775', text: '#633806' },
    { bg: '#CECBF6', text: '#3C3489' },
    { bg: '#9FE1CB', text: '#085041' },
];

export const ceHeaderVariants = {
    primary: { ...ceTheme.btnSecondary, background: ceColors.primary, color: ceColors.white, border: `1px solid ${ceColors.primary}`, fontWeight: 600 },
    success: { ...ceTheme.btnSecondary, background: ceColors.success, color: ceColors.white, border: `1px solid ${ceColors.success}`, fontWeight: 600 },
    warn: { ...ceTheme.btnSecondary, background: '#FEF3C7', color: ceColors.warn, border: '1px solid #FEF3C7', fontWeight: 600 },
    danger: { ...ceTheme.btnSecondary, background: '#FEE2E2', color: ceColors.danger, border: '1px solid #FEE2E2', fontWeight: 600 },
    secondary: { ...ceTheme.btnSecondary, fontWeight: 500 },
};

export function formatCeNum(n) {
    return new Intl.NumberFormat('es-MX').format(Number(n) || 0);
}

export function formatCeActualizado(iso) {
    if (!iso) return '—';
    try {
        return new Intl.DateTimeFormat('es-MX', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(iso));
    } catch {
        return '—';
    }
}

export function ceAvatarStyle(index) {
    const c = ceAvatarColors[index % ceAvatarColors.length];
    return { backgroundColor: c.bg, color: c.text };
}

export function ceInitials(nombre = '') {
    return nombre
        .split(' ')
        .slice(0, 2)
        .map((p) => p[0])
        .join('');
}
