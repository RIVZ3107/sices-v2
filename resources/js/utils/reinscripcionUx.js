export function getReinscripcionStatusMeta(codigo) {
    const map = {
        iniciada: { bg: '#DBEAFE', color: '#1D4ED8', label: 'Iniciada' },
        en_revision: { bg: '#E0F2FE', color: '#0369A1', label: 'En revisión' },
        bloqueada: { bg: '#FEE2E2', color: '#991B1B', label: 'Bloqueada' },
        observada: { bg: '#FFEDD5', color: '#C2410C', label: 'Observada' },
        por_completar: { bg: '#FEF3C7', color: '#92400E', label: 'Por completar' },
        desbloqueada: { bg: '#EDE9FE', color: '#6D28D9', label: 'Desbloqueada' },
        completada: { bg: '#DCFCE7', color: '#166534', label: 'Completada' },
        cancelada: { bg: '#F1F5F9', color: '#64748B', label: 'Cancelada' },
        en_proceso: { bg: '#DBEAFE', color: '#185FA5', label: 'En proceso' },
    };
    return map[codigo] ?? map.en_revision;
}

export function getProgressSeverity(pct) {
    if (pct >= 90) return { color: '#16a34a' };
    if (pct >= 60) return { color: '#CA8A04' };
    return { color: '#DC2626' };
}
