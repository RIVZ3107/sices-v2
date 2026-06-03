export function formatDateTime(iso) {
    if (!iso) {
        return '—';
    }
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) {
        return '—';
    }
    return d.toLocaleString('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function getExpedienteStatusMeta(codigo) {
    const map = {
        pendiente: { bg: '#FEF3C7', color: '#92400E', label: 'Pendiente' },
        en_revision: { bg: '#DBEAFE', color: '#1D4ED8', label: 'En revisión' },
        observado: { bg: '#FFEDD5', color: '#C2410C', label: 'Observado' },
        completo: { bg: '#DCFCE7', color: '#166534', label: 'Completo' },
        validado: { bg: '#BBF7D0', color: '#14532D', label: 'Validado' },
        rechazado: { bg: '#FEE2E2', color: '#991B1B', label: 'Rechazado' },
    };
    return map[codigo] ?? map.pendiente;
}

export function getProgressSeverity(pct) {
    if (pct >= 90) {
        return { color: '#16a34a', bg: '#DCFCE7' };
    }
    if (pct >= 60) {
        return { color: '#CA8A04', bg: '#FEF3C7' };
    }
    return { color: '#DC2626', bg: '#FEE2E2' };
}
